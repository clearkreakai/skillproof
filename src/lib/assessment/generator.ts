/**
 * SkillProof Assessment Engine - Generator
 * 
 * The core engine that generates revolutionary assessments.
 * This makes every other assessment platform look like a joke.
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  Assessment,
  AssessmentConfig,
  AssessmentQuestion,
  CompanyResearch,
  RoleResearch,
  QuestionType,
  GenerateAssessmentInput,
  Result,
  DEFAULT_QUESTION_MIX,
  QUESTION_TYPE_CONFIGS,
} from './types';
import { buildAssessmentGenerationPrompt } from './prompts';
import { performFullResearch } from './research';

// ============================================================================
// CLAUDE CLIENT
// ============================================================================

let anthropic: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropic) {
    anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropic;
}

// ============================================================================
// QUESTION MIX CALCULATION
// ============================================================================

/**
 * Calculate the optimal question mix for a role
 */
function calculateQuestionMix(
  role: RoleResearch,
  questionCount: number,
  customMix?: Partial<Record<QuestionType, number>>
): Record<QuestionType, number> {
  // Start with default mix for this role category
  const baseMix = DEFAULT_QUESTION_MIX[role.category] || DEFAULT_QUESTION_MIX.general;
  
  // Apply custom overrides
  const mix = customMix ? { ...baseMix, ...customMix } : baseMix;
  
  // Calculate total in mix
  const totalInMix = Object.values(mix).reduce((sum, count) => sum + (count || 0), 0);
  
  // Scale to requested question count
  const scaleFactor = questionCount / totalInMix;
  
  const scaledMix: Record<string, number> = {};
  let assignedCount = 0;
  
  for (const [type, count] of Object.entries(mix)) {
    if (count && count > 0) {
      const scaled = Math.round(count * scaleFactor);
      if (scaled > 0) {
        scaledMix[type] = scaled;
        assignedCount += scaled;
      }
    }
  }
  
  // Adjust if we're off by rounding
  if (assignedCount < questionCount) {
    // Add to the most important type for this role
    const primaryType = Object.entries(mix)
      .sort((a, b) => (b[1] || 0) - (a[1] || 0))[0][0];
    scaledMix[primaryType] = (scaledMix[primaryType] || 0) + (questionCount - assignedCount);
  } else if (assignedCount > questionCount) {
    // Remove from the least important
    const leastType = Object.entries(scaledMix)
      .sort((a, b) => a[1] - b[1])[0][0];
    scaledMix[leastType] = Math.max(0, scaledMix[leastType] - (assignedCount - questionCount));
  }
  
  return scaledMix as Record<QuestionType, number>;
}

/**
 * Calculate estimated time for the assessment
 */
function calculateEstimatedTime(questionMix: Record<QuestionType, number>): number {
  let totalMinutes = 0;
  
  for (const [type, count] of Object.entries(questionMix)) {
    const config = QUESTION_TYPE_CONFIGS[type as QuestionType];
    if (config) {
      totalMinutes += config.typicalTime * count;
    }
  }
  
  // Add buffer for reading and transitions
  return Math.ceil(totalMinutes * 1.15);
}

// ============================================================================
// ASSESSMENT GENERATION
// ============================================================================

/**
 * Generate a complete assessment from research
 */
async function generateAssessmentFromResearch(
  config: AssessmentConfig
): Promise<Result<Assessment>> {
  const { company, role, questionCount, difficulty } = config;
  
  // Calculate question mix
  const questionMix = calculateQuestionMix(role, questionCount, config.questionMix);
  const estimatedMinutes = calculateEstimatedTime(questionMix);
  
  // Build the prompt
  const prompt = buildAssessmentGenerationPrompt(
    company,
    role,
    questionCount,
    questionMix,
    difficulty,
    estimatedMinutes,
    config.mustInclude
  );
  
  try {
    const client = getAnthropicClient();
    
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });
    
    // Extract text content
    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return {
        success: false,
        error: { code: 'GENERATION_FAILED', message: 'No response from AI' },
      };
    }
    
    // Parse JSON from response
    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        success: false,
        error: { code: 'GENERATION_FAILED', message: 'Could not parse assessment' },
      };
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate and transform questions
    const questions: AssessmentQuestion[] = (parsed.questions || []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (q: Record<string, unknown>, index: number) => transformQuestion(q, index)
    );
    
    if (questions.length === 0) {
      return {
        success: false,
        error: { code: 'GENERATION_FAILED', message: 'No questions generated' },
      };
    }
    
    // Collect all skills tested
    const skillsCovered = [...new Set(questions.flatMap((q) => q.skillsTested))];
    
    // Build the assessment
    const assessment: Assessment = {
      id: generateId(),
      version: '1.0.0',
      createdAt: new Date(),
      company,
      role,
      title: `${role.title} Assessment at ${company.name}`,
      description: `A comprehensive skills assessment for the ${role.title} role at ${company.name}. This assessment tests real-world scenarios you'd face in the first months on the job.`,
      questions,
      estimatedMinutes,
      difficulty,
      skillsCovered,
      generationPrompt: prompt,
    };
    
    return { success: true, data: assessment };
  } catch (error) {
    console.error('Assessment generation error:', error);
    return {
      success: false,
      error: {
        code: 'GENERATION_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error generating assessment',
      },
    };
  }
}

/**
 * Transform raw question data into typed AssessmentQuestion
 */
function transformQuestion(raw: Record<string, unknown>, index: number): AssessmentQuestion {
  const context = raw.context as Record<string, unknown> | undefined;
  return {
    id: (raw.id as string) || `q${index + 1}`,
    type: (raw.type as AssessmentQuestion['type']) || 'communication_draft',
    context: {
      role: (context?.role as string) || 'You are a professional',
      situation: (context?.situation as string) || '',
      constraints: (context?.constraints as string[]) || [],
      stakes: (context?.stakes as string) || '',
      additionalInfo: context?.additionalInfo as Record<string, string> | undefined,
    },
    prompt: (raw.prompt as string) || '',
    parts: raw.parts as AssessmentQuestion['parts'] || undefined,
    expectedFormat: (raw.expectedFormat as AssessmentQuestion['expectedFormat']) || 'long_text',
    wordGuidance: raw.wordGuidance as { min: number; max: number } | undefined,
    timeGuidance: (raw.timeGuidance as number) || 3,
    rubric: transformRubric(raw.rubric as Record<string, unknown> | undefined),
    skillsTested: (raw.skillsTested as string[]) || [],
    whyThisMatters: (raw.whyThisMatters as string) || '',
    whatGreatLooksLike: (raw.whatGreatLooksLike as string) || '',
  };
}

/**
 * Transform raw rubric data into typed ScoringRubric
 */
function transformRubric(raw: Record<string, unknown> | undefined): AssessmentQuestion['rubric'] {
  const defaultDimensions: AssessmentQuestion['rubric']['dimensions'] = [
    { name: 'relevance', weight: 0.25, description: 'Did they address the actual problem?' },
    { name: 'judgment', weight: 0.25, description: 'Did they make good decisions?' },
    { name: 'communication', weight: 0.2, description: 'Was it clear and appropriate?' },
    { name: 'execution', weight: 0.2, description: 'Did they complete the task?' },
    { name: 'company_fit', weight: 0.1, description: 'Does it fit the company context?' },
  ];

  return {
    dimensions: (raw?.dimensions as AssessmentQuestion['rubric']['dimensions']) || defaultDimensions,
    levels: (raw?.levels as AssessmentQuestion['rubric']['levels']) || {},
    redFlags: (raw?.redFlags as string[]) || [],
    bonusIndicators: (raw?.bonusIndicators as string[]) || [],
  };
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `sp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Generate an assessment from a job description
 * This is the main entry point for the assessment engine.
 */
export async function generateAssessment(
  input: GenerateAssessmentInput
): Promise<Result<Assessment>> {
  // Step 1: Research the company and role
  const researchResult = await performFullResearch(
    input.jobDescription,
    input.companyName
  );
  
  if (!researchResult.success) {
    return researchResult as Result<never>;
  }
  
  const { company, role } = researchResult.data;
  
  // Override role title if provided
  if (input.roleTitle) {
    role.title = input.roleTitle;
  }
  
  // Step 2: Build config
  const config: AssessmentConfig = {
    company,
    role,
    questionCount: input.questionCount || 8,
    difficulty: input.difficulty || 'standard',
    mustInclude: input.focusAreas,
  };
  
  // Step 3: Generate the assessment
  return generateAssessmentFromResearch(config);
}

/**
 * Generate an assessment with pre-researched context
 * Use this when you've already done the research.
 */
export async function generateAssessmentWithContext(
  company: CompanyResearch,
  role: RoleResearch,
  options?: {
    questionCount?: number;
    difficulty?: 'standard' | 'challenging' | 'senior';
    focusAreas?: string[];
    questionMix?: Partial<Record<QuestionType, number>>;
  }
): Promise<Result<Assessment>> {
  const config: AssessmentConfig = {
    company,
    role,
    questionCount: options?.questionCount || 8,
    difficulty: options?.difficulty || 'standard',
    mustInclude: options?.focusAreas,
    questionMix: options?.questionMix,
  };
  
  return generateAssessmentFromResearch(config);
}

// ============================================================================
// ASSESSMENT VALIDATION
// ============================================================================

/**
 * Validate an assessment meets quality standards
 */
export function validateAssessment(assessment: Assessment): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  // Check question count
  if (assessment.questions.length < 5) {
    issues.push(`Too few questions: ${assessment.questions.length} (minimum 5)`);
  }
  
  // Check each question
  for (const question of assessment.questions) {
    // Context validation
    if (!question.context.situation || question.context.situation.length < 50) {
      issues.push(`Question ${question.id}: Context too thin (needs more detail)`);
    }
    
    if (question.context.constraints.length === 0) {
      issues.push(`Question ${question.id}: Missing constraints (unrealistic)`);
    }
    
    // Prompt validation
    if (!question.prompt || question.prompt.length < 20) {
      issues.push(`Question ${question.id}: Prompt too short`);
    }
    
    // Check for generic language
    const genericPhrases = ['a company', 'a customer', 'a situation', 'someone'];
    for (const phrase of genericPhrases) {
      if (question.context.situation.toLowerCase().includes(phrase)) {
        issues.push(`Question ${question.id}: Contains generic phrase "${phrase}"`);
      }
    }
    
    // Rubric validation
    if (!question.rubric.dimensions || question.rubric.dimensions.length === 0) {
      issues.push(`Question ${question.id}: Missing scoring dimensions`);
    }
  }
  
  // Check skill coverage
  if (assessment.skillsCovered.length < 3) {
    issues.push('Assessment tests too few skills');
  }
  
  return {
    valid: issues.length === 0,
    issues,
  };
}

// ============================================================================
// EXAMPLE GENERATION (FOR TESTING)
// ============================================================================

/**
 * Generate an example assessment for a well-known role
 * Useful for demos and testing.
 */
export async function generateExampleAssessment(
  roleType: 'sdr' | 'csm' | 'pm' | 'marketing' | 'engineer'
): Promise<Result<Assessment>> {
  const examples: Record<string, { company: string; jobDescription: string }> = {
    sdr: {
      company: 'Stripe',
      jobDescription: `
        Sales Development Representative at Stripe
        
        About the role:
        As an SDR at Stripe, you'll be the first point of contact for potential customers.
        You'll identify, contact, and qualify prospects, creating opportunities for our Account Executives.
        
        Responsibilities:
        - Research and identify potential customers in target segments
        - Execute outbound prospecting via email, phone, and social
        - Qualify inbound leads and route to appropriate AEs
        - Maintain accurate records in Salesforce
        - Hit monthly quota of qualified opportunities
        
        Requirements:
        - 1-2 years of SDR or sales experience
        - Excellent written and verbal communication
        - Understanding of B2B sales processes
        - Experience with CRM systems (Salesforce preferred)
        - Curious about technology and fintech
      `,
    },
    csm: {
      company: 'Figma',
      jobDescription: `
        Customer Success Manager at Figma
        
        About the role:
        You'll own a portfolio of enterprise accounts and ensure they achieve their goals with Figma.
        You'll drive adoption, expansion, and retention while building strong relationships.
        
        Responsibilities:
        - Own 30-50 enterprise accounts ($100K+ ARR each)
        - Drive product adoption and usage growth
        - Identify expansion opportunities and coordinate with sales
        - Conduct QBRs and strategic planning sessions
        - Manage renewal process and reduce churn
        - Serve as voice of customer to product team
        
        Requirements:
        - 3+ years in Customer Success at a SaaS company
        - Experience with design tools or creative workflows
        - Track record of hitting retention and expansion targets
        - Strong communication and presentation skills
        - Analytical mindset with data-driven approach
      `,
    },
    pm: {
      company: 'Notion',
      jobDescription: `
        Product Manager - Mobile at Notion
        
        About the role:
        Lead the mobile experience for Notion, ensuring our iOS and Android apps
        deliver the same magical experience as our web platform.
        
        Responsibilities:
        - Define mobile product strategy and roadmap
        - Work with engineering, design, and research to ship features
        - Analyze metrics and user feedback to prioritize work
        - Balance platform-specific features with cross-platform consistency
        - Coordinate launches with marketing and growth teams
        
        Requirements:
        - 4+ years of product management experience
        - Shipped consumer mobile products
        - Strong analytical and data skills
        - Excellent written communication (we write a lot!)
        - Passion for productivity tools and workflows
      `,
    },
    marketing: {
      company: 'HubSpot',
      jobDescription: `
        Growth Marketing Manager at HubSpot
        
        About the role:
        Drive acquisition and activation for HubSpot's freemium products.
        You'll own campaigns, experiments, and channels that bring in new users.
        
        Responsibilities:
        - Plan and execute demand gen campaigns
        - Manage paid acquisition across channels
        - Optimize conversion funnels from signup to activation
        - Run A/B tests and analyze results
        - Collaborate with product on growth features
        - Report on KPIs and ROI to leadership
        
        Requirements:
        - 4+ years in growth or demand gen marketing
        - Experience with paid media (Google, LinkedIn, Facebook)
        - Strong analytical skills and data fluency
        - Understanding of B2B buyer journey
        - HubSpot certification preferred
      `,
    },
    engineer: {
      company: 'Datadog',
      jobDescription: `
        Senior Software Engineer - Backend at Datadog
        
        About the role:
        Build and scale the systems that process trillions of data points per day.
        Work on distributed systems that handle massive scale with low latency.
        
        Responsibilities:
        - Design and implement backend services in Go
        - Optimize for scale, reliability, and performance
        - Mentor junior engineers and review code
        - Participate in architecture decisions
        - On-call rotation for critical systems
        
        Requirements:
        - 5+ years of backend development experience
        - Strong experience with Go, Python, or Java
        - Distributed systems experience (Kafka, Redis, etc.)
        - Database expertise (Postgres, Cassandra)
        - BS/MS in Computer Science or equivalent
      `,
    },
  };
  
  const example = examples[roleType];
  if (!example) {
    return {
      success: false,
      error: { code: 'INVALID_JOB_DESCRIPTION', message: `Unknown role type: ${roleType}` },
    };
  }
  
  return generateAssessment({
    jobDescription: example.jobDescription,
    companyName: example.company,
    questionCount: 8,
    difficulty: 'standard',
  });
}

/**
 * SkillProof Assessment Engine - Type Definitions
 * 
 * These types power the revolutionary assessment system that makes
 * every other platform look like a joke.
 */

// ============================================================================
// CORE ASSESSMENT TYPES
// ============================================================================

/**
 * The types of questions we generate
 * Each type tests different skills and requires different scoring
 */
export type QuestionType = 
  | 'crisis_simulation'      // Competing priorities (max 2), testing prioritization
  | 'communication_draft'    // Write actual emails, Slacks, messages
  | 'strategic_prioritization' // Resource allocation, tradeoff decisions
  | 'data_interpretation'    // Extract insights from metrics/data
  | 'stakeholder_navigation' // Political savvy, conflict resolution
  | 'reverse_engineering'    // Analyze outcomes, recreate strategies
  | 'artifact_creation'      // Create actual deliverables (briefs, decks, etc.)
  | 'multi_part_scenario'    // Building scenario with escalation
  | 'tools_proficiency'      // Practical knowledge of tools/systems for the job
  | 'operational_workflow';  // Normal day-to-day tasks, routine competence

/**
 * The role categories we optimize questions for
 */
export type RoleCategory = 
  | 'sales'           // SDR, AE, Sales Manager
  | 'customer_success' // CSM, Account Manager
  | 'product'         // PM, Product Designer
  | 'marketing'       // Growth, Content, Brand
  | 'engineering'     // SWE, Engineering Manager
  | 'operations'      // Ops, Strategy, BizOps
  | 'people'          // HR, Recruiting, People Ops
  | 'finance'         // FP&A, Accounting
  | 'general';        // Catch-all

/**
 * Company size affects question context significantly
 */
export type CompanyStage = 
  | 'pre_seed'        // <10 people, scrappy chaos
  | 'seed'            // 10-30 people, finding PMF
  | 'series_a'        // 30-100 people, scaling
  | 'series_b'        // 100-300 people, growth mode
  | 'series_c_plus'   // 300+ people, maturing
  | 'enterprise'      // 1000+ people, corporate
  | 'public';         // Publicly traded

// ============================================================================
// COMPANY & ROLE RESEARCH
// ============================================================================

/**
 * Research gathered about the company
 * This makes questions specific and ungameable
 */
export interface CompanyResearch {
  name: string;
  description: string;
  industry: string;
  stage: CompanyStage;
  employeeCount?: string;
  
  // Products & Business
  products: string[];
  targetCustomers: string[];
  businessModel: string;
  
  // Culture & Values
  values: string[];
  culture: string;
  
  // Market Context
  competitors: string[];
  recentNews: string[];
  challenges: string[];
  
  // For question generation
  typicalStakeholders: string[];
  commonMetrics: string[];
  
  // Raw data source
  sourceUrl?: string;
  fetchedAt: Date;
}

/**
 * Research about the specific role
 */
export interface RoleResearch {
  title: string;
  category: RoleCategory;
  level: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
  
  // Day-to-day
  responsibilities: string[];
  deliverables: string[];
  stakeholders: string[];
  
  // Skills
  hardSkills: string[];
  softSkills: string[];
  tools: string[];
  
  // Context
  commonChallenges: string[];
  successMetrics: string[];
  
  // From job description
  rawJobDescription?: string;
}

// ============================================================================
// QUESTION STRUCTURE
// ============================================================================

/**
 * Scoring dimension - what we actually measure
 */
export interface ScoringDimension {
  name: 'relevance' | 'judgment' | 'communication' | 'execution' | 'company_fit' | 'technical_proficiency';
  weight: number;  // 0-1, weights should sum to 1
  description: string;
}

/**
 * Level descriptors for scoring
 */
export interface RubricLevel {
  score: number;  // 1-5
  label: 'poor' | 'weak' | 'adequate' | 'good' | 'excellent';
  description: string;
  indicators: string[];  // Specific things to look for
}

/**
 * Complete scoring rubric for a question
 */
export interface ScoringRubric {
  dimensions: ScoringDimension[];
  levels: Record<string, RubricLevel[]>;  // dimension name -> levels
  redFlags: string[];  // Instant disqualifiers
  bonusIndicators: string[];  // Signs of exceptional thinking
}

/**
 * Context block that sets up the scenario
 */
export interface ScenarioContext {
  role: string;           // "You're a PM at Notion"
  situation: string;      // The detailed scenario
  constraints: string[];  // Time limits, resource limits, authority limits
  stakes: string;         // What happens if they succeed/fail
  additionalInfo?: Record<string, string>;  // Extra context, data, etc.
}

/**
 * A single question in an assessment
 */
export interface AssessmentQuestion {
  id: string;
  type: QuestionType;
  
  // The question itself
  context: ScenarioContext;
  prompt: string;  // The actual question/instruction
  
  // For multi-part questions
  parts?: {
    id: string;
    prompt: string;
    dependsOn?: string;  // Previous part ID
  }[];
  
  // Response expectations
  expectedFormat: 'short_text' | 'long_text' | 'email' | 'slack' | 'bullet_list' | 'structured';
  wordGuidance?: { min: number; max: number };
  timeGuidance: number;  // Suggested minutes
  
  // Scoring
  rubric: ScoringRubric;
  skillsTested: string[];
  
  // Explanation (shown after)
  whyThisMatters: string;
  whatGreatLooksLike: string;
}

// ============================================================================
// ASSESSMENT STRUCTURE
// ============================================================================

/**
 * Configuration for generating an assessment
 */
export interface AssessmentConfig {
  company: CompanyResearch;
  role: RoleResearch;
  
  // Customization
  questionCount: number;  // 8-10 recommended
  timeLimit?: number;  // Total minutes (optional)
  difficulty: 'standard' | 'challenging' | 'senior';
  
  // Question mix preferences
  questionMix?: Partial<Record<QuestionType, number>>;
  
  // Special requirements
  mustInclude?: string[];  // Specific skills that must be tested
  avoid?: string[];  // Topics to avoid
}

/**
 * A complete assessment
 */
export interface Assessment {
  id: string;
  version: string;
  createdAt: Date;
  
  // Context
  company: CompanyResearch;
  role: RoleResearch;
  
  // Content
  title: string;
  description: string;
  questions: AssessmentQuestion[];
  
  // Logistics
  estimatedMinutes: number;
  difficulty: 'standard' | 'challenging' | 'senior';
  
  // Metadata
  skillsCovered: string[];
  generationPrompt?: string;  // For debugging
}

// ============================================================================
// RESPONSE & SCORING
// ============================================================================

/**
 * A candidate's response to a question
 */
export interface QuestionResponse {
  questionId: string;
  response: string;
  partResponses?: Record<string, string>;  // For multi-part questions
  startedAt: Date;
  submittedAt: Date;
  timeSpentSeconds: number;
}

/**
 * Score for a single dimension
 */
export interface DimensionScore {
  dimension: ScoringDimension['name'];
  score: number;  // 1-5
  weight: number;
  weightedScore: number;
  feedback: string;
  evidence: string[];  // Quotes/examples from their response
}

/**
 * Complete score for a single question
 */
export interface QuestionScore {
  questionId: string;
  dimensionScores: DimensionScore[];
  overallScore: number;  // 1-5, weighted average
  
  // Feedback
  strengths: string[];
  improvements: string[];
  specificFeedback: string;
  
  // Flags
  redFlagsTriggered: string[];
  bonusesEarned: string[];
}

/**
 * Complete assessment result
 */
export interface AssessmentResult {
  id: string;
  assessmentId: string;
  
  // Timing
  startedAt: Date;
  completedAt: Date;
  totalTimeSeconds: number;
  
  // Responses
  responses: QuestionResponse[];
  
  // Scores
  questionScores: QuestionScore[];
  overallScore: number;  // 0-100
  
  // Summary
  tier: 'exceptional' | 'strong' | 'qualified' | 'developing' | 'not_ready';
  summary: string;
  topStrengths: string[];
  areasForGrowth: string[];
  
  // For sharing
  shareToken?: string;
  publicUrl?: string;
}

// ============================================================================
// API TYPES
// ============================================================================

/**
 * Input for generating an assessment
 */
export interface GenerateAssessmentInput {
  jobDescription: string;
  companyName?: string;
  roleTitle?: string;
  
  // Optional overrides
  questionCount?: number;
  difficulty?: 'standard' | 'challenging' | 'senior';
  focusAreas?: string[];
}

/**
 * Input for scoring a response
 */
export interface ScoreResponseInput {
  assessmentId: string;
  questionId: string;
  response: string;
  timeSpentSeconds: number;
}

/**
 * Error types for the engine
 */
export type AssessmentError = 
  | { code: 'INVALID_JOB_DESCRIPTION'; message: string }
  | { code: 'COMPANY_NOT_FOUND'; message: string }
  | { code: 'GENERATION_FAILED'; message: string }
  | { code: 'SCORING_FAILED'; message: string }
  | { code: 'RATE_LIMITED'; message: string; retryAfterMs: number }
  | { code: 'INTERNAL_ERROR'; message: string };

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Result wrapper for operations that can fail
 */
export type Result<T, E = AssessmentError> = 
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Async result type - use Promise<Result<T, E>> in function return types
 * This type alias is for documentation purposes
 */
export type AsyncResult<T, E = AssessmentError> = Promise<Result<T, E>>;

/**
 * Question type configuration for the generator
 */
export interface QuestionTypeConfig {
  type: QuestionType;
  description: string;
  bestFor: RoleCategory[];
  typicalTime: number;  // minutes
  skillsUsuallyTested: string[];
}

/**
 * Registry of question types with their configurations
 */
export const QUESTION_TYPE_CONFIGS: Record<QuestionType, QuestionTypeConfig> = {
  crisis_simulation: {
    type: 'crisis_simulation',
    description: 'Multiple simultaneous fires that test prioritization and composure',
    bestFor: ['customer_success', 'operations', 'product'],
    typicalTime: 5,
    skillsUsuallyTested: ['prioritization', 'decision_making', 'stress_management', 'communication']
  },
  communication_draft: {
    type: 'communication_draft',
    description: 'Write actual emails, Slack messages, or other communications',
    bestFor: ['sales', 'customer_success', 'marketing', 'people'],
    typicalTime: 3,
    skillsUsuallyTested: ['written_communication', 'tone', 'persuasion', 'empathy']
  },
  strategic_prioritization: {
    type: 'strategic_prioritization',
    description: 'Resource allocation decisions with competing options',
    bestFor: ['product', 'marketing', 'operations', 'engineering'],
    typicalTime: 4,
    skillsUsuallyTested: ['strategic_thinking', 'tradeoff_analysis', 'business_acumen']
  },
  data_interpretation: {
    type: 'data_interpretation',
    description: 'Extract insights and recommendations from metrics/data',
    bestFor: ['product', 'marketing', 'finance', 'operations'],
    typicalTime: 4,
    skillsUsuallyTested: ['analytical_thinking', 'data_literacy', 'insight_generation']
  },
  stakeholder_navigation: {
    type: 'stakeholder_navigation',
    description: 'Navigate conflicts between stakeholders with competing interests',
    bestFor: ['product', 'operations', 'people', 'general'],
    typicalTime: 4,
    skillsUsuallyTested: ['political_savvy', 'conflict_resolution', 'influence', 'diplomacy']
  },
  reverse_engineering: {
    type: 'reverse_engineering',
    description: 'Analyze successful outcomes and explain the strategy behind them',
    bestFor: ['marketing', 'sales', 'product'],
    typicalTime: 5,
    skillsUsuallyTested: ['analytical_thinking', 'pattern_recognition', 'strategic_thinking']
  },
  artifact_creation: {
    type: 'artifact_creation',
    description: 'Create actual deliverables like briefs, plans, or documents',
    bestFor: ['marketing', 'product', 'operations'],
    typicalTime: 6,
    skillsUsuallyTested: ['execution', 'organization', 'thoroughness', 'clarity']
  },
  multi_part_scenario: {
    type: 'multi_part_scenario',
    description: 'Building scenario that tests consistency and adaptation',
    bestFor: ['customer_success', 'sales', 'product'],
    typicalTime: 8,
    skillsUsuallyTested: ['consistency', 'adaptation', 'depth_of_thinking', 'follow_through']
  },
  tools_proficiency: {
    type: 'tools_proficiency',
    description: 'Practical knowledge of tools and systems required for the job',
    bestFor: ['sales', 'customer_success', 'marketing', 'finance', 'operations', 'engineering'],
    typicalTime: 4,
    skillsUsuallyTested: ['technical_proficiency', 'tool_fluency', 'practical_knowledge', 'workflow_efficiency']
  },
  operational_workflow: {
    type: 'operational_workflow',
    description: 'Normal day-to-day tasks that test routine competence and work habits',
    bestFor: ['general', 'sales', 'customer_success', 'product', 'marketing', 'operations', 'engineering'],
    typicalTime: 4,
    skillsUsuallyTested: ['organization', 'planning', 'process_discipline', 'attention_to_detail', 'routine_execution']
  }
};

/**
 * Default question mix by role category
 */
export const DEFAULT_QUESTION_MIX: Record<RoleCategory, Partial<Record<QuestionType, number>>> = {
  sales: {
    communication_draft: 2,
    crisis_simulation: 1,
    strategic_prioritization: 1,
    stakeholder_navigation: 1,
    multi_part_scenario: 1,
    tools_proficiency: 1,
    operational_workflow: 1  // Normal day: pipeline review, prep for calls, etc.
  },
  customer_success: {
    communication_draft: 2,
    crisis_simulation: 1,
    stakeholder_navigation: 1,
    data_interpretation: 1,
    multi_part_scenario: 1,
    tools_proficiency: 1,
    operational_workflow: 1  // Normal day: health check, renewal prep, etc.
  },
  product: {
    strategic_prioritization: 2,
    data_interpretation: 1,
    stakeholder_navigation: 1,
    artifact_creation: 1,
    communication_draft: 1,
    tools_proficiency: 1,
    operational_workflow: 1  // Normal day: PRD update, sprint planning, etc.
  },
  marketing: {
    strategic_prioritization: 1,
    artifact_creation: 1,
    reverse_engineering: 1,
    data_interpretation: 1,
    communication_draft: 2,
    tools_proficiency: 1,
    operational_workflow: 1  // Normal day: campaign review, content planning, etc.
  },
  engineering: {
    strategic_prioritization: 1,
    stakeholder_navigation: 1,
    artifact_creation: 2,
    data_interpretation: 1,
    communication_draft: 1,
    tools_proficiency: 1,
    operational_workflow: 1  // Normal day: code review, PR feedback, etc.
  },
  operations: {
    crisis_simulation: 1,
    strategic_prioritization: 1,
    data_interpretation: 2,
    artifact_creation: 1,
    stakeholder_navigation: 1,
    tools_proficiency: 1,
    operational_workflow: 1  // Normal day: process documentation, metrics review
  },
  people: {
    communication_draft: 2,
    stakeholder_navigation: 2,
    crisis_simulation: 1,
    artifact_creation: 1,
    tools_proficiency: 1,
    operational_workflow: 1  // Normal day: interview prep, policy review
  },
  finance: {
    data_interpretation: 2,
    strategic_prioritization: 1,
    artifact_creation: 2,
    communication_draft: 1,
    tools_proficiency: 1,
    operational_workflow: 1  // Normal day: reconciliation, report prep
  },
  general: {
    communication_draft: 2,
    strategic_prioritization: 1,
    stakeholder_navigation: 1,
    crisis_simulation: 1,
    data_interpretation: 1,
    tools_proficiency: 1,
    operational_workflow: 1  // Normal day: weekly planning, status updates
  }
};

/**
 * Role category to common tools mapping
 * Used to infer tools when not explicitly mentioned in JD
 */
export const ROLE_TOOLS_MAPPING: Record<RoleCategory, {
  primary: string[];
  secondary: string[];
  basicSkills: string[];
}> = {
  sales: {
    primary: ['Salesforce', 'HubSpot', 'Outreach', 'SalesLoft', 'Gong', 'LinkedIn Sales Navigator'],
    secondary: ['ZoomInfo', 'Apollo', 'Clari', 'Chorus', 'Calendly'],
    basicSkills: ['CRM management', 'Pipeline tracking', 'Email sequences', 'Calendar management']
  },
  customer_success: {
    primary: ['Gainsight', 'ChurnZero', 'Totango', 'Salesforce', 'Zendesk'],
    secondary: ['Intercom', 'Freshdesk', 'Pendo', 'Mixpanel', 'Looker'],
    basicSkills: ['Customer health scoring', 'Ticket management', 'Usage analytics', 'QBR preparation']
  },
  product: {
    primary: ['Jira', 'Figma', 'Notion', 'ProductBoard', 'Linear'],
    secondary: ['Amplitude', 'Mixpanel', 'FullStory', 'Miro', 'Confluence'],
    basicSkills: ['Roadmap planning', 'User research documentation', 'Sprint planning', 'Feature prioritization']
  },
  marketing: {
    primary: ['Google Analytics', 'HubSpot', 'Marketo', 'Semrush', 'Hootsuite'],
    secondary: ['Mailchimp', 'Buffer', 'Canva', 'Ahrefs', 'Google Ads'],
    basicSkills: ['Campaign tracking', 'A/B testing', 'Content scheduling', 'Lead scoring']
  },
  engineering: {
    primary: ['Git', 'GitHub/GitLab', 'VS Code', 'Docker', 'AWS/GCP/Azure'],
    secondary: ['Datadog', 'Sentry', 'Jenkins', 'Terraform', 'Kubernetes'],
    basicSkills: ['Version control', 'CI/CD pipelines', 'Code review', 'Debugging tools']
  },
  operations: {
    primary: ['Google Workspace', 'Slack', 'Asana', 'Monday.com', 'Notion'],
    secondary: ['Zapier', 'Airtable', 'Confluence', 'Trello', 'Smartsheet'],
    basicSkills: ['Project tracking', 'Process documentation', 'Workflow automation', 'Resource planning']
  },
  people: {
    primary: ['Greenhouse', 'Lever', 'Workday', 'BambooHR', 'LinkedIn Recruiter'],
    secondary: ['Culture Amp', 'Lattice', '15Five', 'Namely', 'Rippling'],
    basicSkills: ['ATS management', 'Candidate sourcing', 'Interview scheduling', 'Performance tracking']
  },
  finance: {
    primary: ['Excel', 'Google Sheets', 'NetSuite', 'QuickBooks', 'SAP'],
    secondary: ['Tableau', 'Power BI', 'Stripe', 'Expensify', 'Bill.com'],
    basicSkills: ['Financial modeling', 'Pivot tables', 'VLOOKUP/INDEX-MATCH', 'Data visualization']
  },
  general: {
    primary: ['Google Workspace', 'Microsoft Office', 'Slack', 'Zoom'],
    secondary: ['Notion', 'Asana', 'Trello', 'Calendly'],
    basicSkills: ['Email communication', 'Calendar management', 'Document creation', 'Video conferencing']
  }
};

/**
 * Tool confidence levels for calibrating question depth
 */
export type ToolConfidence = 'explicit' | 'company_inferred' | 'role_inferred';

/**
 * Tools research result with confidence
 */
export interface ToolsResearch {
  tools: string[];
  confidence: ToolConfidence;
  source: 'job_description' | 'company_research' | 'role_inference';
}

/**
 * SkillProof Assessment Engine - Prompt Templates
 * 
 * These prompts power the AI that generates revolutionary assessments.
 * Every prompt is designed to produce questions that make generic answers impossible.
 */

import type {
  CompanyResearch,
  RoleResearch,
  AssessmentQuestion,
} from './types';

// ============================================================================
// COMPANY RESEARCH PROMPTS
// ============================================================================

export const COMPANY_RESEARCH_PROMPT = `You are a company research expert. Extract detailed information about a company that will be used to generate hyper-specific job assessment questions.

COMPANY NAME: {{companyName}}
{{#if additionalContext}}
ADDITIONAL CONTEXT: {{additionalContext}}
{{/if}}

Research and provide:

1. **Company Overview**
   - What does the company do? (1-2 sentences)
   - Industry and business model
   - Company stage and approximate size
   - Target customers

2. **Products & Services**
   - Main products/services (list 2-5)
   - What makes them different from competitors

3. **Culture & Values**
   - Stated or implied company values
   - Culture indicators (fast-paced, methodical, etc.)
   - Work style expectations

4. **Market Context**
   - Top 3 competitors
   - Recent news or changes (if known)
   - Current challenges or opportunities

5. **Operational Context**
   - Typical stakeholders employees work with
   - Common metrics used to measure success
   - Tools commonly used (if known)

Format your response as JSON matching this structure:
{
  "name": "Company Name",
  "description": "Brief description",
  "industry": "Industry",
  "stage": "pre_seed|seed|series_a|series_b|series_c_plus|enterprise|public",
  "employeeCount": "approximate range",
  "products": ["product1", "product2"],
  "targetCustomers": ["customer type 1", "customer type 2"],
  "businessModel": "How they make money",
  "values": ["value1", "value2"],
  "culture": "Culture description",
  "competitors": ["competitor1", "competitor2"],
  "recentNews": ["news item 1 if known"],
  "challenges": ["challenge1", "challenge2"],
  "typicalStakeholders": ["stakeholder1", "stakeholder2"],
  "commonMetrics": ["metric1", "metric2"]
}

Be specific. If you don't have information about something, make reasonable inferences based on the company type and industry. Never leave fields empty - provide your best educated assessment.`;

// ============================================================================
// ROLE RESEARCH PROMPTS
// ============================================================================

export const ROLE_EXTRACTION_PROMPT = `You are a job description analyst. Extract structured information about the role that will be used to generate hyper-specific assessment questions.

JOB DESCRIPTION:
{{jobDescription}}

{{#if companyContext}}
COMPANY CONTEXT:
{{companyContext}}
{{/if}}

Analyze and extract:

1. **Role Basics**
   - Exact job title
   - Role category (sales, customer_success, product, marketing, engineering, operations, people, finance, general)
   - Level (entry, mid, senior, lead, executive)

2. **Day-to-Day Work**
   - Top 5 responsibilities (what they'll actually do daily)
   - Deliverables they'll produce
   - Who they'll work with (stakeholders)

3. **Skills Required**
   - Hard skills (technical, tools, methods)
   - Soft skills (communication, leadership, etc.)
   - Specific tools mentioned

4. **Context**
   - Biggest challenges they'll face
   - How success is measured
   - Unique aspects of this role

Format your response as JSON:
{
  "title": "Exact Job Title",
  "category": "sales|customer_success|product|marketing|engineering|operations|people|finance|general",
  "level": "entry|mid|senior|lead|executive",
  "responsibilities": ["responsibility1", "responsibility2", ...],
  "deliverables": ["deliverable1", "deliverable2", ...],
  "stakeholders": ["stakeholder1", "stakeholder2", ...],
  "hardSkills": ["skill1", "skill2", ...],
  "softSkills": ["skill1", "skill2", ...],
  "tools": ["tool1", "tool2", ...],
  "commonChallenges": ["challenge1", "challenge2", ...],
  "successMetrics": ["metric1", "metric2", ...]
}

Be thorough. Extract everything relevant, even if implied. This data will be used to create realistic assessment scenarios.`;

// ============================================================================
// QUESTION GENERATION PROMPTS
// ============================================================================

/**
 * Master prompt for generating an entire assessment
 */
export const ASSESSMENT_GENERATION_PROMPT = `You are the SkillProof Assessment Engine - a revolutionary system that creates job assessments so realistic that candidates feel like they're on Day 1 of the job.

YOUR PHILOSOPHY:
- Questions must be UNGAMEABLE - generic answers should be obviously wrong
- Every scenario needs CONTEXT (company, role, stakeholders, history)
- Every scenario needs CONSTRAINTS (time, resources, authority)
- Every scenario needs STAKES (what happens if they succeed/fail)
- Require ACTUAL DELIVERABLES, not descriptions of what they'd do
- Use NAMED COMPANIES and REAL DETAILS - never "a company" or "a customer"

COMPANY CONTEXT:
{{companyJson}}

ROLE CONTEXT:
{{roleJson}}

ASSESSMENT REQUIREMENTS:
- Generate {{questionCount}} questions
- Difficulty: {{difficulty}}
- Time target: {{estimatedMinutes}} minutes total
{{#if focusAreas}}
- Must test these areas: {{focusAreas}}
{{/if}}

QUESTION MIX TO GENERATE:
{{questionMixJson}}

FOR EACH QUESTION, PROVIDE:

1. **Type**: The question type (from the mix)

2. **Context Block**:
   - role: "You're a [specific role] at [company name]" 
   - situation: Rich, specific scenario with names, numbers, history
   - constraints: Array of real limitations (time, resources, authority, information)
   - stakes: What happens if they succeed/fail

3. **Prompt**: The actual instruction. Be direct. "Write the email" not "What would you write?"

4. **Expected Format**: short_text, long_text, email, slack, bullet_list, or structured

5. **Time Guidance**: How many minutes this should take (be realistic)

6. **Skills Tested**: Array of specific skills this measures

7. **Scoring Rubric**:
   - dimensions: Array of {name, weight, description} (weights sum to 1)
   - levels: For each dimension, what does 1-5 look like?
   - redFlags: Instant disqualifiers
   - bonusIndicators: Signs of exceptional thinking

8. **Why This Matters**: 2-3 sentences on why this skill matters for the role

9. **What Great Looks Like**: Brief description of an excellent response

QUESTION TYPE GUIDANCE:

**crisis_simulation**: Multiple fires at once, test prioritization
- Include 3-4 competing urgent issues
- Make some clearly more important than others
- Force tradeoffs (can't do everything)

**communication_draft**: Write the actual message
- Specific recipient with context
- High-stakes situation (negotiation, bad news, persuasion)
- Include subtle constraints (authority level, relationship history)

**strategic_prioritization**: Resource allocation decision
- Multiple options with pros/cons
- Fixed constraint (budget, time, headcount)
- No obviously correct answer

**data_interpretation**: Extract insights from metrics
- Provide realistic data (table or metrics)
- Include a non-obvious insight to find
- Ask for both analysis AND recommendation

**stakeholder_navigation**: Navigate competing interests
- Two+ stakeholders with valid but conflicting positions
- Candidate is in the middle
- No "right" side to take

**reverse_engineering**: Explain success
- Reference a real or realistic company success
- Ask them to explain HOW it happened
- Then ask them to apply it to a new situation

**artifact_creation**: Create the actual thing
- Specific deliverable (brief, plan, agenda, etc.)
- Clear audience and purpose
- Realistic scope for the time given

**multi_part_scenario**: Building, escalating situation
- Part 1: Initial situation and response
- Part 2: Situation changes/escalates
- Part 3: Reflect on what happened
- Tests consistency and adaptation

FORMAT YOUR RESPONSE AS JSON:
{
  "questions": [
    {
      "id": "q1",
      "type": "question_type",
      "context": {
        "role": "You're a ...",
        "situation": "Detailed scenario...",
        "constraints": ["constraint1", "constraint2"],
        "stakes": "What's at risk..."
      },
      "prompt": "The actual question/instruction",
      "parts": null or [{"id": "p1", "prompt": "..."}, ...] for multi-part,
      "expectedFormat": "short_text|long_text|email|slack|bullet_list|structured",
      "wordGuidance": {"min": 50, "max": 200} or null,
      "timeGuidance": 3,
      "skillsTested": ["skill1", "skill2"],
      "rubric": {
        "dimensions": [
          {"name": "relevance|judgment|communication|execution|company_fit", "weight": 0.3, "description": "..."}
        ],
        "levels": {
          "relevance": [
            {"score": 5, "label": "excellent", "description": "...", "indicators": ["...", "..."]},
            {"score": 4, "label": "good", "description": "...", "indicators": ["..."]},
            {"score": 3, "label": "adequate", "description": "...", "indicators": ["..."]},
            {"score": 2, "label": "weak", "description": "...", "indicators": ["..."]},
            {"score": 1, "label": "poor", "description": "...", "indicators": ["..."]}
          ]
        },
        "redFlags": ["flag1", "flag2"],
        "bonusIndicators": ["bonus1", "bonus2"]
      },
      "whyThisMatters": "Why this skill matters for the role...",
      "whatGreatLooksLike": "Description of excellent response..."
    }
  ]
}

QUALITY CHECKS BEFORE FINALIZING:
1. Could someone pass this with a generic, polished answer? If yes, make it more specific.
2. Does this feel like real work at this company? If not, add more context.
3. Is the time guidance realistic? 
4. Does the rubric differentiate between good and great?
5. Would a hiring manager learn something useful from this response?

Generate the assessment now.`;

// ============================================================================
// SCORING PROMPTS
// ============================================================================

export const SCORE_RESPONSE_PROMPT = `You are the SkillProof Scoring Engine. Your job is to evaluate a candidate's response with nuance, specificity, and actionable feedback.

CONTEXT:
The candidate is applying for: {{roleTitle}} at {{companyName}}

QUESTION:
{{questionJson}}

CANDIDATE'S RESPONSE:
{{response}}

TIME SPENT: {{timeSpentSeconds}} seconds

SCORING RUBRIC:
{{rubricJson}}

EVALUATE THE RESPONSE:

1. **For each scoring dimension**, provide:
   - Score (1-5)
   - Specific feedback explaining the score
   - Evidence: Direct quotes or observations from their response

2. **Check for red flags**: Did they trigger any red flags from the rubric?

3. **Check for bonus indicators**: Did they demonstrate exceptional thinking?

4. **Calculate overall score**: Weighted average of dimension scores

5. **Provide feedback**:
   - Strengths: What did they do well? Be specific.
   - Improvements: What could be better? Be actionable.
   - Specific feedback: Personalized coaching for this response

FORMAT YOUR RESPONSE AS JSON:
{
  "dimensionScores": [
    {
      "dimension": "relevance|judgment|communication|execution|company_fit",
      "score": 4,
      "weight": 0.3,
      "weightedScore": 1.2,
      "feedback": "Specific feedback...",
      "evidence": ["Quote or observation from response", "..."]
    }
  ],
  "overallScore": 4.2,
  "strengths": ["Strength 1 with specifics", "Strength 2"],
  "improvements": ["Specific, actionable improvement 1", "..."],
  "specificFeedback": "Personalized paragraph of feedback...",
  "redFlagsTriggered": ["flag if any"] or [],
  "bonusesEarned": ["bonus if any"] or []
}

SCORING PHILOSOPHY:
- Be fair but rigorous. A 5 should be genuinely excellent, not just good.
- A 3 is adequate - they'd survive but not thrive.
- Evidence must come from their actual response, not assumptions.
- Feedback should be actionable - tell them exactly what to do differently.
- Consider the time spent - rushing through might explain brevity.
- Consider the specific company context - generic answers score lower.`;

// ============================================================================
// RESULTS SUMMARY PROMPT
// ============================================================================

export const GENERATE_SUMMARY_PROMPT = `You are generating the final assessment summary for a SkillProof evaluation.

ROLE: {{roleTitle}} at {{companyName}}
OVERALL SCORE: {{overallScore}}/100

QUESTION SCORES:
{{questionScoresJson}}

GENERATE A COMPREHENSIVE SUMMARY:

1. **Tier Assignment** (based on overall score):
   - 90-100: "exceptional" - Top-tier candidate, hire signal
   - 75-89: "strong" - Solid candidate, worth interviewing
   - 60-74: "qualified" - Meets bar, investigate further
   - 45-59: "developing" - Not quite there yet
   - 0-44: "not_ready" - Significant gaps

2. **Summary** (2-3 paragraphs):
   - Overall impression of the candidate
   - How they'd likely perform in this role
   - Key differentiators (good or bad)

3. **Top Strengths** (3-5 items):
   - Their best demonstrated skills
   - Be specific, reference their actual responses

4. **Areas for Growth** (2-4 items):
   - Where they need development
   - Frame constructively but honestly

FORMAT AS JSON:
{
  "tier": "exceptional|strong|qualified|developing|not_ready",
  "summary": "Comprehensive summary paragraphs...",
  "topStrengths": ["Specific strength 1", "Specific strength 2", ...],
  "areasForGrowth": ["Growth area 1", "Growth area 2", ...]
}

Be honest and specific. This summary will be shared with employers and should give them a clear picture of this candidate's capabilities for THIS specific role.`;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Fill in a prompt template with data
 */
export function fillTemplate(template: string, data: Record<string, unknown>): string {
  let result = template;
  
  // Handle conditionals: {{#if key}}content{{/if}}
  result = result.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, key, content) => {
    return data[key] ? content : '';
  });
  
  // Handle JSON inserts: {{keyJson}}
  result = result.replace(/\{\{(\w+)Json\}\}/g, (_, key) => {
    const value = data[key];
    return value ? JSON.stringify(value, null, 2) : 'null';
  });
  
  // Handle simple replacements: {{key}}
  result = result.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const value = data[key];
    if (value === undefined || value === null) return '';
    return String(value);
  });
  
  return result;
}

/**
 * Build the company research prompt
 */
export function buildCompanyResearchPrompt(companyName: string, additionalContext?: string): string {
  return fillTemplate(COMPANY_RESEARCH_PROMPT, {
    companyName,
    additionalContext,
  });
}

/**
 * Build the role extraction prompt
 */
export function buildRoleExtractionPrompt(jobDescription: string, companyContext?: CompanyResearch): string {
  return fillTemplate(ROLE_EXTRACTION_PROMPT, {
    jobDescription,
    companyContext: companyContext ? JSON.stringify(companyContext, null, 2) : null,
  });
}

/**
 * Build the assessment generation prompt
 */
export function buildAssessmentGenerationPrompt(
  company: CompanyResearch,
  role: RoleResearch,
  questionCount: number,
  questionMix: Record<string, number>,
  difficulty: string,
  estimatedMinutes: number,
  focusAreas?: string[]
): string {
  return fillTemplate(ASSESSMENT_GENERATION_PROMPT, {
    company,
    role,
    questionCount,
    questionMix,
    difficulty,
    estimatedMinutes,
    focusAreas: focusAreas?.join(', '),
  });
}

/**
 * Build the scoring prompt for a response
 */
export function buildScoreResponsePrompt(
  roleTitle: string,
  companyName: string,
  question: AssessmentQuestion,
  response: string,
  timeSpentSeconds: number
): string {
  return fillTemplate(SCORE_RESPONSE_PROMPT, {
    roleTitle,
    companyName,
    question,
    response,
    timeSpentSeconds,
    rubric: question.rubric,
  });
}

/**
 * Build the summary generation prompt
 */
export function buildSummaryPrompt(
  roleTitle: string,
  companyName: string,
  overallScore: number,
  questionScores: unknown[]
): string {
  return fillTemplate(GENERATE_SUMMARY_PROMPT, {
    roleTitle,
    companyName,
    overallScore,
    questionScores,
  });
}

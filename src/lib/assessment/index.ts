/**
 * SkillProof Assessment Engine
 * 
 * Revolutionary skills assessment that makes every other platform look like a joke.
 * 
 * Usage:
 * ```typescript
 * import { generateAssessment, scoreAssessment } from '@/lib/assessment';
 * 
 * // Generate an assessment from a job description
 * const result = await generateAssessment({
 *   jobDescription: '...',
 *   companyName: 'Stripe',  // optional
 *   questionCount: 8,       // optional, default 8
 * });
 * 
 * if (result.success) {
 *   const assessment = result.data;
 *   // Present assessment to user...
 * }
 * 
 * // Score responses
 * const scoringResult = await scoreAssessment(assessment, responses);
 * if (scoringResult.success) {
 *   const result = scoringResult.data;
 *   console.log(`Overall: ${result.overallScore}/100 (${result.tier})`);
 * }
 * ```
 */

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type {
  // Core types
  QuestionType,
  RoleCategory,
  CompanyStage,
  
  // Research types
  CompanyResearch,
  RoleResearch,
  
  // Question types
  ScoringDimension,
  RubricLevel,
  ScoringRubric,
  ScenarioContext,
  AssessmentQuestion,
  
  // Assessment types
  AssessmentConfig,
  Assessment,
  
  // Response & scoring types
  QuestionResponse,
  DimensionScore,
  QuestionScore,
  AssessmentResult,
  
  // API types
  GenerateAssessmentInput,
  ScoreResponseInput,
  AssessmentError,
  Result,
  AsyncResult,
  
  // Utility types
  QuestionTypeConfig,
} from './types';

export {
  QUESTION_TYPE_CONFIGS,
  DEFAULT_QUESTION_MIX,
} from './types';

// ============================================================================
// RESEARCH EXPORTS
// ============================================================================

export {
  researchCompany,
  extractCompanyName,
  extractRoleFromJobDescription,
  inferRoleCategory,
  inferRoleLevel,
  getCompanyResearch,
  performFullResearch,
  WELL_KNOWN_COMPANIES,
} from './research';

// ============================================================================
// GENERATOR EXPORTS
// ============================================================================

export {
  generateAssessment,
  generateAssessmentWithContext,
  validateAssessment,
  generateExampleAssessment,
} from './generator';

// ============================================================================
// SCORER EXPORTS
// ============================================================================

export {
  scoreResponse,
  scoreAssessment,
  generateFeedbackReport,
  getScoreColor,
  getTierBadge,
  compareCandidates,
  analyzeSkills,
} from './scorer';

// ============================================================================
// PROMPT EXPORTS (for advanced usage)
// ============================================================================

export {
  fillTemplate,
  buildCompanyResearchPrompt,
  buildRoleExtractionPrompt,
  buildAssessmentGenerationPrompt,
  buildScoreResponsePrompt,
  buildSummaryPrompt,
} from './prompts';

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Quick assessment generation with sensible defaults
 * 
 * @example
 * ```typescript
 * const assessment = await quickAssessment(
 *   'SDR at Stripe',
 *   jobDescriptionText
 * );
 * ```
 */
export async function quickAssessment(
  roleAtCompany: string,
  jobDescription: string
) {
  const match = roleAtCompany.match(/(.+?)\s+at\s+(.+)/i);
  
  const { generateAssessment } = await import('./generator');
  
  return generateAssessment({
    jobDescription,
    companyName: match?.[2]?.trim(),
    roleTitle: match?.[1]?.trim(),
    questionCount: 8,
    difficulty: 'standard',
  });
}

/**
 * Validate that the assessment engine is properly configured
 */
export function validateConfiguration(): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  if (!process.env.ANTHROPIC_API_KEY) {
    issues.push('ANTHROPIC_API_KEY environment variable is not set');
  }
  
  return {
    valid: issues.length === 0,
    issues,
  };
}

// ============================================================================
// VERSION
// ============================================================================

export const VERSION = '1.0.0';

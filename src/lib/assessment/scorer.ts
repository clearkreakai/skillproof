/**
 * SkillProof Assessment Engine - Scorer
 * 
 * Contextual scoring that goes beyond right/wrong.
 * Every score explains WHY and provides actionable feedback.
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  Assessment,
  AssessmentQuestion,
  QuestionResponse,
  QuestionScore,
  DimensionScore,
  AssessmentResult,
  Result,
} from './types';
import { buildScoreResponsePrompt, buildSummaryPrompt } from './prompts';

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
// RESPONSE SCORING
// ============================================================================

/**
 * Score a single question response
 */
export async function scoreResponse(
  question: AssessmentQuestion,
  response: QuestionResponse,
  roleTitle: string,
  companyName: string
): Promise<Result<QuestionScore>> {
  const prompt = buildScoreResponsePrompt(
    roleTitle,
    companyName,
    question,
    response.response,
    response.timeSpentSeconds
  );

  try {
    const client = getAnthropicClient();

    // TODO: Integrate token tracking
    // After response, add:
    //   import { trackUsage } from '@/lib/tokenTracking';
    //   await trackUsage(aiResponse, 'score_response', assessmentId, { questionId: question.id });
    const aiResponse = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract text content
    const textBlock = aiResponse.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return {
        success: false,
        error: { code: 'SCORING_FAILED', message: 'No response from AI' },
      };
    }

    // Parse JSON from response
    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        success: false,
        error: { code: 'SCORING_FAILED', message: 'Could not parse score' },
      };
    }

    const parsed = JSON.parse(jsonMatch[0]);

    const questionScore: QuestionScore = {
      questionId: question.id,
      dimensionScores: (parsed.dimensionScores || []).map(transformDimensionScore),
      overallScore: parsed.overallScore || calculateOverallScore(parsed.dimensionScores || []),
      strengths: parsed.strengths || [],
      improvements: parsed.improvements || [],
      specificFeedback: parsed.specificFeedback || '',
      redFlagsTriggered: parsed.redFlagsTriggered || [],
      bonusesEarned: parsed.bonusesEarned || [],
    };

    return { success: true, data: questionScore };
  } catch (error) {
    console.error('Scoring error:', error);
    return {
      success: false,
      error: {
        code: 'SCORING_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error scoring response',
      },
    };
  }
}

/**
 * Transform raw dimension score data
 */
function transformDimensionScore(raw: Record<string, unknown>): DimensionScore {
  const score = (raw.score as number) || 3;
  const weight = (raw.weight as number) || 0.2;
  // Valid dimensions including technical_proficiency for tools questions
  const validDimensions = ['relevance', 'judgment', 'communication', 'execution', 'company_fit', 'technical_proficiency'];
  const dimension = validDimensions.includes(raw.dimension as string) 
    ? (raw.dimension as DimensionScore['dimension']) 
    : 'relevance';
  return {
    dimension,
    score,
    weight,
    weightedScore: (raw.weightedScore as number) || score * weight || 0.6,
    feedback: (raw.feedback as string) || '',
    evidence: (raw.evidence as string[]) || [],
  };
}

/**
 * Calculate overall score from dimension scores
 */
function calculateOverallScore(dimensionScores: DimensionScore[]): number {
  if (dimensionScores.length === 0) return 3;

  const totalWeightedScore = dimensionScores.reduce(
    (sum, ds) => sum + (ds.weightedScore || ds.score * ds.weight),
    0
  );

  const totalWeight = dimensionScores.reduce((sum, ds) => sum + ds.weight, 0);

  return totalWeight > 0 ? totalWeightedScore / totalWeight : 3;
}

// ============================================================================
// FULL ASSESSMENT SCORING
// ============================================================================

/**
 * Helper to process items in batches with concurrency control
 */
async function processBatched<T, R>(
  items: T[],
  batchSize: number,
  processor: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
  }
  
  return results;
}

/**
 * Score an entire assessment
 */
export async function scoreAssessment(
  assessment: Assessment,
  responses: QuestionResponse[]
): Promise<Result<AssessmentResult>> {
  const startedAt = responses.length > 0 
    ? responses.reduce((earliest, r) => 
        r.startedAt < earliest ? r.startedAt : earliest, 
        responses[0].startedAt
      )
    : new Date();
  
  const completedAt = responses.length > 0
    ? responses.reduce((latest, r) => 
        r.submittedAt > latest ? r.submittedAt : latest,
        responses[0].submittedAt
      )
    : new Date();

  // Prepare scoring tasks for all questions
  const scoringTasks = assessment.questions.map((question) => {
    const response = responses.find((r) => r.questionId === question.id);
    return { question, response };
  });

  // Score questions in parallel batches (4 concurrent to respect rate limits)
  const BATCH_SIZE = 4;
  const questionScores = await processBatched(
    scoringTasks,
    BATCH_SIZE,
    async ({ question, response }) => {
      if (!response) {
        // Unanswered question gets lowest score
        return createEmptyScore(question.id, 'Question not answered');
      }

      // Score this response
      const scoreResult = await scoreResponse(
        question,
        response,
        assessment.role.title,
        assessment.company.name
      );

      if (scoreResult.success) {
        return scoreResult.data;
      } else {
        // Scoring failed, use fallback
        return createEmptyScore(question.id, 'Unable to score response');
      }
    }
  );

  // Calculate overall score (0-100)
  const overallScore = calculateAssessmentScore(questionScores);

  // Generate summary
  const summaryResult = await generateSummary(
    assessment.role.title,
    assessment.company.name,
    overallScore,
    questionScores
  );

  const totalTimeSeconds = responses.reduce(
    (sum, r) => sum + r.timeSpentSeconds,
    0
  );

  const result: AssessmentResult = {
    id: `result_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    assessmentId: assessment.id,
    startedAt,
    completedAt,
    totalTimeSeconds,
    responses,
    questionScores,
    overallScore,
    tier: summaryResult.success ? summaryResult.data.tier : determineTier(overallScore),
    summary: summaryResult.success ? summaryResult.data.summary : generateFallbackSummary(overallScore),
    topStrengths: summaryResult.success ? summaryResult.data.topStrengths : [],
    areasForGrowth: summaryResult.success ? summaryResult.data.areasForGrowth : [],
  };

  return { success: true, data: result };
}

/**
 * Create an empty score for unanswered or error questions
 */
function createEmptyScore(questionId: string, reason: string): QuestionScore {
  return {
    questionId,
    dimensionScores: [],
    overallScore: 1,
    strengths: [],
    improvements: [reason],
    specificFeedback: reason,
    redFlagsTriggered: ['Question not completed'],
    bonusesEarned: [],
  };
}

/**
 * Calculate overall assessment score (0-100)
 */
function calculateAssessmentScore(questionScores: QuestionScore[]): number {
  if (questionScores.length === 0) return 0;

  const totalScore = questionScores.reduce(
    (sum, qs) => sum + qs.overallScore,
    0
  );

  // Convert from 1-5 scale to 0-100
  const averageScore = totalScore / questionScores.length;
  return Math.round((averageScore - 1) * 25);  // Maps 1-5 to 0-100
}

/**
 * Determine tier from score
 */
function determineTier(
  score: number
): 'exceptional' | 'strong' | 'qualified' | 'developing' | 'not_ready' {
  if (score >= 90) return 'exceptional';
  if (score >= 75) return 'strong';
  if (score >= 60) return 'qualified';
  if (score >= 45) return 'developing';
  return 'not_ready';
}

/**
 * Generate fallback summary if AI fails
 */
function generateFallbackSummary(score: number): string {
  const tier = determineTier(score);
  const tierDescriptions = {
    exceptional: 'This candidate demonstrated exceptional capabilities across the assessment.',
    strong: 'This candidate showed strong skills with solid performance in most areas.',
    qualified: 'This candidate meets the basic qualifications with room for growth.',
    developing: 'This candidate shows potential but has significant areas needing development.',
    not_ready: 'This candidate does not currently meet the requirements for this role.',
  };
  return tierDescriptions[tier];
}

// ============================================================================
// SUMMARY GENERATION
// ============================================================================

interface Summary {
  tier: 'exceptional' | 'strong' | 'qualified' | 'developing' | 'not_ready';
  summary: string;
  topStrengths: string[];
  areasForGrowth: string[];
}

/**
 * Generate comprehensive summary for assessment results
 */
async function generateSummary(
  roleTitle: string,
  companyName: string,
  overallScore: number,
  questionScores: QuestionScore[]
): Promise<Result<Summary>> {
  const prompt = buildSummaryPrompt(
    roleTitle,
    companyName,
    overallScore,
    questionScores
  );

  try {
    const client = getAnthropicClient();

    // TODO: Integrate token tracking
    // After response, add:
    //   import { trackUsage } from '@/lib/tokenTracking';
    //   await trackUsage(response, 'generate_summary', assessmentId);
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
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
        error: { code: 'SCORING_FAILED', message: 'No summary response' },
      };
    }

    // Parse JSON from response
    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        success: false,
        error: { code: 'SCORING_FAILED', message: 'Could not parse summary' },
      };
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      success: true,
      data: {
        tier: parsed.tier || determineTier(overallScore),
        summary: parsed.summary || generateFallbackSummary(overallScore),
        topStrengths: parsed.topStrengths || [],
        areasForGrowth: parsed.areasForGrowth || [],
      },
    };
  } catch (error) {
    console.error('Summary generation error:', error);
    return {
      success: false,
      error: {
        code: 'SCORING_FAILED',
        message: 'Failed to generate summary',
      },
    };
  }
}

// ============================================================================
// FEEDBACK HELPERS
// ============================================================================

/**
 * Generate shareable feedback report
 */
export function generateFeedbackReport(result: AssessmentResult, assessment: Assessment): string {
  const lines: string[] = [];

  lines.push(`# ${assessment.title} - Results`);
  lines.push('');
  lines.push(`**Overall Score:** ${result.overallScore}/100 (${result.tier.toUpperCase()})`);
  lines.push('');
  lines.push('## Summary');
  lines.push(result.summary);
  lines.push('');

  if (result.topStrengths.length > 0) {
    lines.push('## Top Strengths');
    for (const strength of result.topStrengths) {
      lines.push(`- ${strength}`);
    }
    lines.push('');
  }

  if (result.areasForGrowth.length > 0) {
    lines.push('## Areas for Growth');
    for (const area of result.areasForGrowth) {
      lines.push(`- ${area}`);
    }
    lines.push('');
  }

  lines.push('## Question-by-Question Breakdown');
  lines.push('');

  for (let i = 0; i < assessment.questions.length; i++) {
    const question = assessment.questions[i];
    const score = result.questionScores.find((s) => s.questionId === question.id);

    lines.push(`### Question ${i + 1}: ${question.type.replace(/_/g, ' ')}`);
    lines.push('');
    lines.push(`**Score:** ${score ? `${score.overallScore.toFixed(1)}/5` : 'Not answered'}`);
    lines.push('');

    if (score && score.specificFeedback) {
      lines.push(`**Feedback:** ${score.specificFeedback}`);
      lines.push('');
    }

    if (score && score.strengths.length > 0) {
      lines.push('**Strengths:**');
      for (const strength of score.strengths) {
        lines.push(`- ${strength}`);
      }
      lines.push('');
    }

    if (score && score.improvements.length > 0) {
      lines.push('**To Improve:**');
      for (const improvement of score.improvements) {
        lines.push(`- ${improvement}`);
      }
      lines.push('');
    }

    lines.push(`**Why This Matters:** ${question.whyThisMatters}`);
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  lines.push('*Assessment powered by SkillProof*');

  return lines.join('\n');
}

/**
 * Get score color for UI
 */
export function getScoreColor(score: number): 'green' | 'yellow' | 'orange' | 'red' {
  if (score >= 75) return 'green';
  if (score >= 60) return 'yellow';
  if (score >= 45) return 'orange';
  return 'red';
}

/**
 * Get tier badge text
 */
export function getTierBadge(
  tier: 'exceptional' | 'strong' | 'qualified' | 'developing' | 'not_ready'
): { text: string; color: string; emoji: string } {
  const badges = {
    exceptional: { text: 'Exceptional', color: '#22c55e', emoji: '🌟' },
    strong: { text: 'Strong', color: '#3b82f6', emoji: '✅' },
    qualified: { text: 'Qualified', color: '#eab308', emoji: '👍' },
    developing: { text: 'Developing', color: '#f97316', emoji: '📈' },
    not_ready: { text: 'Not Ready', color: '#ef4444', emoji: '⏳' },
  };
  return badges[tier];
}

// ============================================================================
// COMPARATIVE SCORING (FOR B2B)
// ============================================================================

/**
 * Compare multiple candidates on the same assessment
 */
export function compareCandidates(
  results: AssessmentResult[]
): {
  rankings: Array<{
    resultId: string;
    score: number;
    tier: string;
    rank: number;
  }>;
  topPerformer: string;
  averageScore: number;
  scoreDistribution: { tier: string; count: number }[];
} {
  // Sort by score descending
  const sorted = [...results].sort((a, b) => b.overallScore - a.overallScore);

  const rankings = sorted.map((result, index) => ({
    resultId: result.id,
    score: result.overallScore,
    tier: result.tier,
    rank: index + 1,
  }));

  const averageScore =
    results.reduce((sum, r) => sum + r.overallScore, 0) / results.length;

  const tierCounts: Record<string, number> = {};
  for (const result of results) {
    tierCounts[result.tier] = (tierCounts[result.tier] || 0) + 1;
  }

  return {
    rankings,
    topPerformer: rankings[0]?.resultId || '',
    averageScore,
    scoreDistribution: Object.entries(tierCounts).map(([tier, count]) => ({
      tier,
      count,
    })),
  };
}

// ============================================================================
// SKILL ANALYSIS
// ============================================================================

/**
 * Analyze skill strengths and weaknesses from results
 */
export function analyzeSkills(
  result: AssessmentResult,
  assessment: Assessment
): {
  skillScores: Array<{ skill: string; score: number; questions: number }>;
  strongestSkills: string[];
  weakestSkills: string[];
} {
  const skillScores: Record<string, { total: number; count: number }> = {};

  // Aggregate scores by skill
  for (const questionScore of result.questionScores) {
    const question = assessment.questions.find(
      (q) => q.id === questionScore.questionId
    );
    if (!question) continue;

    for (const skill of question.skillsTested) {
      if (!skillScores[skill]) {
        skillScores[skill] = { total: 0, count: 0 };
      }
      skillScores[skill].total += questionScore.overallScore;
      skillScores[skill].count += 1;
    }
  }

  // Calculate averages and sort
  const skills = Object.entries(skillScores)
    .map(([skill, { total, count }]) => ({
      skill,
      score: total / count,
      questions: count,
    }))
    .sort((a, b) => b.score - a.score);

  return {
    skillScores: skills,
    strongestSkills: skills.slice(0, 3).map((s) => s.skill),
    weakestSkills: skills.slice(-3).reverse().map((s) => s.skill),
  };
}

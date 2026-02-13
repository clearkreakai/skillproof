/**
 * SkillProof Token Usage Tracking
 * 
 * Track and analyze AI model usage costs across the assessment pipeline.
 * Helps with cost optimization, budgeting, and understanding where tokens go.
 */

import { supabase } from './supabase';

// ============================================================================
// TYPES
// ============================================================================

export type TrackingStep =
  | 'research_company'
  | 'extract_role'
  | 'generate_questions'
  | 'score_response'
  | 'generate_summary'
  | 'other';

export interface ModelPricing {
  inputPer1M: number;   // Cost per 1M input tokens
  outputPer1M: number;  // Cost per 1M output tokens
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface TokenUsageRecord {
  assessmentId?: string;
  step: TrackingStep;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  metadata?: Record<string, unknown>;
}

export interface UsageStats {
  totalCalls: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostUsd: number;
  byStep: Record<TrackingStep, { calls: number; costUsd: number }>;
  byModel: Record<string, { calls: number; costUsd: number }>;
}

// ============================================================================
// MODEL PRICING
// ============================================================================

/**
 * Anthropic model pricing (as of early 2025)
 * Prices are per 1 million tokens
 * 
 * Keep this updated when pricing changes!
 * Source: https://www.anthropic.com/pricing
 */
export const MODEL_PRICING: Record<string, ModelPricing> = {
  // Claude 4 family
  'claude-opus-4-20250514': {
    inputPer1M: 15.00,
    outputPer1M: 75.00,
  },
  'claude-sonnet-4-20250514': {
    inputPer1M: 3.00,
    outputPer1M: 15.00,
  },
  
  // Claude 3.5 family
  'claude-3-5-sonnet-20241022': {
    inputPer1M: 3.00,
    outputPer1M: 15.00,
  },
  'claude-3-5-sonnet-20240620': {
    inputPer1M: 3.00,
    outputPer1M: 15.00,
  },
  'claude-3-5-haiku-20241022': {
    inputPer1M: 0.80,
    outputPer1M: 4.00,
  },
  
  // Claude 3 family (older models)
  'claude-3-opus-20240229': {
    inputPer1M: 15.00,
    outputPer1M: 75.00,
  },
  'claude-3-sonnet-20240229': {
    inputPer1M: 3.00,
    outputPer1M: 15.00,
  },
  'claude-3-haiku-20240307': {
    inputPer1M: 0.25,
    outputPer1M: 1.25,
  },
  
  // Aliases / shorthand (map to full names)
  'claude-sonnet-4': {
    inputPer1M: 3.00,
    outputPer1M: 15.00,
  },
  'claude-opus-4': {
    inputPer1M: 15.00,
    outputPer1M: 75.00,
  },
};

// Default pricing for unknown models (conservative estimate)
const DEFAULT_PRICING: ModelPricing = {
  inputPer1M: 3.00,
  outputPer1M: 15.00,
};

// ============================================================================
// COST CALCULATION
// ============================================================================

/**
 * Get pricing for a model, with fallback for unknown models
 */
export function getModelPricing(model: string): ModelPricing {
  // Try exact match first
  if (MODEL_PRICING[model]) {
    return MODEL_PRICING[model];
  }
  
  // Try to find a partial match (e.g., "claude-sonnet-4-20250514" contains "sonnet-4")
  const modelLower = model.toLowerCase();
  
  if (modelLower.includes('opus-4') || modelLower.includes('opus_4')) {
    return MODEL_PRICING['claude-opus-4'];
  }
  if (modelLower.includes('sonnet-4') || modelLower.includes('sonnet_4')) {
    return MODEL_PRICING['claude-sonnet-4'];
  }
  if (modelLower.includes('haiku')) {
    return MODEL_PRICING['claude-3-5-haiku-20241022'];
  }
  if (modelLower.includes('opus')) {
    return MODEL_PRICING['claude-3-opus-20240229'];
  }
  if (modelLower.includes('sonnet')) {
    return MODEL_PRICING['claude-3-5-sonnet-20241022'];
  }
  
  console.warn(`Unknown model pricing for: ${model}, using default`);
  return DEFAULT_PRICING;
}

/**
 * Calculate cost in USD for a given model and token usage
 */
export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = getModelPricing(model);
  
  const inputCost = (inputTokens / 1_000_000) * pricing.inputPer1M;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPer1M;
  
  return inputCost + outputCost;
}

/**
 * Format cost for display
 */
export function formatCost(costUsd: number): string {
  if (costUsd < 0.01) {
    return `$${(costUsd * 100).toFixed(4)}¢`;
  }
  return `$${costUsd.toFixed(4)}`;
}

// ============================================================================
// DATABASE LOGGING
// ============================================================================

/**
 * Log token usage to the database
 * 
 * Note: This requires the service_role key for RLS policy compliance.
 * In production, use SUPABASE_SERVICE_ROLE_KEY for this operation.
 * 
 * For MVP, we log with anon key which may fail silently if RLS blocks it.
 * Check Supabase logs if records aren't appearing.
 */
export async function logTokenUsage(record: TokenUsageRecord): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('token_usage')
      .insert({
        assessment_id: record.assessmentId || null,
        step: record.step,
        model: record.model,
        input_tokens: record.inputTokens,
        output_tokens: record.outputTokens,
        cost_usd: record.costUsd,
        metadata: record.metadata || {},
      });
    
    if (error) {
      console.error('Error logging token usage:', error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Failed to log token usage:', err);
    return false;
  }
}

/**
 * Track token usage from an Anthropic API response
 * 
 * Usage:
 * ```typescript
 * const response = await client.messages.create({...});
 * await trackUsage(response, 'generate_questions', assessmentId);
 * ```
 */
export async function trackUsage(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  response: any,  // Anthropic Message response
  step: TrackingStep,
  assessmentId?: string,
  metadata?: Record<string, unknown>
): Promise<number> {
  // Extract token counts from Anthropic response
  const inputTokens = response?.usage?.input_tokens || 0;
  const outputTokens = response?.usage?.output_tokens || 0;
  const model = response?.model || 'unknown';
  
  // Calculate cost
  const costUsd = calculateCost(model, inputTokens, outputTokens);
  
  // Log to database (non-blocking)
  logTokenUsage({
    assessmentId,
    step,
    model,
    inputTokens,
    outputTokens,
    costUsd,
    metadata,
  }).catch(err => {
    console.warn('Token usage logging failed (non-critical):', err);
  });
  
  // Log to console for immediate visibility during development
  if (process.env.NODE_ENV === 'development') {
    console.log(`📊 Token Usage [${step}]: ${inputTokens} in, ${outputTokens} out = ${formatCost(costUsd)} (${model})`);
  }
  
  return costUsd;
}

// ============================================================================
// ANALYTICS HELPERS
// ============================================================================

/**
 * Get total cost for an assessment
 */
export async function getAssessmentCost(assessmentId: string): Promise<number | null> {
  const { data, error } = await supabase
    .from('token_usage')
    .select('cost_usd')
    .eq('assessment_id', assessmentId);
  
  if (error) {
    console.error('Error fetching assessment cost:', error);
    return null;
  }
  
  return data?.reduce((sum, row) => sum + (parseFloat(row.cost_usd) || 0), 0) || 0;
}

/**
 * Get usage statistics for a date range
 */
export async function getUsageStats(
  startDate?: Date,
  endDate?: Date
): Promise<UsageStats | null> {
  let query = supabase
    .from('token_usage')
    .select('step, model, input_tokens, output_tokens, cost_usd');
  
  if (startDate) {
    query = query.gte('created_at', startDate.toISOString());
  }
  if (endDate) {
    query = query.lte('created_at', endDate.toISOString());
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching usage stats:', error);
    return null;
  }
  
  if (!data || data.length === 0) {
    return {
      totalCalls: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCostUsd: 0,
      byStep: {} as Record<TrackingStep, { calls: number; costUsd: number }>,
      byModel: {},
    };
  }
  
  const stats: UsageStats = {
    totalCalls: data.length,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalCostUsd: 0,
    byStep: {} as Record<TrackingStep, { calls: number; costUsd: number }>,
    byModel: {},
  };
  
  for (const row of data) {
    const cost = parseFloat(row.cost_usd) || 0;
    const inputTokens = row.input_tokens || 0;
    const outputTokens = row.output_tokens || 0;
    
    stats.totalInputTokens += inputTokens;
    stats.totalOutputTokens += outputTokens;
    stats.totalCostUsd += cost;
    
    // By step
    const step = row.step as TrackingStep;
    if (!stats.byStep[step]) {
      stats.byStep[step] = { calls: 0, costUsd: 0 };
    }
    stats.byStep[step].calls += 1;
    stats.byStep[step].costUsd += cost;
    
    // By model
    const model = row.model;
    if (!stats.byModel[model]) {
      stats.byModel[model] = { calls: 0, costUsd: 0 };
    }
    stats.byModel[model].calls += 1;
    stats.byModel[model].costUsd += cost;
  }
  
  return stats;
}

// ============================================================================
// ESTIMATED COSTS (for UI/quotes)
// ============================================================================

/**
 * Estimate cost for generating a full assessment
 * Based on typical token usage patterns
 */
export function estimateAssessmentCost(questionCount: number = 8): {
  estimatedCostUsd: number;
  breakdown: {
    research: number;
    questionGeneration: number;
    scoring: number;
    summary: number;
  };
} {
  // Typical token usage per step (based on observations)
  const model = 'claude-sonnet-4-20250514';
  
  // Research: ~1500 in, ~1000 out
  const researchCost = calculateCost(model, 1500, 1000) * 2; // company + role
  
  // Question generation: ~3000 in, ~6000 out
  const questionGenCost = calculateCost(model, 3000, 6000);
  
  // Scoring: ~1500 in, ~1000 out per question
  const scoringCost = calculateCost(model, 1500, 1000) * questionCount;
  
  // Summary: ~2000 in, ~1000 out
  const summaryCost = calculateCost(model, 2000, 1000);
  
  return {
    estimatedCostUsd: researchCost + questionGenCost + scoringCost + summaryCost,
    breakdown: {
      research: researchCost,
      questionGeneration: questionGenCost,
      scoring: scoringCost,
      summary: summaryCost,
    },
  };
}

/**
 * Quick cost estimate for display
 */
export function quickCostEstimate(questionCount: number = 8): string {
  const { estimatedCostUsd } = estimateAssessmentCost(questionCount);
  return formatCost(estimatedCostUsd);
}

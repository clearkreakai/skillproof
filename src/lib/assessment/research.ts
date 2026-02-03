/**
 * SkillProof Assessment Engine - Research Functions
 * 
 * This module handles company and role research to generate
 * hyper-specific, ungameable assessment questions.
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  CompanyResearch,
  RoleResearch,
  RoleCategory,
  CompanyStage,
  Result,
} from './types';
import {
  buildCompanyResearchPrompt,
  buildRoleExtractionPrompt,
} from './prompts';

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
// COMPANY RESEARCH
// ============================================================================

/**
 * Research a company to gather context for assessment generation
 */
export async function researchCompany(
  companyName: string,
  additionalContext?: string
): Promise<Result<CompanyResearch>> {
  try {
    const client = getAnthropicClient();
    const prompt = buildCompanyResearchPrompt(companyName, additionalContext);

    const response = await client.messages.create({
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
    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return {
        success: false,
        error: { code: 'COMPANY_NOT_FOUND', message: 'No response from AI' },
      };
    }

    // Parse JSON from response
    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        success: false,
        error: { code: 'COMPANY_NOT_FOUND', message: 'Could not parse company research' },
      };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    const companyResearch: CompanyResearch = {
      name: parsed.name || companyName,
      description: parsed.description || '',
      industry: parsed.industry || 'Technology',
      stage: validateCompanyStage(parsed.stage),
      employeeCount: parsed.employeeCount,
      products: parsed.products || [],
      targetCustomers: parsed.targetCustomers || [],
      businessModel: parsed.businessModel || '',
      values: parsed.values || [],
      culture: parsed.culture || '',
      competitors: parsed.competitors || [],
      recentNews: parsed.recentNews || [],
      challenges: parsed.challenges || [],
      typicalStakeholders: parsed.typicalStakeholders || [],
      commonMetrics: parsed.commonMetrics || [],
      fetchedAt: new Date(),
    };

    return { success: true, data: companyResearch };
  } catch (error) {
    console.error('Company research error:', error);
    return {
      success: false,
      error: {
        code: 'COMPANY_NOT_FOUND',
        message: error instanceof Error ? error.message : 'Unknown error researching company',
      },
    };
  }
}

/**
 * Extract company name from job description if not provided
 */
export function extractCompanyName(jobDescription: string): string | null {
  // Common patterns for company names in job descriptions
  const patterns = [
    /(?:about|at|join)\s+([A-Z][A-Za-z0-9]+(?:\s+[A-Z][A-Za-z0-9]+)*)/i,
    /([A-Z][A-Za-z0-9]+(?:\s+[A-Z][A-Za-z0-9]+)*)\s+is\s+(?:hiring|looking|seeking)/i,
    /(?:company|employer):\s*([A-Za-z0-9]+(?:\s+[A-Za-z0-9]+)*)/i,
  ];

  for (const pattern of patterns) {
    const match = jobDescription.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
}

// ============================================================================
// ROLE RESEARCH
// ============================================================================

/**
 * Extract role details from a job description
 */
export async function extractRoleFromJobDescription(
  jobDescription: string,
  companyResearch?: CompanyResearch
): Promise<Result<RoleResearch>> {
  try {
    const client = getAnthropicClient();
    const prompt = buildRoleExtractionPrompt(jobDescription, companyResearch);

    const response = await client.messages.create({
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
    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return {
        success: false,
        error: { code: 'INVALID_JOB_DESCRIPTION', message: 'No response from AI' },
      };
    }

    // Parse JSON from response
    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        success: false,
        error: { code: 'INVALID_JOB_DESCRIPTION', message: 'Could not parse role details' },
      };
    }

    const parsed = JSON.parse(jsonMatch[0]);

    const roleResearch: RoleResearch = {
      title: parsed.title || 'Unknown Role',
      category: validateRoleCategory(parsed.category),
      level: validateLevel(parsed.level),
      responsibilities: parsed.responsibilities || [],
      deliverables: parsed.deliverables || [],
      stakeholders: parsed.stakeholders || [],
      hardSkills: parsed.hardSkills || [],
      softSkills: parsed.softSkills || [],
      tools: parsed.tools || [],
      commonChallenges: parsed.commonChallenges || [],
      successMetrics: parsed.successMetrics || [],
      rawJobDescription: jobDescription,
    };

    return { success: true, data: roleResearch };
  } catch (error) {
    console.error('Role extraction error:', error);
    return {
      success: false,
      error: {
        code: 'INVALID_JOB_DESCRIPTION',
        message: error instanceof Error ? error.message : 'Unknown error parsing job description',
      },
    };
  }
}

/**
 * Infer role category from job title
 */
export function inferRoleCategory(title: string): RoleCategory {
  const titleLower = title.toLowerCase();

  const categoryKeywords: Record<RoleCategory, string[]> = {
    sales: ['sales', 'sdr', 'bdr', 'account executive', 'ae', 'business development', 'revenue'],
    customer_success: ['customer success', 'csm', 'account manager', 'client success', 'customer experience'],
    product: ['product manager', 'product owner', 'pm', 'product designer', 'ux', 'ui'],
    marketing: ['marketing', 'growth', 'content', 'brand', 'demand gen', 'seo', 'social media'],
    engineering: ['engineer', 'developer', 'swe', 'software', 'devops', 'sre', 'data engineer', 'frontend', 'backend'],
    operations: ['operations', 'ops', 'strategy', 'bizops', 'business operations', 'chief of staff'],
    people: ['hr', 'human resources', 'recruiting', 'recruiter', 'people', 'talent', 'compensation'],
    finance: ['finance', 'fp&a', 'accounting', 'controller', 'cfo', 'financial'],
    general: [],
  };

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (const keyword of keywords) {
      if (titleLower.includes(keyword)) {
        return category as RoleCategory;
      }
    }
  }

  return 'general';
}

/**
 * Infer role level from job title
 */
export function inferRoleLevel(title: string): 'entry' | 'mid' | 'senior' | 'lead' | 'executive' {
  const titleLower = title.toLowerCase();

  if (/\b(vp|vice president|svp|evp|chief|cxo|ceo|cto|cfo|coo|cmo)\b/i.test(titleLower)) {
    return 'executive';
  }
  if (/\b(director|head of)\b/i.test(titleLower)) {
    return 'lead';
  }
  if (/\b(senior|sr\.?|staff|principal)\b/i.test(titleLower)) {
    return 'senior';
  }
  if (/\b(junior|jr\.?|associate|entry|intern)\b/i.test(titleLower)) {
    return 'entry';
  }

  return 'mid';
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

function validateCompanyStage(stage: string | undefined): CompanyStage {
  const validStages: CompanyStage[] = [
    'pre_seed', 'seed', 'series_a', 'series_b', 'series_c_plus', 'enterprise', 'public',
  ];
  if (stage && validStages.includes(stage as CompanyStage)) {
    return stage as CompanyStage;
  }
  return 'series_a'; // Default assumption
}

function validateRoleCategory(category: string | undefined): RoleCategory {
  const validCategories: RoleCategory[] = [
    'sales', 'customer_success', 'product', 'marketing',
    'engineering', 'operations', 'people', 'finance', 'general',
  ];
  if (category && validCategories.includes(category as RoleCategory)) {
    return category as RoleCategory;
  }
  return 'general';
}

function validateLevel(level: string | undefined): 'entry' | 'mid' | 'senior' | 'lead' | 'executive' {
  const validLevels = ['entry', 'mid', 'senior', 'lead', 'executive'];
  if (level && validLevels.includes(level)) {
    return level as 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
  }
  return 'mid';
}

// ============================================================================
// WELL-KNOWN COMPANIES DATABASE
// ============================================================================

/**
 * Pre-populated research for well-known companies
 * Saves API calls and provides richer context
 */
export const WELL_KNOWN_COMPANIES: Record<string, Partial<CompanyResearch>> = {
  stripe: {
    name: 'Stripe',
    description: 'Financial infrastructure platform for the internet',
    industry: 'Fintech / Payments',
    stage: 'series_c_plus',
    employeeCount: '8,000+',
    products: ['Payments API', 'Billing', 'Connect', 'Atlas', 'Radar', 'Terminal', 'Treasury'],
    targetCustomers: ['Startups', 'Enterprise', 'Marketplaces', 'Platforms'],
    businessModel: 'Transaction fees (2.9% + $0.30) plus platform fees',
    values: ['Users first', 'Move fast', 'Think rigorously', 'Global optimization', 'Honesty'],
    culture: 'Intense, intellectual, writing-heavy, high-bar, async-friendly',
    competitors: ['Adyen', 'Square', 'Braintree/PayPal', 'Checkout.com'],
    challenges: ['Enterprise expansion', 'International complexity', 'Regulatory compliance'],
    typicalStakeholders: ['Engineering teams', 'Product managers', 'Finance teams', 'Compliance'],
    commonMetrics: ['Payment volume', 'Take rate', 'Time to integration', 'Support resolution time'],
  },
  notion: {
    name: 'Notion',
    description: 'All-in-one workspace for notes, docs, wikis, and project management',
    industry: 'Productivity / SaaS',
    stage: 'series_c_plus',
    employeeCount: '500+',
    products: ['Notion Workspace', 'Notion AI', 'Notion Templates', 'Notion API'],
    targetCustomers: ['Teams', 'Startups', 'Enterprise', 'Individual creators'],
    businessModel: 'Freemium + subscription ($8-15/user/month)',
    values: ['Craft', 'User obsession', 'Ambition', 'Kindness'],
    culture: 'Design-obsessed, thoughtful, remote-friendly, high craft standards',
    competitors: ['Confluence', 'Coda', 'Monday.com', 'Airtable'],
    challenges: ['Enterprise adoption', 'AI integration', 'Template ecosystem'],
    typicalStakeholders: ['Team leads', 'Individual contributors', 'IT admins'],
    commonMetrics: ['DAU/MAU', 'Workspace creation', 'Team size growth', 'NPS'],
  },
  hubspot: {
    name: 'HubSpot',
    description: 'CRM platform with marketing, sales, and service hubs',
    industry: 'CRM / Marketing Technology',
    stage: 'public',
    employeeCount: '7,000+',
    products: ['Marketing Hub', 'Sales Hub', 'Service Hub', 'CMS Hub', 'Operations Hub'],
    targetCustomers: ['SMBs', 'Mid-market companies', 'Marketing teams', 'Sales teams'],
    businessModel: 'Freemium + tiered subscriptions + marketplace',
    values: ['HEART: Humble, Empathetic, Adaptable, Remarkable, Transparent'],
    culture: 'Customer-centric, educational, inbound methodology believers',
    competitors: ['Salesforce', 'Pipedrive', 'Zoho', 'Monday.com'],
    challenges: ['Moving upmarket', 'Competing with Salesforce', 'AI integration'],
    typicalStakeholders: ['Marketing managers', 'Sales reps', 'RevOps', 'Executives'],
    commonMetrics: ['MQL/SQL conversion', 'Deal velocity', 'Customer LTV', 'NRR'],
  },
  figma: {
    name: 'Figma',
    description: 'Collaborative design platform for teams',
    industry: 'Design Tools / SaaS',
    stage: 'series_c_plus',
    employeeCount: '1,200+',
    products: ['Figma Design', 'FigJam', 'Figma Slides', 'Dev Mode', 'Figma AI'],
    targetCustomers: ['Design teams', 'Product teams', 'Startups', 'Enterprise'],
    businessModel: 'Freemium + per-editor subscription',
    values: ['Make design accessible', 'Build in the open', 'Grow together'],
    culture: 'Design-obsessed, collaborative, playful, technically excellent',
    competitors: ['Adobe XD', 'Sketch', 'InVision', 'Canva'],
    challenges: ['Enterprise security requirements', 'Adobe competition', 'AI integration'],
    typicalStakeholders: ['Designers', 'Product managers', 'Engineers', 'Design systems teams'],
    commonMetrics: ['MAU', 'Files created', 'Collaboration time', 'Enterprise seats'],
  },
  shopify: {
    name: 'Shopify',
    description: 'E-commerce platform helping merchants sell anywhere',
    industry: 'E-commerce / SaaS',
    stage: 'public',
    employeeCount: '10,000+',
    products: ['Shopify stores', 'Shopify POS', 'Shopify Payments', 'Shop app', 'Shopify Capital'],
    targetCustomers: ['Small merchants', 'DTC brands', 'Enterprise retailers'],
    businessModel: 'Subscriptions + transaction fees + Shopify Capital',
    values: ['Build for the long term', 'Thrive on change', 'Be a merchant'],
    culture: 'Merchant-obsessed, entrepreneurial, high autonomy, remote-first',
    competitors: ['WooCommerce', 'BigCommerce', 'Squarespace', 'Amazon'],
    challenges: ['Merchant retention', 'Enterprise market', 'Checkout competition'],
    typicalStakeholders: ['Merchants', 'Partners', 'App developers', 'Support teams'],
    commonMetrics: ['GMV', 'Merchant count', 'Revenue per merchant', 'Attach rate'],
  },
  salesforce: {
    name: 'Salesforce',
    description: 'Enterprise CRM and cloud computing giant',
    industry: 'CRM / Enterprise Software',
    stage: 'public',
    employeeCount: '70,000+',
    products: ['Sales Cloud', 'Service Cloud', 'Marketing Cloud', 'Slack', 'Tableau', 'MuleSoft'],
    targetCustomers: ['Enterprise', 'Mid-market', 'SMB', 'Nonprofits'],
    businessModel: 'Subscription + professional services + AppExchange',
    values: ['Trust', 'Customer Success', 'Innovation', 'Equality', 'Sustainability'],
    culture: 'Corporate but innovative, Ohana culture, growth-oriented',
    competitors: ['Microsoft Dynamics', 'HubSpot', 'Oracle', 'SAP'],
    challenges: ['Multi-cloud complexity', 'Slack integration', 'AI competition'],
    typicalStakeholders: ['Sales reps', 'Sales managers', 'Admins', 'Executives'],
    commonMetrics: ['ARR', 'Customer retention', 'Platform adoption', 'Partner ecosystem'],
  },
  gong: {
    name: 'Gong',
    description: 'Revenue intelligence platform using conversation analytics',
    industry: 'Sales Tech / AI',
    stage: 'series_c_plus',
    employeeCount: '1,500+',
    products: ['Gong Engage', 'Gong Forecast', 'Gong Analytics', 'Gong Assist'],
    targetCustomers: ['Sales teams', 'Revenue leaders', 'Customer success teams'],
    businessModel: 'Seat-based subscription (typically $100-150/user/month)',
    values: ['Reality > Perception', 'We, not I', 'Courage over comfort'],
    culture: 'Data-driven, bold, customer-obsessed, high-energy',
    competitors: ['Chorus (ZoomInfo)', 'Clari', 'Outreach', 'SalesLoft'],
    challenges: ['Enterprise penetration', 'Privacy concerns', 'Competitive pressure'],
    typicalStakeholders: ['Sales reps', 'Sales managers', 'RevOps', 'Sales enablement'],
    commonMetrics: ['Win rate', 'Deal cycle time', 'Talk ratio', 'Adoption rate'],
  },
  datadog: {
    name: 'Datadog',
    description: 'Cloud monitoring and security platform for developers',
    industry: 'DevOps / Monitoring',
    stage: 'public',
    employeeCount: '5,000+',
    products: ['Infrastructure monitoring', 'APM', 'Logs', 'Security', 'Synthetics', 'RUM'],
    targetCustomers: ['Engineering teams', 'DevOps', 'SRE teams', 'Security teams'],
    businessModel: 'Usage-based pricing + subscription tiers',
    values: ['Dream Big', 'Care and Be Direct', 'Make an Impact'],
    culture: 'Technical excellence, fast-paced, customer-focused, ambitious',
    competitors: ['Splunk', 'New Relic', 'Dynatrace', 'Grafana'],
    challenges: ['Usage predictability', 'Cost management for customers', 'Security expansion'],
    typicalStakeholders: ['Engineers', 'SREs', 'Security teams', 'IT leaders'],
    commonMetrics: ['Hosts monitored', 'ARR', 'Net expansion', 'Product adoption'],
  },
};

/**
 * Get company research, using cache if available
 */
export async function getCompanyResearch(
  companyName: string,
  additionalContext?: string
): Promise<Result<CompanyResearch>> {
  // Check well-known companies first
  const normalizedName = companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const cached = WELL_KNOWN_COMPANIES[normalizedName];

  if (cached) {
    return {
      success: true,
      data: {
        ...cached,
        fetchedAt: new Date(),
      } as CompanyResearch,
    };
  }

  // Fall back to AI research
  return researchCompany(companyName, additionalContext);
}

// ============================================================================
// COMBINED RESEARCH FUNCTION
// ============================================================================

/**
 * Complete research for assessment generation
 */
export async function performFullResearch(
  jobDescription: string,
  companyNameOverride?: string
): Promise<Result<{ company: CompanyResearch; role: RoleResearch }>> {
  // Extract or use provided company name
  const companyName = companyNameOverride || extractCompanyName(jobDescription) || 'Unknown Company';

  // Research company
  const companyResult = await getCompanyResearch(companyName, jobDescription);
  if (!companyResult.success) {
    return companyResult as Result<never>;
  }

  // Extract role details
  const roleResult = await extractRoleFromJobDescription(jobDescription, companyResult.data);
  if (!roleResult.success) {
    return roleResult as Result<never>;
  }

  return {
    success: true,
    data: {
      company: companyResult.data,
      role: roleResult.data,
    },
  };
}

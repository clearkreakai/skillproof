import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getSupabase() {
  return createClient(supabaseUrl, serviceKey);
}

// Categorize role into standard categories for benchmarking
function categorizeRole(role: string): string {
  const roleLower = role.toLowerCase();
  
  if (roleLower.includes('product') && (roleLower.includes('manager') || roleLower.includes('owner'))) {
    return 'product_manager';
  }
  if (roleLower.includes('sales') || roleLower.includes('account executive') || roleLower.includes('sdr') || roleLower.includes('bdr')) {
    return 'sales';
  }
  if (roleLower.includes('engineer') || roleLower.includes('developer') || roleLower.includes('programmer') || roleLower.includes('software')) {
    return 'engineering';
  }
  if (roleLower.includes('customer success') || roleLower.includes('customer support') || roleLower.includes('csm')) {
    return 'customer_success';
  }
  if (roleLower.includes('marketing') || roleLower.includes('growth') || roleLower.includes('content')) {
    return 'marketing';
  }
  
  return 'general';
}

// POST: Save a benchmark entry after assessment completion
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      roleTitle,
      overallScore,
      tier,
      totalTimeSeconds,
      estimatedTimeSeconds,
      questionCount,
      pasteDetected,
      avgPastePercentage,
      assessmentId,
    } = body;

    if (!roleTitle || overallScore === undefined || !tier) {
      return NextResponse.json(
        { error: 'Missing required fields: roleTitle, overallScore, tier' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    const roleCategory = categorizeRole(roleTitle);

    const { data, error } = await supabase
      .from('assessment_benchmarks')
      .insert({
        role_category: roleCategory,
        role_title: roleTitle,
        overall_score: overallScore,
        tier,
        total_time_seconds: totalTimeSeconds,
        estimated_time_seconds: estimatedTimeSeconds,
        question_count: questionCount,
        paste_detected: pasteDetected || false,
        avg_paste_percentage: avgPastePercentage || 0,
        avg_time_per_question_seconds: questionCount > 0 ? totalTimeSeconds / questionCount : null,
        assessment_id: assessmentId,
      })
      .select()
      .single();

    if (error) {
      console.error('Benchmark save error:', error);
      // Don't fail the whole flow if benchmarks fail
      return NextResponse.json({ success: false, error: error.message });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (error) {
    console.error('Benchmark API error:', error);
    return NextResponse.json(
      { error: 'Failed to save benchmark' },
      { status: 500 }
    );
  }
}

// GET: Get percentile for a role and score
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const score = searchParams.get('score');

    if (!role || !score) {
      return NextResponse.json(
        { error: 'Missing required params: role, score' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    const roleCategory = categorizeRole(role);
    const scoreNum = parseInt(score, 10);

    // Get total count and count below this score
    const { data: allScores, error } = await supabase
      .from('assessment_benchmarks')
      .select('overall_score')
      .eq('role_category', roleCategory);

    if (error) {
      console.error('Benchmark query error:', error);
      return NextResponse.json({ percentile: 50, count: 0 }); // Default fallback
    }

    const total = allScores?.length || 0;
    const belowCount = allScores?.filter(s => s.overall_score < scoreNum).length || 0;

    const percentile = total > 0 ? Math.round((belowCount / total) * 100) : 50;

    return NextResponse.json({
      percentile,
      roleCategory,
      totalAssessments: total,
      score: scoreNum,
    });
  } catch (error) {
    console.error('Benchmark percentile error:', error);
    return NextResponse.json({ percentile: 50, count: 0 });
  }
}

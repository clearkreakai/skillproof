import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Fetch all assessments with response counts
    const { data: assessments, error: assessmentError } = await supabase
      .from('assessments')
      .select(`
        id,
        created_at,
        company_name,
        role_title,
        status
      `)
      .order('created_at', { ascending: false });

    if (assessmentError) {
      console.error('Error fetching assessments:', assessmentError);
      return NextResponse.json({ error: 'Failed to fetch assessments' }, { status: 500 });
    }

    // Get response counts for each assessment
    const assessmentsWithCounts = await Promise.all(
      (assessments || []).map(async (assessment) => {
        const { count: responseCount } = await supabase
          .from('responses')
          .select('*', { count: 'exact', head: true })
          .eq('assessment_id', assessment.id);

        const { count: completedCount } = await supabase
          .from('responses')
          .select('*', { count: 'exact', head: true })
          .eq('assessment_id', assessment.id)
          .eq('status', 'completed');

        return {
          ...assessment,
          response_count: responseCount || 0,
          completed_count: completedCount || 0,
        };
      })
    );

    // Fetch all results with assessment info
    const { data: results, error: resultsError } = await supabase
      .from('results')
      .select(`
        id,
        created_at,
        assessment_id,
        result_data,
        assessments (
          company_name,
          role_title
        )
      `)
      .order('created_at', { ascending: false });

    if (resultsError) {
      console.error('Error fetching results:', resultsError);
      return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 });
    }

    // Transform results for frontend
    const transformedResults = (results || []).map((result) => {
      const resultData = result.result_data as {
        overallScore?: number;
        candidateName?: string;
      } | null;
      
      // Handle the assessments relation - could be object or array depending on Supabase response
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const assessmentsRaw = result.assessments as any;
      const assessmentInfo = Array.isArray(assessmentsRaw) 
        ? assessmentsRaw[0] 
        : assessmentsRaw;

      return {
        id: result.id,
        created_at: result.created_at,
        assessment_id: result.assessment_id,
        company_name: assessmentInfo?.company_name || 'Unknown',
        role_title: assessmentInfo?.role_title || 'Unknown',
        overall_score: resultData?.overallScore || 0,
        candidate_name: resultData?.candidateName,
      };
    });

    return NextResponse.json({
      assessments: assessmentsWithCounts,
      results: transformedResults,
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

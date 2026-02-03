import { NextRequest, NextResponse } from 'next/server';
import { getResult, getResultByShareToken, getAssessment } from '@/lib/db';

// GET - Fetch result by ID or share token
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const isShareToken = searchParams.get('share') === 'true';

    if (isShareToken) {
      // Fetch by share token (public access)
      const data = await getResultByShareToken(id);
      
      if (!data) {
        return NextResponse.json(
          { error: 'Result not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        result: data.result,
        assessment: {
          id: data.assessment.id,
          title: data.assessment.title,
          company: data.assessment.company.name,
          role: data.assessment.role.title,
          questions: data.assessment.questions.map(q => ({
            id: q.id,
            type: q.type,
            prompt: q.prompt,
            whyThisMatters: q.whyThisMatters,
          })),
        },
      });
    }

    // Fetch by result ID (for immediate viewing after completion)
    const result = await getResult(id);
    
    if (!result) {
      return NextResponse.json(
        { error: 'Result not found' },
        { status: 404 }
      );
    }

    // Also fetch the assessment
    const assessment = await getAssessment(result.assessment_id);

    return NextResponse.json({
      success: true,
      result: result.result_data,
      shareToken: result.share_token,
      assessment: assessment ? {
        id: assessment.id,
        title: assessment.title,
        company: assessment.company.name,
        role: assessment.role.title,
        questions: assessment.questions.map(q => ({
          id: q.id,
          type: q.type,
          prompt: q.prompt,
          whyThisMatters: q.whyThisMatters,
          context: q.context,
        })),
      } : null,
    });
  } catch (error) {
    console.error('Error fetching result:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

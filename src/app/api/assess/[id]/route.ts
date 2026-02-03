import { NextRequest, NextResponse } from 'next/server';
import { getAssessment, startAssessment, getResponse, saveQuestionResponse, completeAssessment } from '@/lib/db';

// GET - Fetch assessment data for taking
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const assessment = await getAssessment(id);

    if (!assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    // Return assessment with questions (but without full rubrics for test takers)
    return NextResponse.json({
      success: true,
      assessment: {
        id: assessment.id,
        title: assessment.title,
        description: assessment.description,
        company: assessment.company.name,
        role: assessment.role.title,
        estimatedMinutes: assessment.estimatedMinutes,
        questionCount: assessment.questions.length,
        questions: assessment.questions.map((q, idx) => ({
          id: q.id,
          number: idx + 1,
          type: q.type,
          context: q.context,
          prompt: q.prompt,
          expectedFormat: q.expectedFormat,
          wordGuidance: q.wordGuidance,
          timeGuidance: q.timeGuidance,
          skillsTested: q.skillsTested,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching assessment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Start an assessment attempt or save a response
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assessmentId } = await params;
    const body = await request.json();
    const { action } = body;

    if (action === 'start') {
      // Start a new assessment attempt
      const responseId = await startAssessment(assessmentId);
      
      if (!responseId) {
        return NextResponse.json(
          { error: 'Failed to start assessment' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        responseId,
      });
    }

    if (action === 'save') {
      // Auto-save a question response
      const { responseId, questionId, response, timeSpentSeconds, currentQuestion } = body;
      
      if (!responseId || !questionId) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }

      const saved = await saveQuestionResponse(
        responseId,
        questionId,
        response || '',
        timeSpentSeconds || 0,
        currentQuestion || 0
      );

      return NextResponse.json({ success: saved });
    }

    if (action === 'complete') {
      // Mark assessment as complete
      const { responseId } = body;
      
      if (!responseId) {
        return NextResponse.json(
          { error: 'Missing responseId' },
          { status: 400 }
        );
      }

      const completed = await completeAssessment(responseId);
      
      return NextResponse.json({ success: completed });
    }

    if (action === 'resume') {
      // Get existing response to resume
      const { responseId } = body;
      
      if (!responseId) {
        return NextResponse.json(
          { error: 'Missing responseId' },
          { status: 400 }
        );
      }

      const response = await getResponse(responseId);
      
      if (!response) {
        return NextResponse.json(
          { error: 'Response not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        response: {
          id: response.id,
          currentQuestion: response.current_question,
          responses: response.responses,
          status: response.status,
        },
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in assessment action:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

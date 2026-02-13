import { NextRequest, NextResponse } from 'next/server';
import { generateAssessment } from '@/lib/assessment';
import { saveAssessment } from '@/lib/db';
import { getUser } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    // Check for API key first
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY is not set');
      return NextResponse.json(
        { 
          error: 'Assessment generation is not configured. Please add ANTHROPIC_API_KEY to environment variables.',
          setup: 'See /api/setup for configuration status'
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { jobDescription, companyName, questionCount = 8 } = body;

    if (!jobDescription || jobDescription.length < 50) {
      return NextResponse.json(
        { error: 'Please provide a job description (at least 50 characters)' },
        { status: 400 }
      );
    }

    // Get the logged-in user (optional - assessments work for anonymous users too)
    const user = await getUser();

    // Generate the assessment
    const result = await generateAssessment({
      jobDescription,
      companyName,
      questionCount,
      difficulty: 'standard',
    });

    if (!result.success) {
      console.error('Assessment generation failed:', result.error);
      return NextResponse.json(
        { error: result.error.message || 'Failed to generate assessment' },
        { status: 500 }
      );
    }

    // Save to database (with user_id if logged in)
    const saved = await saveAssessment(result.data, jobDescription, user?.id);
    
    if (!saved) {
      // Still return the assessment even if save fails
      console.warn('Failed to save assessment to database, returning anyway');
    }

    return NextResponse.json({
      success: true,
      assessmentId: result.data.id,
      assessment: {
        id: result.data.id,
        title: result.data.title,
        description: result.data.description,
        company: result.data.company.name,
        role: result.data.role.title,
        questionCount: result.data.questions.length,
        estimatedMinutes: result.data.estimatedMinutes,
        skillsCovered: result.data.skillsCovered,
      },
    });
  } catch (error) {
    console.error('Error in generate endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

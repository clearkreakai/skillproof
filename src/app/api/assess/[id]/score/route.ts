import { NextRequest, NextResponse } from 'next/server';
import { getAssessment, getResponse, saveResult } from '@/lib/db';
import { scoreAssessment, analyzeSkills } from '@/lib/assessment';
import type { QuestionResponse } from '@/lib/assessment/types';

// POST - Score a completed assessment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assessmentId } = await params;
    const body = await request.json();
    const { responseId } = body;

    if (!responseId) {
      return NextResponse.json(
        { error: 'Missing responseId' },
        { status: 400 }
      );
    }

    // Get the assessment
    const assessment = await getAssessment(assessmentId);
    if (!assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    // Get the responses
    const responseRecord = await getResponse(responseId);
    if (!responseRecord) {
      return NextResponse.json(
        { error: 'Response not found' },
        { status: 404 }
      );
    }

    // Convert to typed responses
    const responses: QuestionResponse[] = (responseRecord.responses || []).map((r) => ({
      questionId: r.questionId,
      response: r.response || '',
      startedAt: new Date(r.startedAt),
      submittedAt: new Date(r.submittedAt),
      timeSpentSeconds: r.timeSpentSeconds || 0,
    }));

    // Score the assessment
    const scoringResult = await scoreAssessment(assessment, responses);

    if (!scoringResult.success) {
      return NextResponse.json(
        { error: 'Failed to score assessment' },
        { status: 500 }
      );
    }

    const result = scoringResult.data;

    // Analyze skills
    const skillAnalysis = analyzeSkills(result, assessment);

    // Add skillAnalysis to result before saving
    const resultWithSkills = {
      ...result,
      skillAnalysis: {
        skillScores: skillAnalysis.skillScores,
        strongestSkills: skillAnalysis.strongestSkills,
        weakestSkills: skillAnalysis.weakestSkills,
      },
    };

    // Save the result (with skillAnalysis included)
    const savedId = await saveResult(assessmentId, responseId, resultWithSkills);
    
    if (!savedId) {
      console.warn('Failed to save result to database');
    }

    return NextResponse.json({
      success: true,
      resultId: result.id,
      result: {
        id: result.id,
        overallScore: result.overallScore,
        tier: result.tier,
        summary: result.summary,
        topStrengths: result.topStrengths,
        areasForGrowth: result.areasForGrowth,
        totalTimeSeconds: result.totalTimeSeconds,
        questionScores: result.questionScores.map(qs => ({
          questionId: qs.questionId,
          overallScore: qs.overallScore,
          dimensionScores: qs.dimensionScores,
          strengths: qs.strengths,
          improvements: qs.improvements,
          specificFeedback: qs.specificFeedback,
          redFlagsTriggered: qs.redFlagsTriggered,
          bonusesEarned: qs.bonusesEarned,
        })),
        skillAnalysis: {
          skillScores: skillAnalysis.skillScores,
          strongestSkills: skillAnalysis.strongestSkills,
          weakestSkills: skillAnalysis.weakestSkills,
        },
      },
    });
  } catch (error) {
    console.error('Error scoring assessment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

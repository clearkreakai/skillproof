/**
 * Assessment tracking utilities
 * Tracks: paste events, tab switches, focus/blur, timing
 */

export interface TrackingData {
  pasteEvents: PasteEvent[];
  tabSwitches: TabSwitchEvent[];
  questionTimings: QuestionTiming[];
  totalFocusTime: number;
  totalBlurTime: number;
  startedAt: string;
  completedAt?: string;
}

export interface PasteEvent {
  questionId: string;
  questionIndex: number;
  timestamp: string;
  pastedLength: number;
  textPreview?: string; // First 50 chars
}

export interface TabSwitchEvent {
  type: 'blur' | 'focus';
  timestamp: string;
  questionIndex: number;
  duration?: number; // For blur events, how long they were away
}

export interface QuestionTiming {
  questionId: string;
  questionIndex: number;
  startedAt: string;
  completedAt?: string;
  focusTime: number; // Time spent with tab focused
  blurTime: number; // Time spent with tab blurred
  keystrokeCount: number;
  pasteCount: number;
}

class AssessmentTracker {
  private data: TrackingData;
  private currentQuestionIndex: number = 0;
  private lastFocusTime: number = Date.now();
  private isDocumentFocused: boolean = true;
  private questionStartTime: number = Date.now();
  private keystrokeCount: number = 0;
  private storageKey: string;

  constructor(assessmentId: string) {
    this.storageKey = `mettle_tracking_${assessmentId}`;
    
    // Try to restore from localStorage
    const saved = this.loadFromStorage();
    if (saved) {
      this.data = saved;
    } else {
      this.data = {
        pasteEvents: [],
        tabSwitches: [],
        questionTimings: [],
        totalFocusTime: 0,
        totalBlurTime: 0,
        startedAt: new Date().toISOString(),
      };
    }

    // Set up event listeners
    if (typeof window !== 'undefined') {
      this.setupEventListeners();
    }
  }

  private setupEventListeners() {
    // Tab visibility changes
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    
    // Window focus/blur
    window.addEventListener('blur', this.handleBlur.bind(this));
    window.addEventListener('focus', this.handleFocus.bind(this));
  }

  private handleVisibilityChange() {
    if (document.hidden) {
      this.handleBlur();
    } else {
      this.handleFocus();
    }
  }

  private handleBlur() {
    if (this.isDocumentFocused) {
      const now = Date.now();
      const focusDuration = now - this.lastFocusTime;
      this.data.totalFocusTime += focusDuration;
      
      this.data.tabSwitches.push({
        type: 'blur',
        timestamp: new Date().toISOString(),
        questionIndex: this.currentQuestionIndex,
      });
      
      this.lastFocusTime = now;
      this.isDocumentFocused = false;
      this.save();
    }
  }

  private handleFocus() {
    if (!this.isDocumentFocused) {
      const now = Date.now();
      const blurDuration = now - this.lastFocusTime;
      this.data.totalBlurTime += blurDuration;
      
      // Update the last blur event with duration
      const lastBlur = this.data.tabSwitches.filter(e => e.type === 'blur').pop();
      if (lastBlur) {
        lastBlur.duration = blurDuration;
      }
      
      this.data.tabSwitches.push({
        type: 'focus',
        timestamp: new Date().toISOString(),
        questionIndex: this.currentQuestionIndex,
      });
      
      this.lastFocusTime = now;
      this.isDocumentFocused = true;
      this.save();
    }
  }

  trackPaste(questionId: string, pastedText: string) {
    this.data.pasteEvents.push({
      questionId,
      questionIndex: this.currentQuestionIndex,
      timestamp: new Date().toISOString(),
      pastedLength: pastedText.length,
      textPreview: pastedText.substring(0, 50),
    });
    this.save();
  }

  trackKeystroke() {
    this.keystrokeCount++;
  }

  setCurrentQuestion(index: number, questionId: string) {
    // Save timing for previous question
    if (this.data.questionTimings.length > 0) {
      const prevTiming = this.data.questionTimings[this.data.questionTimings.length - 1];
      if (!prevTiming.completedAt) {
        prevTiming.completedAt = new Date().toISOString();
        prevTiming.keystrokeCount = this.keystrokeCount;
        prevTiming.pasteCount = this.data.pasteEvents.filter(
          e => e.questionIndex === this.currentQuestionIndex
        ).length;
      }
    }

    this.currentQuestionIndex = index;
    this.questionStartTime = Date.now();
    this.keystrokeCount = 0;

    // Start new timing
    this.data.questionTimings.push({
      questionId,
      questionIndex: index,
      startedAt: new Date().toISOString(),
      focusTime: 0,
      blurTime: 0,
      keystrokeCount: 0,
      pasteCount: 0,
    });

    this.save();
  }

  complete() {
    // Finalize last question timing
    if (this.data.questionTimings.length > 0) {
      const lastTiming = this.data.questionTimings[this.data.questionTimings.length - 1];
      if (!lastTiming.completedAt) {
        lastTiming.completedAt = new Date().toISOString();
        lastTiming.keystrokeCount = this.keystrokeCount;
        lastTiming.pasteCount = this.data.pasteEvents.filter(
          e => e.questionIndex === this.currentQuestionIndex
        ).length;
      }
    }

    // Final focus time update
    if (this.isDocumentFocused) {
      this.data.totalFocusTime += Date.now() - this.lastFocusTime;
    } else {
      this.data.totalBlurTime += Date.now() - this.lastFocusTime;
    }

    this.data.completedAt = new Date().toISOString();
    this.save();
    
    return this.data;
  }

  getData(): TrackingData {
    return { ...this.data };
  }

  getSummary() {
    return {
      totalPasteEvents: this.data.pasteEvents.length,
      totalTabSwitches: this.data.tabSwitches.filter(e => e.type === 'blur').length,
      totalFocusTimeSeconds: Math.round(this.data.totalFocusTime / 1000),
      totalBlurTimeSeconds: Math.round(this.data.totalBlurTime / 1000),
      questionsWithPaste: [...new Set(this.data.pasteEvents.map(e => e.questionIndex))].length,
    };
  }

  private save() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    }
  }

  private loadFromStorage(): TrackingData | null {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return null;
        }
      }
    }
    return null;
  }

  cleanup() {
    if (typeof window !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
      window.removeEventListener('blur', this.handleBlur.bind(this));
      window.removeEventListener('focus', this.handleFocus.bind(this));
      localStorage.removeItem(this.storageKey);
    }
  }
}

// Singleton instance per assessment
const trackers: Map<string, AssessmentTracker> = new Map();

export function getTracker(assessmentId: string): AssessmentTracker {
  if (!trackers.has(assessmentId)) {
    trackers.set(assessmentId, new AssessmentTracker(assessmentId));
  }
  return trackers.get(assessmentId)!;
}

export function clearTracker(assessmentId: string) {
  const tracker = trackers.get(assessmentId);
  if (tracker) {
    tracker.cleanup();
    trackers.delete(assessmentId);
  }
}

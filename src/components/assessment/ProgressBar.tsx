'use client';

interface ProgressBarProps {
  current: number;
  total: number;
  timeRemaining?: number; // seconds
}

export function ProgressBar({ current, total, timeRemaining }: ProgressBarProps) {
  const progress = ((current) / total) * 100;
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Question {current} of {total}
        </span>
        {timeRemaining !== undefined && (
          <span className={`text-sm font-medium flex items-center gap-1 ${
            timeRemaining < 60 ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'
          }`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatTime(timeRemaining)}
          </span>
        )}
      </div>
      <div className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div 
          className="h-full bg-blue-600 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

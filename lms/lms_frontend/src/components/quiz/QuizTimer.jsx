import { useState, useEffect } from 'react';

/**
 * Quiz Timer Component
 * Displays countdown timer for quiz
 */
const QuizTimer = ({ 
  timeLimit, // in minutes
  startedAt, // ISO timestamp
  onTimeUp 
}) => {
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isWarning, setIsWarning] = useState(false);

  useEffect(() => {
    if (!timeLimit || !startedAt) {
      setTimeRemaining(null);
      return;
    }

    const calculateTimeRemaining = () => {
      const startTime = new Date(startedAt).getTime();
      const now = new Date().getTime();
      const elapsed = Math.floor((now - startTime) / 1000); // seconds
      const totalSeconds = timeLimit * 60;
      const remaining = totalSeconds - elapsed;

      if (remaining <= 0) {
        setTimeRemaining(0);
        if (onTimeUp) {
          onTimeUp();
        }
        return 0;
      }

      setTimeRemaining(remaining);
      
      // Show warning when less than 5 minutes remaining
      setIsWarning(remaining <= 300);
      
      return remaining;
    };

    // Calculate immediately
    const remaining = calculateTimeRemaining();

    // Update every second
    const interval = setInterval(() => {
      const newRemaining = calculateTimeRemaining();
      if (newRemaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLimit, startedAt, onTimeUp]);

  const formatTime = (seconds) => {
    if (seconds === null || seconds < 0) return '--:--';
    
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!timeLimit || timeRemaining === null) {
    return null;
  }

  return (
    <div className={`flex items-center gap-3 px-6 py-3 rounded-xl font-mono border-2 shadow-md ${
      isWarning 
        ? 'bg-gradient-to-r from-red-50 to-red-100 text-red-700 border-red-300' 
        : 'bg-gradient-to-r from-primary-50 to-primary-100 text-primary-700 border-primary-300'
    }`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
        isWarning ? 'bg-red-200' : 'bg-primary-200'
      }`}>
        <svg 
          className={`w-6 h-6 ${isWarning ? 'text-red-600' : 'text-primary-600'}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div className="flex flex-col">
        <span className="text-2xl font-bold">
          {formatTime(timeRemaining)}
        </span>
        {isWarning && timeRemaining > 0 && (
          <span className="text-xs font-bold text-red-600">Time running out!</span>
        )}
      </div>
    </div>
  );
};

export default QuizTimer;


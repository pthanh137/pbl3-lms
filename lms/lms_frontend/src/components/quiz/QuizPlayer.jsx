import { useState, useEffect, useRef } from 'react';
import QuizTimer from './QuizTimer';
import QuizSidebar from './QuizSidebar';

/**
 * Premium Udemy-style Quiz Player Component
 * Full quiz interface with timer, sidebar navigation, auto-save, and warnings
 */
const QuizPlayer = ({
  quiz,
  attempt, // { id, started_at, ... }
  onSubmit,
  onTimeUp
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [questionId]: selectedChoiceId }
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const autoSaveIntervalRef = useRef(null);
  const hasUnsavedChangesRef = useRef(false);

  const questions = quiz?.questions || [];
  const currentQuestion = questions[currentQuestionIndex];

  // Auto-save answers every 2 seconds
  useEffect(() => {
    if (questions.length === 0) return;

    autoSaveIntervalRef.current = setInterval(() => {
      if (hasUnsavedChangesRef.current) {
        // Save to localStorage
        localStorage.setItem(`quiz_${quiz.id}_answers`, JSON.stringify(answers));
        hasUnsavedChangesRef.current = false;
      }
    }, 2000);

    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, [answers, quiz?.id, questions.length]);

  // Load saved answers from localStorage on mount
  useEffect(() => {
    if (quiz?.id) {
      const saved = localStorage.getItem(`quiz_${quiz.id}_answers`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setAnswers(parsed);
        } catch (e) {
          console.error('Error loading saved answers:', e);
        }
      }
    }
  }, [quiz?.id]);

  // Warning before leaving page
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (Object.keys(answers).length > 0) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [answers]);

  const handleAnswerChange = (questionId, choiceId) => {
    setAnswers(prev => {
      const newAnswers = { ...prev, [questionId]: choiceId };
      hasUnsavedChangesRef.current = true;
      return newAnswers;
    });
  };

  const handleQuestionClick = (index) => {
    setCurrentQuestionIndex(index);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setShowSubmitModal(false);
    setSubmitting(true);

    // Prepare answers in API format
    const answersArray = Object.entries(answers).map(([questionId, choiceId]) => ({
      question: parseInt(questionId),
      selected_choice: parseInt(choiceId)
    }));

    // Clear saved answers
    if (quiz?.id) {
      localStorage.removeItem(`quiz_${quiz.id}_answers`);
    }

    if (onSubmit) {
      await onSubmit({ answers: answersArray });
    }
    
    setSubmitting(false);
  };

  const unansweredCount = questions.filter(q => !answers[q.id]).length;
  const answeredCount = questions.length - unansweredCount;

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-slate-500">No questions available</p>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-gradient-to-br from-white via-slate-50 to-primary-50">
      {/* Sidebar - Coursera Style */}
      <QuizSidebar
        questions={questions}
        currentQuestionIndex={currentQuestionIndex}
        answers={answers}
        onQuestionClick={handleQuestionClick}
      />

      {/* Main Content - Coursera Style */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header with Timer - Coursera Style */}
        <div className="bg-white border-b-2 border-slate-200 px-8 py-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">{quiz?.title}</h2>
              <div className="flex items-center gap-4">
                <p className="text-base font-semibold text-slate-600">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </p>
                {unansweredCount > 0 && (
                  <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-bold border-2 border-amber-200">
                    {unansweredCount} unanswered
                  </span>
                )}
              </div>
            </div>
            {quiz?.time_limit && attempt?.started_at && (
              <QuizTimer
                timeLimit={quiz.time_limit}
                startedAt={attempt.started_at}
                onTimeUp={onTimeUp}
              />
            )}
          </div>
        </div>

        {/* Question Content - Coursera Style */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto">
            {/* Question Card - Coursera Style */}
            <div className="bg-white rounded-2xl border-2 border-slate-200 p-8 mb-8 shadow-lg">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-4 py-2 bg-primary-100 text-primary-700 rounded-lg text-sm font-bold border-2 border-primary-200">
                      Question {currentQuestionIndex + 1}
                    </span>
                    <span className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold border-2 border-slate-200">
                      {currentQuestion.points} {currentQuestion.points === 1 ? 'point' : 'points'}
                    </span>
                  </div>
                  <p className="text-xl font-bold text-slate-900 mb-8 leading-relaxed">
                    {currentQuestion.text}
                  </p>
                </div>
              </div>

              {/* Choices - Coursera Style */}
              <div className="space-y-4">
                {currentQuestion.choices?.map((choice, index) => {
                  const isSelected = answers[currentQuestion.id] === choice.id;
                  
                  return (
                    <label
                      key={choice.id}
                      className={`flex items-start gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary-500 bg-gradient-to-r from-primary-50 to-primary-100 shadow-md'
                          : 'border-slate-200 hover:border-primary-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                        isSelected
                          ? 'border-primary-500 bg-primary-500'
                          : 'border-slate-300 bg-white'
                      }`}>
                        {isSelected && (
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <input
                        type="radio"
                        name={`question-${currentQuestion.id}`}
                        value={choice.id}
                        checked={isSelected}
                        onChange={() => handleAnswerChange(currentQuestion.id, choice.id)}
                        className="hidden"
                      />
                      <span className={`flex-1 text-base font-medium ${
                        isSelected ? 'text-primary-900' : 'text-slate-900'
                      }`}>
                        {choice.text}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Navigation - Coursera Style */}
        <div className="bg-white border-t-2 border-slate-200 px-8 py-5 shadow-md">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="px-8 py-3 rounded-lg font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md border-2 border-slate-300"
            >
              ← Previous
            </button>

            <div className="flex items-center gap-4">
              <div className="px-5 py-2 bg-slate-100 rounded-lg border-2 border-slate-200">
                <span className="text-sm font-bold text-slate-700">
                  {answeredCount} / {questions.length} answered
                </span>
              </div>
              {currentQuestionIndex < questions.length - 1 ? (
                <button
                  onClick={handleNext}
                  className="px-8 py-3 rounded-lg font-bold bg-primary-500 hover:bg-primary-600 text-white transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Next →
                </button>
              ) : (
                <button
                  onClick={() => setShowSubmitModal(true)}
                  disabled={submitting || unansweredCount > 0}
                  className="px-8 py-3 rounded-lg font-bold bg-accent-500 hover:bg-accent-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:hover:transform-none"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </span>
                  ) : 'Submit Quiz'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal - Coursera Style */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl border-2 border-slate-200">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3 text-center">Submit Quiz?</h3>
            <p className="text-base text-slate-600 mb-8 text-center leading-relaxed">
              You have <span className="font-bold text-amber-600">{unansweredCount}</span> unanswered question{unansweredCount !== 1 ? 's' : ''}. 
              <br />Are you sure you want to submit your quiz?
            </p>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 px-6 py-3 rounded-lg font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 transition-all shadow-sm hover:shadow-md border-2 border-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 px-6 py-3 rounded-lg font-bold bg-accent-500 hover:bg-accent-600 text-white disabled:opacity-50 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:hover:transform-none"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </span>
                ) : 'Yes, Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizPlayer;


/**
 * Quiz Sidebar Component
 * Displays numbered bubbles for question navigation
 */
const QuizSidebar = ({
  questions = [],
  currentQuestionIndex,
  answers = {}, // { [questionId]: selectedChoiceId }
  onQuestionClick
}) => {
  const getQuestionStatus = (question) => {
    const hasAnswer = answers[question.id] !== undefined && answers[question.id] !== null;
    const isCurrent = questions[currentQuestionIndex]?.id === question.id;
    
    if (isCurrent) return 'current';
    if (hasAnswer) return 'answered';
    return 'unanswered';
  };

  return (
    <div className="w-24 bg-white border-r-2 border-slate-200 p-6 overflow-y-auto shadow-sm">
      <div className="flex flex-col gap-3">
        {questions.map((question, index) => {
          const status = getQuestionStatus(question);
          
          return (
            <button
              key={question.id}
              onClick={() => onQuestionClick(index)}
              className={`w-12 h-12 rounded-xl flex items-center justify-center text-base font-bold transition-all border-2 ${
                status === 'current'
                  ? 'bg-primary-500 text-white shadow-xl scale-110 ring-4 ring-primary-200 border-primary-600'
                  : status === 'answered'
                  ? 'bg-accent-500 text-white hover:bg-accent-600 border-accent-600 shadow-md hover:shadow-lg'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300 hover:border-slate-400'
              }`}
              title={`Question ${index + 1}${status === 'answered' ? ' (Answered)' : status === 'current' ? ' (Current)' : ''}`}
            >
              {index + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuizSidebar;


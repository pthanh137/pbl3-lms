/**
 * QuizStatusBadge Component
 * 
 * Displays the status of a quiz for a student.
 * Props:
 * - status: "not_started" | "in_progress" | "completed"
 */
const QuizStatusBadge = ({ status = "not_started" }) => {
  const getStatusConfig = () => {
    switch (status) {
      case "in_progress":
        return {
          className: "inline-flex items-center px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium",
          label: "In progress"
        };
      case "completed":
        return {
          className: "inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium",
          label: "Completed"
        };
      default:
        return {
          className: "inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium",
          label: "Not started"
        };
    }
  };

  const config = getStatusConfig();

  return (
    <span className={config.className}>
      {config.label}
    </span>
  );
};

export default QuizStatusBadge;


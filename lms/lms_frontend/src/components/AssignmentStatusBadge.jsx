/**
 * AssignmentStatusBadge Component
 * 
 * Displays the status of an assignment for a student.
 * Props:
 * - status: "not_submitted" | "submitted" | "graded"
 */
const AssignmentStatusBadge = ({ status = "not_submitted" }) => {
  const getStatusConfig = () => {
    switch (status) {
      case "submitted":
        return {
          className: "inline-flex items-center px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium",
          label: "Submitted"
        };
      case "graded":
        return {
          className: "inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium",
          label: "Graded"
        };
      default:
        return {
          className: "inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium",
          label: "Not submitted"
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

export default AssignmentStatusBadge;


/**
 * Course Categories Configuration
 * 
 * Fixed list of Computer Science-related categories for the LMS.
 * Categories are stored as IDs in the database, but displayed as labels in the UI.
 */

export const COURSE_CATEGORIES = [
  { id: "web-development", label: "Web Development" },
  { id: "programming-languages", label: "Programming Languages" },
  { id: "data-science", label: "Data Science" },
  { id: "ai-ml", label: "AI & Machine Learning" },
  { id: "mobile-development", label: "Mobile Development" },
  { id: "game-development", label: "Game Development" },
  { id: "cloud-devops", label: "Cloud & DevOps" },
  { id: "cybersecurity", label: "Cybersecurity" },
  { id: "databases-sql", label: "Databases & SQL" },
  { id: "software-engineering", label: "Software Engineering" },
  { id: "data-structures-algorithms", label: "Data Structures & Algorithms" },
  { id: "cs-fundamentals", label: "CS Fundamentals" },
];

/**
 * Get the display label for a category ID.
 * @param {string|null|undefined} id - The category ID
 * @returns {string} The display label, or the original ID if not found
 */
export const getCategoryLabel = (id) => {
  if (!id) return "";
  const found = COURSE_CATEGORIES.find(c => c.id === id);
  return found?.label ?? id;
};

/**
 * Check if a category ID is valid (exists in COURSE_CATEGORIES).
 * @param {string|null|undefined} id - The category ID
 * @returns {boolean}
 */
export const isValidCategory = (id) => {
  if (!id) return false;
  return COURSE_CATEGORIES.some(c => c.id === id);
};


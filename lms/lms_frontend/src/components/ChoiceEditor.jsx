import { useState } from 'react';
import { assessmentsAPI } from '../api/client';

/**
 * ChoiceEditor Component
 * 
 * Allows editing a single choice for a question.
 * Props:
 * - choice: { id, text, is_correct }
 * - onUpdated: callback when choice is updated
 * - onDeleted: callback when choice is deleted
 */
const ChoiceEditor = ({ choice, onUpdated, onDeleted }) => {
  const [text, setText] = useState(choice.text || '');
  const [isCorrect, setIsCorrect] = useState(choice.is_correct || false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    if (!text.trim()) {
      setError('Choice text cannot be empty');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await assessmentsAPI.updateChoice(choice.id, {
        text: text.trim(),
        is_correct: isCorrect,
      });
      onUpdated();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update choice');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this choice?')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await assessmentsAPI.deleteChoice(choice.id);
      onDeleted();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete choice');
      setLoading(false);
    }
  };

  return (
    <div 
      className="flex items-center gap-3 w-full p-2 bg-slate-50 rounded-lg border border-slate-200"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Choice text"
        className="flex-1 px-3 py-1.5 text-sm border-2 border-slate-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition bg-white"
        disabled={loading}
        onClick={(e) => e.stopPropagation()}
      />
      
      <label 
        className="flex items-center gap-1 text-xs text-slate-600 cursor-pointer whitespace-nowrap"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="checkbox"
          checked={isCorrect}
          onChange={(e) => setIsCorrect(e.target.checked)}
          className="h-3 w-3 text-primary-500 border-slate-300 rounded focus:ring-primary-500"
          disabled={loading}
          onClick={(e) => e.stopPropagation()}
        />
        <span className={isCorrect ? 'text-accent-600 font-medium' : ''}>Correct</span>
      </label>

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleSave();
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        disabled={loading || !text.trim()}
        className="px-2.5 py-1 text-xs font-medium rounded-lg bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition whitespace-nowrap shadow-sm hover:shadow-md"
      >
        {loading ? 'Saving...' : 'Save'}
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleDelete();
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        disabled={loading}
        className="px-2.5 py-1 text-xs font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition whitespace-nowrap shadow-sm hover:shadow-md"
      >
        Delete
      </button>

      {error && (
        <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">{error}</div>
      )}
    </div>
  );
};

export default ChoiceEditor;


import { useState, useEffect, useRef } from 'react';
import { assessmentsAPI } from '../api/client';
import ChoiceEditor from './ChoiceEditor';

/**
 * QuestionEditor Component
 * 
 * Allows editing a question and its choices.
 * Props:
 * - question: { id, text, points, order, choices: [] }
 * - index: question index for display
 * - isExpanded: controlled expanded state from parent
 * - onExpandedChange: callback when expanded state changes
 * - onUpdated: callback when question is updated
 * - onDeleted: callback when question is deleted
 */
const QuestionEditor = ({ question, index = 0, isExpanded: controlledExpanded, onExpandedChange, onUpdated, onDeleted }) => {
  const [text, setText] = useState(question.text || '');
  const [points, setPoints] = useState(question.points || 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [choices, setChoices] = useState(question.choices || []);
  const [newChoiceText, setNewChoiceText] = useState('');
  const [addingChoice, setAddingChoice] = useState(false);
  
  // Use controlled expanded state if provided, otherwise use local state
  const [localExpanded, setLocalExpanded] = useState(false);
  const expanded = controlledExpanded !== undefined ? controlledExpanded : localExpanded;
  
  const setExpanded = (value) => {
    if (onExpandedChange) {
      onExpandedChange(value);
    } else {
      setLocalExpanded(value);
    }
  };

  // Update local state when question prop changes
  useEffect(() => {
    setText(question.text || '');
    setPoints(question.points || 1);
    setChoices(question.choices || []);
    // Expanded state is controlled by parent, so no need to preserve it here
  }, [question]);

  const handleSave = async () => {
    if (!text.trim()) {
      setError('Question text cannot be empty');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await assessmentsAPI.updateQuestion(question.id, {
        text: text.trim(),
        points: parseInt(points) || 1,
        order: question.order || 0,
      });
      onUpdated();
      // Collapse after saving question
      setExpanded(false);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update question');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this question? All choices will be deleted too.')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await assessmentsAPI.deleteQuestion(question.id);
      onDeleted();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete question');
      setLoading(false);
    }
  };

  const handleAddChoice = async () => {
    if (!newChoiceText.trim()) {
      return;
    }

    setAddingChoice(true);
    setError(null);

    try {
      const response = await assessmentsAPI.createChoice(question.id, {
        text: newChoiceText.trim(),
        is_correct: false,
      });
      setChoices([...choices, response.data]);
      setNewChoiceText('');
      // Keep expanded - don't collapse
      setExpanded(true);
      onUpdated();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add choice');
    } finally {
      setAddingChoice(false);
    }
  };

  const handleChoiceUpdated = () => {
    // Keep expanded - don't collapse
    setExpanded(true);
    // Refresh question data
    onUpdated();
  };

  const handleChoiceDeleted = (deletedChoiceId) => {
    setChoices(choices.filter(c => c.id !== deletedChoiceId));
    // Keep expanded - don't collapse
    setExpanded(true);
    onUpdated();
  };

  return (
    <div className="bg-white rounded-xl border-2 border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition">
      {/* Header Row - Always Visible - Coursera Style */}
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition-colors"
        onClick={() => {
          setExpanded(!expanded);
        }}
      >
        <div className="flex flex-col flex-1 min-w-0">
          <span className="text-sm font-semibold text-slate-900">
            Question {index + 1}
          </span>
          <span className="text-xs text-slate-500 line-clamp-1 mt-0.5">
            {text || "Click to edit question text"}
          </span>
        </div>
        <div className="flex items-center gap-3 ml-3">
          <span className="text-xs text-primary-500 font-medium whitespace-nowrap">
            {points} pts
          </span>
          <svg
            className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Body - Only when expanded */}
      {expanded && (
        <div 
          className="px-4 pb-4 pt-2 space-y-3 border-t border-slate-100"
          onClick={(e) => e.stopPropagation()}
        >
          {error && (
            <div className="text-xs text-red-600 bg-red-50 p-2 rounded">{error}</div>
          )}

          {/* Question Text */}
          <div onClick={(e) => e.stopPropagation()}>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Question Text
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter your question..."
              rows={2}
              className="w-full px-3 py-2 text-sm border-2 border-slate-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition"
              disabled={loading}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Points and Actions - Coursera Style */}
          <div 
            className="flex items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Points
              </label>
              <input
                type="number"
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                min="1"
                className="w-16 px-2 py-1.5 text-sm border-2 border-slate-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition"
                disabled={loading}
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            <div 
              className="flex gap-2 pt-5"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSave();
                }}
                disabled={loading || !text.trim()}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm hover:shadow-md"
              >
                {loading ? 'Saving...' : 'Save Question'}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                disabled={loading}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm hover:shadow-md"
              >
                Delete Question
              </button>
            </div>
          </div>

          {/* Choices Section */}
          <div 
            className="border-t border-slate-100 pt-3"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div 
              className="flex items-center justify-between mb-2"
              onClick={(e) => e.stopPropagation()}
            >
              <h4 className="text-sm font-semibold text-slate-900">Choices</h4>
            </div>

            {/* Existing Choices */}
            <div 
              className="space-y-2 mb-3"
              onClick={(e) => e.stopPropagation()}
            >
              {choices.map((choice) => (
                <ChoiceEditor
                  key={choice.id}
                  choice={choice}
                  onUpdated={handleChoiceUpdated}
                  onDeleted={() => handleChoiceDeleted(choice.id)}
                />
              ))}
            </div>

            {/* Add New Choice */}
            <div 
              className="flex gap-2"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <input
                type="text"
                value={newChoiceText}
                onChange={(e) => setNewChoiceText(e.target.value)}
                placeholder="Enter choice text..."
                className="flex-1 px-3 py-1.5 text-sm border-2 border-slate-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.stopPropagation();
                    handleAddChoice();
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              />
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddChoice();
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                disabled={addingChoice || !newChoiceText.trim()}
                className="px-3 py-1.5 bg-accent-500 hover:bg-accent-600 text-white rounded-lg text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm hover:shadow-md"
              >
                {addingChoice ? 'Adding...' : 'Add Choice'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionEditor;


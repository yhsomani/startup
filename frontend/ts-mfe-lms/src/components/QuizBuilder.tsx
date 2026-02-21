import React, { useState } from 'react';

interface Question {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'text';
  question: string;
  options?: string[];
  correctAnswer: string | number;
  explanation?: string;
  points: number;
}

interface QuizBuilderProps {
  questions: Question[];
  onSave: (questions: Question[]) => void;
  onCancel: () => void;
}

export const QuizBuilder: React.FC<QuizBuilderProps> = ({ questions: initialQuestions, onSave, onCancel }) => {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);

  const questionTypes = [
    { value: 'multiple-choice', label: 'Multiple Choice' },
    { value: 'true-false', label: 'True/False' },
    { value: 'text', label: 'Text Answer' }
  ];

  const addQuestion = () => {
    const newQuestion: Question = {
      id: `question-${Date.now()}`,
      type: 'multiple-choice',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: '',
      points: 1
    };
    setEditingQuestion(newQuestion);
    setIsAddingQuestion(true);
  };

  const updateQuestion = (index: number, updates: Partial<Question>) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = { ...updatedQuestions[index], ...updates };
    setQuestions(updatedQuestions);
  };

  const deleteQuestion = (index: number) => {
    const updatedQuestions = questions.filter((_, i) => i !== index);
    setQuestions(updatedQuestions);
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) ||
      (direction === 'down' && index === questions.length - 1)) {
      return;
    }

    const updatedQuestions = [...questions];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [updatedQuestions[index], updatedQuestions[newIndex]] = [updatedQuestions[newIndex], updatedQuestions[index]];
    setQuestions(updatedQuestions);
  };

  const saveQuestion = () => {
    if (!editingQuestion) return;

    if (!editingQuestion.question.trim()) {
      alert('Please enter a question');
      return;
    }

    if (editingQuestion.type === 'multiple-choice') {
      if (!editingQuestion.options || editingQuestion.options.length < 2) {
        alert('Please add at least 2 options');
        return;
      }
      if (editingQuestion.options.some(opt => !opt.trim())) {
        alert('Please fill in all options');
        return;
      }
    }

    if (isAddingQuestion) {
      setQuestions([...questions, editingQuestion]);
    } else {
      const index = questions.findIndex(q => q.id === editingQuestion.id);
      if (index !== -1) {
        updateQuestion(index, editingQuestion);
      }
    }

    setEditingQuestion(null);
    setIsAddingQuestion(false);
  };

  const addOption = () => {
    if (editingQuestion && editingQuestion.options) {
      setEditingQuestion({
        ...editingQuestion,
        options: [...editingQuestion.options, '']
      });
    }
  };

  const updateOption = (index: number, value: string) => {
    if (editingQuestion && editingQuestion.options) {
      const updatedOptions = [...editingQuestion.options];
      updatedOptions[index] = value;
      setEditingQuestion({
        ...editingQuestion,
        options: updatedOptions
      });
    }
  };

  const removeOption = (index: number) => {
    if (editingQuestion && editingQuestion.options && editingQuestion.options.length > 2) {
      const updatedOptions = editingQuestion.options.filter((_, i) => i !== index);
      setEditingQuestion({
        ...editingQuestion,
        options: updatedOptions,
        correctAnswer: Math.min(editingQuestion.correctAnswer as number, updatedOptions.length - 1)
      });
    }
  };

  const getTotalPoints = () => {
    return questions.reduce((total, question) => total + question.points, 0);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '900px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.25rem' }}>
              Quiz Builder
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              {questions.length} questions • {getTotalPoints()} total points
            </p>
          </div>
          <button
            onClick={onCancel}
            disabled={!!editingQuestion}
            style={{
              padding: '0.5rem',
              backgroundColor: 'transparent',
              border: 'none',
              fontSize: '1.5rem',
              cursor: !!editingQuestion ? 'not-allowed' : 'pointer',
              color: '#6b7280',
              opacity: !!editingQuestion ? 0.5 : 1
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem' }}>
          {!editingQuestion ? (
            <div>
              {/* Questions List */}
              {questions.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '3rem',
                  backgroundColor: '#f9fafb',
                  borderRadius: '12px',
                  border: '2px dashed #d1d5db',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                    No Questions Yet
                  </h3>
                  <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
                    Add your first question to get started
                  </p>
                  <button
                    onClick={addQuestion}
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#4f46e5',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Add Question
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                  {questions.map((question, index) => (
                    <div
                      key={question.id}
                      style={{
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '1rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <span style={{
                              fontWeight: 600,
                              color: '#4f46e5'
                            }}>
                              Q{index + 1}
                            </span>
                            <span style={{
                              padding: '0.125rem 0.5rem',
                              backgroundColor: '#e5e7eb',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              color: '#374151'
                            }}>
                              {questionTypes.find(t => t.value === question.type)?.label}
                            </span>
                            <span style={{
                              padding: '0.125rem 0.5rem',
                              backgroundColor: '#fef3c7',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              color: '#92400e'
                            }}>
                              {question.points} point{question.points !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <p style={{ fontWeight: 500, marginBottom: '0.5rem' }}>
                            {question.question}
                          </p>
                          {question.type === 'multiple-choice' && question.options && (
                            <div style={{ marginLeft: '1rem' }}>
                              {question.options.map((option, optIndex) => (
                                <div
                                  key={optIndex}
                                  style={{
                                    padding: '0.25rem 0',
                                    fontSize: '0.875rem',
                                    color: optIndex === question.correctAnswer ? '#059669' : '#6b7280'
                                  }}
                                >
                                  {String.fromCharCode(65 + optIndex)}. {option}
                                  {optIndex === question.correctAnswer && ' ✓'}
                                </div>
                              ))}
                            </div>
                          )}
                          {question.type === 'true-false' && (
                            <div style={{ marginLeft: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                              Correct answer: {question.correctAnswer === 'true' ? 'True' : 'False'}
                            </div>
                          )}
                          {question.explanation && (
                            <div style={{
                              marginTop: '0.5rem',
                              padding: '0.5rem',
                              backgroundColor: '#f0f9ff',
                              borderRadius: '4px',
                              fontSize: '0.875rem',
                              color: '#0c4a6e'
                            }}>
                              <strong>Explanation:</strong> {question.explanation}
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginLeft: '1rem' }}>
                          <button
                            onClick={() => moveQuestion(index, 'up')}
                            disabled={index === 0}
                            style={{
                              padding: '0.25rem',
                              backgroundColor: 'transparent',
                              border: 'none',
                              cursor: index === 0 ? 'not-allowed' : 'pointer',
                              opacity: index === 0 ? 0.5 : 1,
                              fontSize: '0.75rem'
                            }}
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => moveQuestion(index, 'down')}
                            disabled={index === questions.length - 1}
                            style={{
                              padding: '0.25rem',
                              backgroundColor: 'transparent',
                              border: 'none',
                              cursor: index === questions.length - 1 ? 'not-allowed' : 'pointer',
                              opacity: index === questions.length - 1 ? 0.5 : 1,
                              fontSize: '0.75rem'
                            }}
                          >
                            ↓
                          </button>
                          <button
                            onClick={() => {
                              setEditingQuestion(question);
                              setIsAddingQuestion(false);
                            }}
                            style={{
                              padding: '0.25rem 0.5rem',
                              backgroundColor: '#3b82f6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              cursor: 'pointer'
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteQuestion(index)}
                            style={{
                              padding: '0.25rem 0.5rem',
                              backgroundColor: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              cursor: 'pointer'
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Question Button */}
              <button
                onClick={addQuestion}
                style={{
                  width: '100%',
                  padding: '1rem',
                  backgroundColor: '#f8fafc',
                  border: '2px dashed #d1d5db',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <div style={{ fontSize: '1.5rem' }}>+</div>
                <div style={{ fontWeight: 500 }}>Add Question</div>
              </button>
            </div>
          ) : (
            /* Question Editor */
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>
                {isAddingQuestion ? 'Add New Question' : 'Edit Question'}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Question Type */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                    Question Type
                  </label>
                  <select
                    value={editingQuestion.type}
                    onChange={(e) => setEditingQuestion({
                      ...editingQuestion,
                      type: e.target.value as Question['type'],
                      options: e.target.value === 'multiple-choice' ? ['', '', '', ''] : undefined,
                      correctAnswer: e.target.value === 'multiple-choice' ? 0 :
                        e.target.value === 'true-false' ? 'true' : ''
                    })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px'
                    }}
                  >
                    {questionTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Question Text */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                    Question
                  </label>
                  <textarea
                    value={editingQuestion.question}
                    onChange={(e) => setEditingQuestion({
                      ...editingQuestion,
                      question: e.target.value
                    })}
                    placeholder="Enter your question here"
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      resize: 'vertical'
                    }}
                  />
                </div>

                {/* Options for Multiple Choice */}
                {editingQuestion.type === 'multiple-choice' && editingQuestion.options && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                      Answer Options
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {editingQuestion.options.map((option, index) => (
                        <div key={index} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <input
                            type="radio"
                            name="correctAnswer"
                            checked={editingQuestion.correctAnswer === index}
                            onChange={() => setEditingQuestion({
                              ...editingQuestion,
                              correctAnswer: index
                            })}
                            style={{ cursor: 'pointer' }}
                          />
                          <span style={{ fontWeight: 500, minWidth: '30px' }}>
                            {String.fromCharCode(65 + index)}.
                          </span>
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => updateOption(index, e.target.value)}
                            placeholder={`Option ${String.fromCharCode(65 + index)}`}
                            style={{
                              flex: 1,
                              padding: '0.5rem',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px'
                            }}
                          />
                          {(editingQuestion.options?.length ?? 0) > 2 && (
                            <button
                              onClick={() => removeOption(index)}
                              style={{
                                padding: '0.25rem 0.5rem',
                                backgroundColor: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                cursor: 'pointer'
                              }}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={addOption}
                        style={{
                          padding: '0.5rem',
                          backgroundColor: '#f3f4f6',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.875rem'
                        }}
                      >
                        + Add Option
                      </button>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                      Select the radio button next to the correct answer
                    </p>
                  </div>
                )}

                {/* Correct Answer for True/False */}
                {editingQuestion.type === 'true-false' && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                      Correct Answer
                    </label>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="tfAnswer"
                          checked={editingQuestion.correctAnswer === 'true'}
                          onChange={() => setEditingQuestion({
                            ...editingQuestion,
                            correctAnswer: 'true'
                          })}
                        />
                        True
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="tfAnswer"
                          checked={editingQuestion.correctAnswer === 'false'}
                          onChange={() => setEditingQuestion({
                            ...editingQuestion,
                            correctAnswer: 'false'
                          })}
                        />
                        False
                      </label>
                    </div>
                  </div>
                )}

                {/* Correct Answer for Text */}
                {editingQuestion.type === 'text' && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                      Correct Answer
                    </label>
                    <input
                      type="text"
                      value={editingQuestion.correctAnswer as string}
                      onChange={(e) => setEditingQuestion({
                        ...editingQuestion,
                        correctAnswer: e.target.value
                      })}
                      placeholder="Enter the correct answer"
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px'
                      }}
                    />
                  </div>
                )}

                {/* Points */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                    Points
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={editingQuestion.points}
                    onChange={(e) => setEditingQuestion({
                      ...editingQuestion,
                      points: Number(e.target.value)
                    })}
                    style={{
                      width: '100px',
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px'
                    }}
                  />
                </div>

                {/* Explanation */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                    Explanation (optional)
                  </label>
                  <textarea
                    value={editingQuestion.explanation || ''}
                    onChange={(e) => setEditingQuestion({
                      ...editingQuestion,
                      explanation: e.target.value
                    })}
                    placeholder="Explain why this is the correct answer"
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '1.5rem',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            {editingQuestion && (
              <button
                onClick={() => {
                  setEditingQuestion(null);
                  setIsAddingQuestion(false);
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            {editingQuestion ? (
              <button
                onClick={saveQuestion}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#4f46e5',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {isAddingQuestion ? 'Add Question' : 'Update Question'}
              </button>
            ) : (
              <>
                <button
                  onClick={onCancel}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => onSave(questions)}
                  disabled={questions.length === 0}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: questions.length > 0 ? '#10b981' : '#d1d5db',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: questions.length > 0 ? 'pointer' : 'not-allowed'
                  }}
                >
                  Save Quiz ({questions.length} questions)
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

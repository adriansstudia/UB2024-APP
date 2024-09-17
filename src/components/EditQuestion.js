// components/EditQuestion.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill'; // Import ReactQuill
import 'react-quill/dist/quill.snow.css'; // Import the default Quill theme
import './EditQuestion.css'; // Import the CSS file

const EditQuestion = ({ questions, saveQuestion }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [editedQuestion, setEditedQuestion] = useState({
    number: '',
    question: '',
    kategoria: '',
    zestaw: '',
    rating: 1,
    answer: '',
  });
  const [isHtmlMode, setIsHtmlMode] = useState(true); // Toggle for HTML or Rich Text

  useEffect(() => {
    const question = questions.find((q) => q.id === id);
    if (question) {
      setEditedQuestion(question);
    } else {
      console.error('Question not found');
      navigate('/UB2024-APP/questions'); // Redirect or show error
    }
  }, [id, questions, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedQuestion(prev => ({ ...prev, [name]: value }));
  };

  const handleAnswerChange = (value) => {
    setEditedQuestion(prev => ({ ...prev, answer: value }));
  };

  const handleSubmit = () => {
    saveQuestion(id, editedQuestion);
    navigate(-1); // Go back to the previous page
  };

  const handleClose = () => {
    navigate(-1); // Go back to the previous page
  };

  return (
    <div className="edit-question-overlay">
      <div className="edit-question-window">
        <button className="close-button" onClick={handleClose}>X</button>
        <h2>Edit Question</h2>
        
        <div className="edit-question-row">
          <label>
            Question:
            <input 
              name="question" 
              value={editedQuestion.question} 
              onChange={handleChange} 
              type="text" 
            />
          </label>
        </div>

        <div className="edit-question-row">
          <label>
            Kategoria:
            <input 
              name="kategoria" 
              value={editedQuestion.kategoria} 
              onChange={handleChange} 
              type="text" 
            />
          </label>
        </div>

        <div className="edit-question-row">
          <label>
            Zestaw:
            <input 
              name="zestaw" 
              value={editedQuestion.zestaw} 
              onChange={handleChange} 
              type="text" 
            />
          </label>
        </div>

        <div className="edit-question-row">
          <label>
            Rating:
            <select 
              name="rating" 
              value={editedQuestion.rating} 
              onChange={handleChange}
            >
              {[1, 2, 3, 4, 5].map(num => (
                <option key={num} value={num}>
                  {num}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="edit-question-row">
          <label>
            Answer:
          </label>
          <div className="editor-tabs">
            <button 
              className={`editor-tab ${isHtmlMode ? 'active' : ''}`} 
              onClick={() => setIsHtmlMode(true)}
            >
              Edit HTML
            </button>
            <button 
              className={`editor-tab ${!isHtmlMode ? 'active' : ''}`} 
              onClick={() => setIsHtmlMode(false)}
            >
              Edit Formatted Text
            </button>
          </div>

          <div className="answer-editor">
            {isHtmlMode ? (
              <textarea 
                name="answer" 
                value={editedQuestion.answer} 
                onChange={handleChange} 
                rows="10"
              />
            ) : (
              <ReactQuill 
                value={editedQuestion.answer} 
                onChange={handleAnswerChange} 
                modules={modules}
                formats={formats}
              />
            )}
          </div>
        </div>

        <button className="save-button" onClick={handleSubmit}>Save</button>
      </div>
    </div>
  );
};

// Quill editor modules
const modules = {
  toolbar: [
    [{ 'header': '1' }, { 'header': '2' }],
    ['bold', 'italic', 'underline'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['link', 'image'],
    [{ 'align': [] }],
    ['clean']
  ],
};

// Quill editor formats
const formats = [
  'header', 'bold', 'italic', 'underline',
  'list', 'bullet', 'link', 'image', 'align'
];

export default EditQuestion;

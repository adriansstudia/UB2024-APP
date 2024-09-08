// components/EditQuestion.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const EditQuestion = ({ questions, saveQuestion }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [editedQuestion, setEditedQuestion] = useState({
    number: '',
    question: '',
    kategoria: '',
    zestaw: '',
    rating: '',
    answer: '',
  });

  useEffect(() => {
    const question = questions.find((q) => q.id === id); // Compare as string if UUID
    if (question) {
      setEditedQuestion(question);
    } else {
      // Handle case where question is not found
      console.error('Question not found');
      navigate('/questions'); // Redirect to questions list or show an error
    }
  }, [id, questions, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedQuestion((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    saveQuestion(id, editedQuestion);
    navigate('/questions');
  };

  return (
    <div className="edit-question">
      <h2>Edit Question</h2>
      <label>
        Question:
        <input name="question" value={editedQuestion.question} onChange={handleChange} />
      </label>
      <label>
        Kategoria:
        <input name="kategoria" value={editedQuestion.kategoria} onChange={handleChange} />
      </label>
      <label>
        Zestaw:
        <input name="zestaw" value={editedQuestion.zestaw} onChange={handleChange} />
      </label>
      <label>
        Rating:
        <input name="rating" value={editedQuestion.rating} onChange={handleChange} />
      </label>
      <label>
        Answer (HTML):
        <textarea name="answer" value={editedQuestion.answer} onChange={handleChange} />
      </label>
      <button onClick={handleSubmit}>Save</button>
    </div>
  );
};

export default EditQuestion;

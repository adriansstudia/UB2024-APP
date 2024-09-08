import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './QuestionDetail.css'; // Import the CSS file
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAnglesLeft, faAnglesRight, faArrowLeft } from '@fortawesome/free-solid-svg-icons';



const QuestionDetail = ({ questions, updateRating, sortBy, filterBy }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [showRatingPopup, setShowRatingPopup] = useState(false);
  const [rating, setRating] = useState(1);

  const [question, setQuestion] = useState(null);
  const [sortedAndFilteredQuestions, setSortedAndFilteredQuestions] = useState([]);

  useEffect(() => {
    // Apply sorting and filtering to the questions list
    let updatedQuestions = [...questions];

    // Apply filtering
    if (filterBy) {
      updatedQuestions = updatedQuestions.filter((q) => q.kategoria === filterBy);
    }

    // Apply sorting
    if (sortBy) {
      updatedQuestions = updatedQuestions.sort((a, b) => {
        if (a[sortBy] === undefined || b[sortBy] === undefined) return 0; // Handle undefined values
        if (typeof a[sortBy] === 'string') {
          return a[sortBy].localeCompare(b[sortBy]);
        }
        return a[sortBy] - b[sortBy]; // For numeric values
      });
    }

    setSortedAndFilteredQuestions(updatedQuestions);

    // Find the current question based on the provided ID
    const foundQuestion = updatedQuestions.find((q) => q.id === id);
    setQuestion(foundQuestion);
    setIsAnswerRevealed(false); // Reset the answer visibility when the question changes
  }, [id, questions, sortBy, filterBy]);

  if (!question) return <p>Question not found.</p>;

  const handleRevealAnswer = () => {
    setIsAnswerRevealed(true);
  };

  const handleHideAnswer = () => {
    setIsAnswerRevealed(false);
  };

  const handleRate = () => {
    setShowRatingPopup(true);
  };

  const handleRating = (value) => {
    setRating(value);
    updateRating(question.id, value);
    setShowRatingPopup(false);
  };

  const handlePrevious = () => {
    const currentIndex = sortedAndFilteredQuestions.findIndex(q => q.id === question.id);
    const previousQuestion = sortedAndFilteredQuestions[currentIndex - 1];
    if (previousQuestion) {
      navigate(`/UB2024-APP/question/${previousQuestion.id}`);
    }
  };

  const handleNext = () => {
    const currentIndex = sortedAndFilteredQuestions.findIndex(q => q.id === question.id);
    const nextQuestion = sortedAndFilteredQuestions[currentIndex + 1];
    if (nextQuestion) {
      navigate(`/UB2024-APP/question/${nextQuestion.id}`);
    }
  };

  return (
    <div className="question-detail">
      <button className="back-button" onClick={() => navigate('/UB2024-APP/questions')}>
        <FontAwesomeIcon icon={faArrowLeft} />
      </button>

      <div className="question-header2">
        <p><strong>Number:</strong> {question.number}</p>
        <p><strong>Kategoria:</strong> {question.kategoria}</p>
        <p><strong>Zestaw:</strong> {question.zestaw}</p>
        <p><strong>Rating:</strong> {question.rating}</p>
      </div>
  
      <h2>{question.question}</h2>
  
      <div className="question-content">
        <button
          onClick={handleRevealAnswer}
          className={`reveal-button ${isAnswerRevealed ? 'hidden' : ''}`}
        >
          Reveal Answer
        </button>
  
        <div className={`answer-container ${isAnswerRevealed ? 'revealed' : ''}`}>
          <div dangerouslySetInnerHTML={{ __html: question.answer }} />
        </div>
  
        {isAnswerRevealed && (
          <button className="hide-button" onClick={handleHideAnswer}>
            Hide Answer
          </button>
        )}
      </div>
      <div className="buttons-container">
        <i className="fas fa-star rate-icon" onClick={handleRate}></i> {/* FontAwesome icon */}
      </div>

      {showRatingPopup && (
        <div className="rating-popup">
          <p>How hard was it?</p>
          <div>
            {[1, 2, 3, 4, 5].map((num) => (
              <button key={num} onClick={() => handleRating(num)}>{num}</button>
            ))}
          </div>
        </div>
      )}


      {/* Previous and Next buttons as FontAwesome arrows */}
      <FontAwesomeIcon
        icon={faAnglesLeft}
        className="prev-arrow"
        onClick={handlePrevious}
      />
      <FontAwesomeIcon
        icon={faAnglesRight}
        className="next-arrow"
        onClick={handleNext}
      />
    </div>

  );
};

export default QuestionDetail;

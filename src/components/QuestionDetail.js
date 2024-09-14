
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
        if (sortBy === 'number') {
          // Parse number properties as integers for numeric sorting
          return (parseInt(a.number, 10) || 0) - (parseInt(b.number, 10) || 0);
        }
  
        if (sortBy === 'zestaw') {
          // Custom sorting for Zestaw in the format D_Z1, where D_Z is sorted as text and 1 as number
          const parseZestaw = (zestaw) => {
            const match = zestaw.match(/([A-Z_]+)(\d*)/);
            return match ? { text: match[1], number: parseInt(match[2], 10) || 0 } : { text: '', number: 0 };
          };
          
          const zestawA = parseZestaw(a.zestaw);
          const zestawB = parseZestaw(b.zestaw);
          
          if (zestawA.text !== zestawB.text) {
            return zestawA.text.localeCompare(zestawB.text);
          }
          return zestawA.number - zestawB.number;
        }
  
        if (sortBy === 'rating') {
          // Sort Rating in descending order. NaN or missing values are moved to the end.
          const ratingA = parseInt(a.rating, 10);
          const ratingB = parseInt(b.rating, 10);
  
          if (isNaN(ratingA)) return 1;
          if (isNaN(ratingB)) return -1;
          return ratingB - ratingA;
        }
  
        if (a[sortBy] === undefined || b[sortBy] === undefined) return 0;
        return typeof a[sortBy] === 'string'
          ? a[sortBy].localeCompare(b[sortBy])
          : a[sortBy] - b[sortBy];
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

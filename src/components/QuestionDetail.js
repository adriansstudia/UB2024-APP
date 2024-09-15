import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './QuestionDetail.css'; // Import the CSS file
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAnglesLeft, faAnglesRight, faArrowLeft, faTimes } from '@fortawesome/free-solid-svg-icons';

const QuestionDetail = ({ questions, updateRating, sortBy, filterBy }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [showRatingPopup, setShowRatingPopup] = useState(false);
  const [rating, setRating] = useState(1);

  const [question, setQuestion] = useState(null);
  const [sortedAndFilteredQuestions, setSortedAndFilteredQuestions] = useState([]);

  const [touchStartX, setTouchStartX] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0); // To track the current question index


  useEffect(() => {
    let updatedQuestions = [...questions];

    if (filterBy) {
      updatedQuestions = updatedQuestions.filter((q) => q.kategoria === filterBy);
    }

    if (sortBy) {
      updatedQuestions = updatedQuestions.sort((a, b) => {
        if (sortBy === 'number') {
          return (parseInt(a.number, 10) || 0) - (parseInt(b.number, 10) || 0);
        }

        if (sortBy === 'zestaw') {
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

    const foundQuestion = updatedQuestions.find((q) => q.id === id);
    setQuestion(foundQuestion);
    setIsAnswerRevealed(false);
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

  const handleCloseRatingPopup = () => {
    setShowRatingPopup(false);
  };

  const handlePrevious = () => {
    const currentIndex = sortedAndFilteredQuestions.findIndex(q => q.id === question.id);
    const previousQuestion = sortedAndFilteredQuestions[currentIndex - 1];
    if (previousQuestion) {
      setCurrentSlide(currentSlide - 1); // Move the slide to the previous one
      setTimeout(() => {
        navigate(`/UB2024-APP/question/${previousQuestion.id}`);
      }, 300); // Delay to allow the animation to complete
    }
  };

  const handleNext = () => {
    const currentIndex = sortedAndFilteredQuestions.findIndex(q => q.id === question.id);
    const nextQuestion = sortedAndFilteredQuestions[currentIndex + 1];
    if (nextQuestion) {
      setCurrentSlide(currentSlide + 1); // Move the slide to the next one
      setTimeout(() => {
        navigate(`/UB2024-APP/question/${nextQuestion.id}`);
      }, 300); // Delay to allow the animation to complete
    }
  };

  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const swipeDistance = touchStartX - touchEndX;

    if (swipeDistance > 50) { // Swipe left
      handleNext();
    } else if (swipeDistance < -50) { // Swipe right
      handlePrevious();
    }
  };

  const getBackgroundClass = (kategoria) => {
    const backgroundClasses = {
      'P': 'highlight-p',
      'L': 'highlight-l',
      'PŻ': 'highlight-pz',
      'I': 'highlight-i'
    };
    return backgroundClasses[kategoria] || '';
  };

  // Function to get background color based on rating
  const getRatingBackgroundColor = (rating) => {
    switch (rating) {
      case 1: return 'green';
      case 2: return 'lightgreen';
      case 3: return 'yellowgreen';
      case 4: return 'orange';
      case 5: return 'red';
      default: return 'transparent';
    }
  };

  return (
    <div 
      className={`question-detail ${getBackgroundClass(question.kategoria)}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <button className="back-button" onClick={() => navigate('/UB2024-APP/questions')}>
        <FontAwesomeIcon icon={faArrowLeft} />
      </button>
      <i className="fas fa-star rate-icon" onClick={handleRate}></i>
      {/* Slide container with dynamic translation based on currentSlide */}
      <div
        className="question-slide"
        style={{
          transform: `translateX(${currentSlide * -100}%)`
        }}
      ></div>

      <div className="question-header2">
        <p><strong>Number:</strong> {question.number}</p>
        <p><strong>Kategoria:</strong> {question.kategoria}</p>
        <p><strong>Zestaw:</strong> {question.zestaw}</p>
        <p>
          <strong>Rating:</strong> 
          <span 
            className="rating-value" 
            style={{ 
              backgroundColor: getRatingBackgroundColor(question.rating),
              borderRadius: '3px',
              padding: '2px 5px'
            }}
          >
            {question.rating}
          </span>
        </p>
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

      {showRatingPopup && (
        <div className="rating-popup">
          <button className="close-popup" onClick={handleCloseRatingPopup}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
          <p>How hard was it?</p>
          <div>
            {[1, 2, 3, 4, 5].map((num) => (
              <button
                key={num}
                className={`rating-${num}`}
                onClick={() => handleRating(num)}
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      )}

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

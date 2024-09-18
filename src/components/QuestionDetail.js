
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './QuestionDetail.css'; // Import the CSS file
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAnglesLeft, faAnglesRight, faArrowLeft, faTimes, faEdit } from '@fortawesome/free-solid-svg-icons';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Import the Quill CSS
import { useSwipeable } from 'react-swipeable';



const QuestionDetail = ({ questions, updateRating, sortBy, filterBy }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [showRatingPopup, setShowRatingPopup] = useState(false);
  const [rating, setRating] = useState(1);
  const [isEditVisible, setIsEditVisible] = useState(false);
  const [question, setQuestion] = useState(null);
  const [sortedAndFilteredQuestions, setSortedAndFilteredQuestions] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAIAnswerVisible, setIsAIAnswerVisible] = useState(false);
  const [aiAnswerContent, setAiAnswerContent] = useState('<p>AI answer content</p>');
  const [animationClass, setAnimationClass] = useState('');


  // Update sorted and filtered questions
  useEffect(() => {
    let updatedQuestions = [...questions];

    if (filterBy) {
      updatedQuestions = updatedQuestions.filter(q => q.kategoria === filterBy);
    }

    if (sortBy) {
      updatedQuestions.sort((a, b) => {
        if (sortBy === 'number') {
          return (parseInt(a.number, 10) || 0) - (parseInt(b.number, 10) || 0);
        }

        if (sortBy === 'zestaw') {
          const parseZestaw = zestaw => {
            const match = zestaw.match(/([A-Z_]+)(\d*)/);
            return match ? { text: match[1], number: parseInt(match[2], 10) || 0 } : { text: '', number: 0 };
          };

          const zestawA = parseZestaw(a.zestaw);
          const zestawB = parseZestaw(b.zestaw);

          return zestawA.text !== zestawB.text
            ? zestawA.text.localeCompare(zestawB.text)
            : zestawA.number - zestawB.number;
        }

        if (sortBy === 'rating') {
          const ratingA = parseInt(a.rating, 10) || 0;
          const ratingB = parseInt(b.rating, 10) || 0;
          return ratingB - ratingA;
        }

        return (a[sortBy] || '').localeCompare(b[sortBy] || '');
      });
    }

    setSortedAndFilteredQuestions(updatedQuestions);

    const foundQuestion = updatedQuestions.find(q => q.id === id);
    setQuestion(foundQuestion);
    setIsAnswerRevealed(false);
    setRating(foundQuestion && !isNaN(parseInt(foundQuestion.rating, 10)) ? parseInt(foundQuestion.rating, 10) : '');
  }, [id, questions, sortBy, filterBy]);


  // Adjust swipe sensitivity
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => handleSwipe(1),
    onSwipedRight: () => handleSwipe(-1),
    swipeDuration: 500,  // Increase this value to allow longer swipe durations
    delta: 50,  // Increase this value to require a larger swipe distance
  });

  const handleSwipe = (offset) => {
    const currentIndex = sortedAndFilteredQuestions.findIndex(q => q.id === question.id);
    const nextQuestion = sortedAndFilteredQuestions[currentIndex + offset];
    if (nextQuestion) {
      setAnimationClass(offset > 0 ? 'slide-left' : 'slide-right');
      setTimeout(() => {
        navigate(`/UB2024-APP/question/${nextQuestion.id}`);
        setAnimationClass('');
      }, 500);  // Match this duration with the animation time
    }
  };

  if (!question) return <p>Question not found.</p>;

  const handleRevealAnswer = () => setIsAnswerRevealed(true);
  const handleHideAnswer = () => setIsAnswerRevealed(false);

  const handleRate = () => setShowRatingPopup(true);
  const handleRating = (value) => {
    setRating(value);
    updateRating(question.id, value);
    setShowRatingPopup(false);
  };

  const handleCloseRatingPopup = () => setShowRatingPopup(false);

  const navigateQuestion = (offset) => {
    const currentIndex = sortedAndFilteredQuestions.findIndex(q => q.id === question.id);
    const nextQuestion = sortedAndFilteredQuestions[currentIndex + offset];
    if (nextQuestion) {
      setCurrentSlide(currentSlide + offset);
      setTimeout(() => navigate(`/UB2024-APP/question/${nextQuestion.id}`), 300);
    }
  };

  const handlePrevious = () => navigateQuestion(-1);
  const handleNext = () => navigateQuestion(1);

  const getBackgroundClass = (kategoria) => ({
    'P': 'highlight-p',
    'L': 'highlight-l',
    'PŻ': 'highlight-pz',
    'I': 'highlight-i'
  }[kategoria] || '');

  const getRatingBackgroundColor = (rating) => {
    const colors = ['green', 'lightgreen', 'yellowgreen', 'orange', 'red'];
    return colors[rating - 1] || 'transparent';
  };

  const handleEditClick = () => {
    setIsEditVisible(prev => !prev);
    navigate(`/UB2024-APP/edit/${question.id}`);
  };

  const handleAiAnswerChange = (content) => setAiAnswerContent(content);
  const handleRevealAIAnswer = () => setIsAIAnswerVisible(true);
  const handleHideAIAnswer = () => setIsAIAnswerVisible(false);



  return (
    <div className="question-detail-background">
        <button className="back-button" onClick={() => navigate('/UB2024-APP/questions')}>
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <FontAwesomeIcon icon={faEdit} className="edit-icon" onClick={handleEditClick} />
        <strong className="question-index">
          {sortedAndFilteredQuestions.findIndex(q => q.id === question.id) + 1} / {sortedAndFilteredQuestions.length}
        </strong>
        <i className="fas fa-star rate-icon" onClick={handleRate}></i>

        <FontAwesomeIcon icon={faAnglesLeft} className="prev-arrow" onClick={handlePrevious} />
        <FontAwesomeIcon icon={faAnglesRight} className="next-arrow" onClick={handleNext} />

        {!isAIAnswerVisible && (
            <button className="ai-answer-button" onClick={handleRevealAIAnswer}>
              AI
            </button>
          )}
          {isAIAnswerVisible && (
            <button className="hide-button-ai" onClick={handleHideAIAnswer}>
              Hide AI
            </button>
          )}
          {isAnswerRevealed && (
            <button className="hide-button" onClick={handleHideAnswer}>
              Hide Answer
            </button>
          )}
          <button onClick={handleRevealAnswer} className={`reveal-button ${isAnswerRevealed ? 'hidden' : ''}`}>
            Reveal Answer
          </button>


      <div {...swipeHandlers} className={`question-detail ${getBackgroundClass(question.kategoria)} ${animationClass}`}>
        
        <div className="question-header2">
          <p><strong>Number:</strong> {question.number}</p>
          <p><strong>Kategoria:</strong> {question.kategoria}</p>
          <p><strong>Zestaw:</strong> {question.zestaw}</p>
          <p>
            <strong>Rating:</strong>
            <span className="rating-value" style={{ backgroundColor: getRatingBackgroundColor(rating) }}>
              {rating}
            </span>
          </p>
        </div>

        <h2>{question.question}</h2>

        <div className="question-content">


          <div className={`answer-container ${isAnswerRevealed ? 'revealed' : ''}`}>
            <div dangerouslySetInnerHTML={{ __html: question.answer }} />
          </div>


          <div className={`ai-answer-container ${isAIAnswerVisible ? 'revealed' : ''}`}>
            <ReactQuill 
              className="ai-answer-editor"
              theme="snow"
              value={aiAnswerContent}
              onChange={handleAiAnswerChange}
            />
          </div>


        </div>

        {showRatingPopup && (
          <div className="rating-popup">
            <button className="close-popup" onClick={handleCloseRatingPopup}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
            <p>How hard was it?</p>
            <div>
              {[1, 2, 3, 4, 5].map(num => (
                <button key={num} className={`rating-${num}`} onClick={() => handleRating(num)}>
                  {num}
                </button>
              ))}
            </div>
          </div>
        )}


      </div>
    </div>
  );
};

export default QuestionDetail;
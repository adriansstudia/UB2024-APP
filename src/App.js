import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import MainTab from './components/MainTab';
import QuestionsList from './components/QuestionsList';
import QuestionDetail from './components/QuestionDetail';
import EditQuestion from './components/EditQuestion';
import './App.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

// Key for saving to localStorage
const LOCAL_STORAGE_KEY = 'UB2024_QuestionsData';

function App() {
  const [questions, setQuestions] = useState([]);
  const [sortBy, setSortBy] = useState('');
  const [filterBy, setFilterBy] = useState('');

  // Load data from localStorage on first render
  useEffect(() => {
    const storedQuestions = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedQuestions) {
      setQuestions(JSON.parse(storedQuestions));
    }
  }, []);

  // Save questions data to localStorage whenever the state changes
  useEffect(() => {
    if (questions.length > 0) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(questions));
    }
  }, [questions]);

  const addQuestions = (newQuestions) => {
    setQuestions([...questions, ...newQuestions]);
  };

  const deleteQuestion = (id) => {
    setQuestions(questions.filter((question) => question.id !== id));
  };

  const updateQuestion = (id, updatedQuestion) => {
    setQuestions(questions.map((question) => (question.id === id ? updatedQuestion : question)));
  };

  const updateRating = (id, rating) => {
    setQuestions(questions.map((question) => (question.id === id ? { ...question, rating } : question)));
  };

  const handleSort = (property) => {
    setSortBy(property);
  };

  const handleFilter = (value) => {
    setFilterBy(value);
  };

  const getFilteredAndSortedQuestions = () => {
    let filteredQuestions = questions;

    // Apply filtering
    if (filterBy) {
      filteredQuestions = filteredQuestions.filter((q) => q.kategoria === filterBy);
    }

    // Apply sorting
    if (sortBy) {
      filteredQuestions = [...filteredQuestions].sort((a, b) => {
        if (a[sortBy] === undefined || b[sortBy] === undefined) return 0; // Handle undefined values
        if (typeof a[sortBy] === 'string') {
          return a[sortBy].localeCompare(b[sortBy]);
        }
        return a[sortBy] - b[sortBy]; // For numeric values
      });
    }

    return filteredQuestions;
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Redirect from root path to /UB2024-APP/ */}
          <Route path="/" element={<Navigate to="/UB2024-APP/" replace />} />

          {/* MainTab component with /UB2024-APP/ path */}
          <Route path="/UB2024-APP/" element={<MainTab />} />

          <Route
            path="/questions"
            element={
              <QuestionsList
                questions={questions}
                deleteQuestion={deleteQuestion}
                addQuestions={addQuestions}
                sortBy={sortBy}
                setSortBy={setSortBy}
                filterBy={filterBy}
                setFilterBy={setFilterBy}
              />
            }
          />
          <Route
            path="/question/:id"
            element={
              <QuestionDetail
                questions={questions}
                updateRating={updateRating}
                sortBy={sortBy}
                filterBy={filterBy}
              />
            }
          />
          <Route
            path="/edit/:id"
            element={<EditQuestion questions={questions} saveQuestion={updateQuestion} />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

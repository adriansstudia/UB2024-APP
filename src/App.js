// App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import MainTab from './components/MainTab';
import QuestionsList from './components/QuestionsList';
import QuestionDetail from './components/QuestionDetail';
import EditQuestion from './components/EditQuestion';
import './App.css';
import '@fortawesome/fontawesome-free/css/all.min.css';


function App() {
  const [questions, setQuestions] = useState([]);
  const [sortBy, setSortBy] = useState('');
  const [filterBy, setFilterBy] = useState('');

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
          <Route path="/" element={<MainTab />} />
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

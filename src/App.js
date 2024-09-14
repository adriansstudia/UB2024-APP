import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import MainTab from './components/MainTab';
import QuestionsList from './components/QuestionsList';
import QuestionDetail from './components/QuestionDetail';
import EditQuestion from './components/EditQuestion';
import './App.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import Papa from 'papaparse';

// Replace with your API URL
const API_URL = 'https://your-api-endpoint.example.com/questions';

function App() {
  const [questions, setQuestions] = useState([]);
  const [sortBy, setSortBy] = useState('');
  const [filterBy, setFilterBy] = useState('');

  // Load data from API on first render
  useEffect(() => {
    fetch(API_URL)
      .then(response => response.json())
      .then(data => {
        setQuestions(data.questions || []);
        setSortBy(data.sortBy || '');
        setFilterBy(data.filterBy || '');
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });
  }, []);

  // Save questions data to API whenever the state changes
  useEffect(() => {
    if (questions.length > 0) {
      const dataToSave = {
        questions,
        sortBy,
        filterBy,
      };
      fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSave),
      })
      .then(response => response.json())
      .then(data => {
        console.log('Data saved:', data);
      })
      .catch(error => {
        console.error('Error saving data:', error);
      });
    }
  }, [questions, sortBy, filterBy]);

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

  const saveToCSV = () => {
    const csv = Papa.unparse(questions, {
      header: true,
      columns: ["number", "question", "kategoria", "zestaw", "rating", "answer"]
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'questions_data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const loadFromCSV = (event) => {
    const file = event.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        complete: (result) => {
          const newQuestions = result.data.map((row) => ({
            id: row.number, // Ensure id is unique or handled appropriately
            number: row.number,
            question: row.question,
            kategoria: row.kategoria,
            zestaw: row.zestaw,
            rating: row.rating,
            answer: row.answer
          }));
          setQuestions(newQuestions);
          // Optionally save to API
          fetch(API_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ questions: newQuestions }),
          })
          .then(response => response.json())
          .then(data => {
            console.log('Data saved:', data);
          })
          .catch(error => {
            console.error('Error saving data:', error);
          });
        },
        error: (error) => {
          console.error('Error reading CSV file:', error);
        }
      });
    }
  };

  const clearAllQuestions = () => {
    setQuestions([]); // Clear the questions array
    // Optionally clear data from API
    fetch(API_URL, {
      method: 'DELETE',
    })
    .then(response => response.json())
    .then(data => {
      console.log('Data cleared:', data);
    })
    .catch(error => {
      console.error('Error clearing data:', error);
    });
  };
  
  return (
    <Router>
      <div className="App">
        <input
          type="file"
          id="load-state-input"
          accept=".csv"
          onChange={loadFromCSV}
          style={{ display: 'none' }}
        />
        <Routes>
          <Route path="/" element={<Navigate to="/UB2024-APP/" replace />} />
          <Route path="/UB2024-APP/" element={<MainTab />} />
          <Route
            path="/UB2024-APP/questions"
            element={
              <QuestionsList
                questions={questions}
                deleteQuestion={deleteQuestion}
                addQuestions={addQuestions}
                clearAllQuestions={clearAllQuestions} // Pass clearAllQuestions function
                sortBy={sortBy}
                setSortBy={setSortBy}
                filterBy={filterBy}
                setFilterBy={setFilterBy}
              />
            }
          />
          <Route
            path="/UB2024-APP/question/:id"
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
            path="/UB2024-APP/edit/:id"
            element={<EditQuestion questions={questions} saveQuestion={updateQuestion} />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

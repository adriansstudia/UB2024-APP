import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import { v4 as uuidv4 } from 'uuid'; // For unique IDs

const QuestionsList = ({
  questions,
  deleteQuestion,
  addQuestions,
  sortBy,
  setSortBy,
  filterBy,
  setFilterBy
}) => {
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [kategoriaOptions, setKategoriaOptions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const kategoriaSet = new Set(questions.map((q) => q.kategoria));
    setKategoriaOptions([...kategoriaSet]);
  }, [questions]);

  useEffect(() => {
    const applyFilterAndSort = () => {
      let updatedQuestions = questions;

      // Apply filtering
      if (filterBy) {
        updatedQuestions = updatedQuestions.filter((q) => q.kategoria === filterBy);
      }

      // Apply sorting
      if (sortBy) {
        updatedQuestions = [...updatedQuestions].sort((a, b) => {
          if (a[sortBy] === undefined || b[sortBy] === undefined) return 0; // Handle undefined values
          if (typeof a[sortBy] === 'string') {
            return a[sortBy].localeCompare(b[sortBy]);
          }
          return a[sortBy] - b[sortBy]; // For numeric values
        });
      }

      setFilteredQuestions(updatedQuestions);
    };

    applyFilterAndSort();
  }, [questions, filterBy, sortBy]);

  const handleSort = (property) => {
    setSortBy(property);
  };

  const handleFilter = (value) => {
    setFilterBy(value);
  };

  const handleDelete = (id) => {
    deleteQuestion(id);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    Papa.parse(file, {
      header: true, // Ensure headers are used
      skipEmptyLines: true,
      complete: (result) => {
        const importedQuestions = result.data.map((row) => ({
          id: uuidv4(), // Use UUID for unique IDs
          number: row['Number'] || '',
          question: row['Question'] || '',
          kategoria: row['Kategoria'] || '',
          zestaw: row['Zestaw'] || '',
          rating: row['Rating'] || '0',
          answer: row['Answer'] || '',
        }));
        addQuestions(importedQuestions);
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
      },
    });
  };

  return (
    <div className="questions-list">
      <button onClick={() => navigate('/')}>Back</button>
      <input type="file" accept=".csv" onChange={handleImport} />
      <div>
        <button onClick={() => handleSort('number')}>Sort by Number</button>
        <button onClick={() => handleSort('kategoria')}>Sort by Kategoria</button>
        <button onClick={() => handleSort('zestaw')}>Sort by Zestaw</button>
        <button onClick={() => handleSort('rating')}>Sort by Rating</button>
      </div>
      <div>
        <select onChange={(e) => handleFilter(e.target.value)} value={filterBy}>
          <option value="">Filter by Kategoria</option>
          {kategoriaOptions.map((kategoria) => (
            <option key={kategoria} value={kategoria}>
              {kategoria}
            </option>
          ))}
        </select>
        <button onClick={() => handleFilter('')}>Show All</button>
      </div>
      <ul>
        {filteredQuestions.map((question) => (
          <li key={question.id}>
            <p>
              {question.question} (Number: {question.number}, Kategoria: {question.kategoria}, Zestaw: {question.zestaw}, Rating: {question.rating})
            </p>
            <button onClick={() => navigate(`/UB2024-APP/question/${question.id}`)}>View</button>
            <button onClick={() => navigate(`/UB2024-APP/edit/${question.id}`)}>Edit</button>
            <button onClick={() => handleDelete(question.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default QuestionsList;

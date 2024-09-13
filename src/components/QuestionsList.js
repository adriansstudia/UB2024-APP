
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import { v4 as uuidv4 } from 'uuid'; // For unique IDs
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faEllipsisV, faEdit, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import './QuestionsList.css'; // Import your custom styles

const QuestionsList = ({
  questions,
  deleteQuestion,
  addQuestions,
  clearAllQuestions, // Add this prop
  sortBy,
  setSortBy,
  filterBy,
  setFilterBy
}) => {
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [kategoriaOptions, setKategoriaOptions] = useState([]);
  const [showMenu, setShowMenu] = useState(false);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [questionsToDelete, setQuestionsToDelete] = useState(0); // Store count of questions
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

  const handleDelete = (id, e) => {
    e.stopPropagation(); // Prevent event from bubbling up
    deleteQuestion(id);
  };

  const handleEdit = (id, e) => {
    e.stopPropagation(); // Prevent event from bubbling up
    navigate(`/UB2024-APP/edit/${id}`);
  };

  const handleImport = (e) => {
    const fileInput = e.target;
    const file = fileInput.files[0];
    
    Papa.parse(file, {
      header: true, // Ensure headers are used
      skipEmptyLines: true,
      complete: (result) => {
        console.log('Parsed data:', result.data); // Log the parsed data
        const importedQuestions = result.data.map((row) => ({
          id: uuidv4(), // Use UUID for unique IDs
          number: row['number'] || '',
          question: row['question'] || '',
          kategoria: row['kategoria'] || '',
          zestaw: row['zestaw'] || '',
          rating: row['rating'] || '',
          answer: row['answer'] || '',
        }));
        console.log('Imported questions:', importedQuestions); // Log the imported questions
        addQuestions(importedQuestions);
        
        // Reset the file input field
        fileInput.value = null;
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
      },
    });
  };
  

  useEffect(() => {
    // Load the default CSV file when the component mounts
    fetch('https://raw.githubusercontent.com/adriansstudia/UB2024-APP/main/output.csv')
      .then(response => response.blob())
      .then(blob => handleImport(blob))
      .catch(error => console.error('Error loading default CSV file:', error));
  }, []);

  const handleSaveState = () => {
    console.log('Save State clicked');
  };

  const handleLoadState = (e) => {
    console.log('Load State clicked');
  };

  const handleClearAll = () => {
    setQuestionsToDelete(filteredQuestions.length); // Set total questions to delete
    setShowConfirmPopup(true); // Show confirmation popup
  };

  const confirmClearAll = (confirm) => {
    if (confirm) {
      clearAllQuestions(); // Call the function to clear all questions
    }
    setShowConfirmPopup(false); // Hide confirmation popup
  };

  const saveToCSV = () => {
    // Generate current date and time
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    // Format the filename
    const filename = `UB2024_${year}_${month}_${day}_${hours}_${minutes}.csv`;
  
    // Convert questions data to CSV format
    const csv = Papa.unparse(questions, {
      header: true,
      delimiter: ";",
      columns: ["number", "question", "kategoria", "zestaw", "rating", "answer"]
    });
    
    // Create a blob and download the CSV file
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // New function to handle redirection on click
  const handleQuestionClick = (id) => {
    navigate(`/UB2024-APP/question/${id}`);
  };

  return (
    <div className="questions-list">
      <div className="header">
        <button onClick={() => navigate('/UB2024-APP/')}>
          <FontAwesomeIcon icon={faArrowLeft} className='back-button'/>
        </button>
        <div className="menu-container">
          <FontAwesomeIcon
            icon={faEllipsisV}
            className="menu-icon"
            onClick={() => setShowMenu(!showMenu)}
          />
          {showMenu && (
            <div className="menu">
              <button onClick={saveToCSV} className="menu-button">Save State</button>
              <button onClick={() => document.getElementById('load-state-input').click()} className="menu-button">Load State</button>
              <input
                type="file"
                id="load-state-input"
                accept=".csv"
                onChange={handleImport}
                style={{ display: 'none' }}
              />
            </div>
          )}
        </div>
      </div>
      <div className="filters">
        <button onClick={() => document.getElementById('import-file').click()} className="import-button">Add CSV</button>
        <input
          type="file"
          id="import-file"
          accept=".csv"
          onChange={handleImport}
          style={{ display: 'none' }}
        />
        <button onClick={handleClearAll} className="clear-button">Clear All</button>
        <button onClick={() => navigate('/UB2024-APP/add')} className="add-button">Add</button>
        <button onClick={() => handleSort('number')} className="filter-button">Sort by: Number</button>
        <button onClick={() => handleSort('kategoria')} className="filter-button">Kategoria</button>
        <button onClick={() => handleSort('zestaw')} className="filter-button">Zestaw</button>
        <button onClick={() => handleSort('rating')} className="filter-button">Rating</button>
      </div>
      <div className="filter-options">
        <select onChange={(e) => handleFilter(e.target.value)} value={filterBy}>
          <option value="">Show all</option>
          {kategoriaOptions.map((kategoria) => (
            <option key={kategoria} value={kategoria}>
              {kategoria}
            </option>
          ))}
        </select>
      </div>
      <div className="question-container">
        <div className="question-header">
          <div className="column">lp</div>
          <div className="column">Nr</div>
          <div className="column">Pytanie</div>
          <div className="column">Kat.</div>
          <div className="column">Zest.</div>
          <div className="column">Rat.</div>

        </div>
        <div className="question-info">
          <p>Total Questions: {filteredQuestions.length}</p>
        </div>
        <ul>
          {filteredQuestions.map((question, index) => (
            <li
              key={question.id}
              className="question-row"
              onClick={() => handleQuestionClick(question.id)}
            >
              <div className="column">{index + 1}</div>
              <div className="column">{question.number}</div>
              <div className="column">{question.question}</div>
              <div className="column">{question.kategoria}</div>
              <div className="column">{question.zestaw}</div>
              <div className="column">{question.rating}</div>
              <div className="actions">
                <button className="action-button edit-button" onClick={(e) => handleEdit(question.id, e)}>
                  <FontAwesomeIcon icon={faEdit} />
                </button>
                <button className="action-button delete-button" onClick={(e) => handleDelete(question.id, e)}>
                  <FontAwesomeIcon icon={faTrashAlt} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      {showConfirmPopup && (
        <div className="confirm-popup">
          <div className="confirm-popup-content">
            <p>Do you want to remove all {questionsToDelete} questions?</p>
            <button onClick={() => confirmClearAll(true)} className="confirm-button">Yes</button>
            <button onClick={() => confirmClearAll(false)} className="confirm-button">No</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionsList;

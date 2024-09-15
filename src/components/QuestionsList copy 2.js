import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import { v4 as uuidv4 } from 'uuid';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faEllipsisV, faEdit, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import './QuestionsList.css'; // Import your custom styles


const QuestionsList = ({
  questions,
  deleteQuestion,
  addQuestions,
  clearAllQuestions,
  sortBy,
  setSortBy,
  filterBy,
  setFilterBy
}) => {
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [kategoriaOptions, setKategoriaOptions] = useState([]);
  const [showMenu, setShowMenu] = useState(false);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [questionsToDelete, setQuestionsToDelete] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const kategoriaSet = new Set(questions.map(q => q.kategoria));
    setKategoriaOptions([...kategoriaSet]);
  }, [questions]);

  useEffect(() => {
    const applyFilterAndSort = () => {
      let updatedQuestions = [...questions];
  
      if (filterBy) {
        updatedQuestions = updatedQuestions.filter(q => q.kategoria === filterBy);
      }
  
      if (sortBy) {
        updatedQuestions.sort((a, b) => {
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
  
      setFilteredQuestions(updatedQuestions);
    };
  
    applyFilterAndSort();
  }, [questions, filterBy, sortBy]);
  

  const handleSort = (property) => setSortBy(property);
  const handleFilter = (value) => setFilterBy(value);
  const handleDelete = (id, e) => {
    e.stopPropagation();
    deleteQuestion(id);
  };
  const handleEdit = (id, e) => {
    e.stopPropagation();
    navigate(`/UB2024-APP/edit/${id}`);
  };

  const handleImport = (file) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const importedQuestions = result.data.map(row => ({
          id: uuidv4(),
          number: row['number'] || '',
          question: row['question'] || '',
          kategoria: row['kategoria'] || '',
          zestaw: row['zestaw'] || '',
          rating: row['rating'] || '',
          answer: row['answer'] || '',
        }));
        addQuestions(importedQuestions);
      },
      error: (error) => console.error('Error parsing CSV:', error),
    });
  };

  const handleImportFromText = (csvText) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const importedQuestions = result.data.map(row => ({
          id: uuidv4(),
          number: row['number'] || '',
          question: row['question'] || '',
          kategoria: row['kategoria'] || '',
          zestaw: row['zestaw'] || '',
          rating: row['rating'] || '',
          answer: row['answer'] || '',
        }));
        addQuestions(importedQuestions);
      },
      error: (error) => console.error('Error parsing CSV:', error),
    });
  };

  const handleLoadDefaultCSV = () => {
    fetch('https://raw.githubusercontent.com/adriansstudia/UB2024-APP/main/output.csv')
      .then(response => response.text())
      .then(handleImportFromText)
      .catch(error => console.error('Error loading default CSV:', error));
  };

  const handleSaveState = () => console.log('Save State clicked');
  const handleLoadState = (e) => console.log('Load State clicked');

  const handleClearAll = () => {
    setQuestionsToDelete(filteredQuestions.length);
    setShowConfirmPopup(true);
  };

  const confirmClearAll = (confirm) => {
    if (confirm) clearAllQuestions();
    setShowConfirmPopup(false);
  };

  const saveToCSV = () => {
    const now = new Date();
    const filename = `UB2024_${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}_${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}_${String(now.getMinutes()).padStart(2, '0')}.csv`;

    const csv = Papa.unparse(questions, {
      header: true,
      delimiter: ";",
      columns: ["number", "question", "kategoria", "zestaw", "rating", "answer"]
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  const handleQuestionClick = (id) => navigate(`/UB2024-APP/question/${id}`);

  function getRatingClass(rating) {
    switch (parseInt(rating, 10)) { // Ensure rating is an integer
      case 1: return 'rating-1';
      case 2: return 'rating-2';
      case 3: return 'rating-3';
      case 4: return 'rating-4';
      case 5: return 'rating-5';
      default: return '';
    }
  }

  return (
    <div className="questions-list">
      <header className="header">
        <button onClick={() => navigate('/UB2024-APP/')}>
          <FontAwesomeIcon icon={faArrowLeft} className='back-button' />
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
                onChange={(e) => handleImport(e.target.files[0])}
                style={{ display: 'none' }}
              />
            </div>
          )}
        </div>
      </header>
      <div className="filters">
        <button onClick={() => document.getElementById('import-file').click()} className="import-button">Add CSV</button>
        <input
          type="file"
          id="import-file"
          accept=".csv"
          onChange={(e) => handleImport(e.target.files[0])}
          style={{ display: 'none' }}
        />
        <button onClick={handleLoadDefaultCSV} className="load-default-button">Load Default</button>
        <button onClick={handleClearAll} className="clear-button">Clear All</button>
        <button onClick={() => navigate('/UB2024-APP/add')} className="add-button">Add</button>
        <button onClick={saveToCSV} className="load-default-button">Save State</button>
        <div className="sort-buttons">
          {['number', 'kategoria', 'zestaw', 'rating'].map(property => (
            <button key={property} onClick={() => handleSort(property)} className="filter-button">
              Sort by: {property.charAt(0).toUpperCase() + property.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className="filter-options">
        <select onChange={(e) => handleFilter(e.target.value)} value={filterBy}>
          <option value="">Show all</option>
          {kategoriaOptions.map(kategoria => (
            <option key={kategoria} value={kategoria}>{kategoria}</option>
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
              className={`question-row ${{
                'P': 'highlight-p',
                'L': 'highlight-l',
                'PŻ': 'highlight-pz',
                'I': 'highlight-i'
              }[question.kategoria] || ''}`}
              onClick={() => handleQuestionClick(question.id)}
            >
              <div className="column">{index + 1}</div>
              <div className="column">{question.number}</div>
              <div className="column">{question.question}</div>
              <div className="column">{question.kategoria}</div>
              <div className="column">{question.zestaw}</div>
              <div className={getRatingClass(question.rating)}>{question.rating}</div>
              <div className="actions">
                <button onClick={(e) => handleEdit(question.id, e)} className="action-button">
                  <FontAwesomeIcon icon={faEdit} />
                </button>
                <button onClick={(e) => handleDelete(question.id, e)} className="action-button">
                  <FontAwesomeIcon icon={faTrashAlt} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      {showConfirmPopup && (
        <div className="confirm-popup">
          <p>Do you want to remove all the questions?</p>
          <button onClick={() => confirmClearAll(true)}>Yes</button>
          <button onClick={() => confirmClearAll(false)}>No</button>
        </div>
      )}
    </div>
  );
};

export default QuestionsList;

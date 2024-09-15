import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import { v4 as uuidv4 } from 'uuid';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faEllipsisV, faEdit, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import './QuestionsList.css'; // Import your custom styles


const CLIENT_ID = process.env.REACT_APP_CLIENT_ID;
const API_KEY = process.env.REACT_APP_API_KEY;
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];
const SCOPES = 'https://www.googleapis.com/auth/drive';

const QuestionsList = ({
  questions,
  setQuestions,
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
  const [gapiInited, setGapiInited] = useState(false);
  const [gisInited, setGisInited] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [autosaveFileId, setAutosaveFileId] = useState(null); // State to store the autosave file ID
  const navigate = useNavigate();


  useEffect(() => {
    const loadGoogleAPI = () => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        window.gapi.load('client:auth2', initializeGapiClient);
        window.gapi.load('auth2', initializeGisClient);
      };
      document.body.appendChild(script);
    };
    loadGoogleAPI();
  }, []);

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
    autosave();
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


  const initializeGapiClient = () => {
    window.gapi.client.init({
      apiKey: API_KEY,
      discoveryDocs: DISCOVERY_DOCS,
    }).then(() => {
      setGapiInited(true);
      maybeEnableButtons();
    });
  };

  const initializeGisClient = () => {
    window.tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (resp) => {
        if (resp.error) {
          throw resp;
        }
        setSignedIn(true);
        checkFolder();
      },
    });
    setGisInited(true);
    maybeEnableButtons();
  };

  const maybeEnableButtons = () => {
    if (gapiInited && gisInited) {
      // Enable buttons or other UI elements here
    }
  };

  const handleAuthClick = () => {
    if (window.gapi.client.getToken() === null) {
      window.tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      window.tokenClient.requestAccessToken({ prompt: '' });
    }
  };

  const handleSignoutClick = () => {
    const token = window.gapi.client.getToken();
    if (token !== null) {
      window.google.accounts.oauth2.revoke(token.access_token);
      window.gapi.client.setToken('');
      setSignedIn(false);
    }
  };

  const checkFolder = () => {
    window.gapi.client.drive.files.list({
      'q': 'name = "UB2024-APP"',
    }).then((response) => {
      const files = response.result.files;
      if (files.length > 0) {
        localStorage.setItem('parent_folder', files[0].id);
      } else {
        createFolder();
      }
    });
  };

  const createFolder = () => {
    const accessToken = window.gapi.client.getToken().access_token;
    window.gapi.client.request({
      path: 'drive/v2/files',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: {
        title: 'UB2024-APP',
        mimeType: 'application/vnd.google-apps.folder',
      },
    }).then((response) => {
      localStorage.setItem('parent_folder', response.result.id);
    });
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

    /*const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);*/

    if (signedIn) {
      uploadCSVToDrive(blob, filename);
    }
  };

  const getFolderId = async (folderName) => {
    try {
      const response = await window.gapi.client.drive.files.list({
        'q': `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder'`,
      });
      const folders = response.result.files;
      if (folders.length > 0) {
        return folders[0].id; // Return the ID of the existing folder
      } else {
        // Create the folder if it does not exist
        const createResponse = await window.gapi.client.drive.files.create({
          resource: {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
          },
          fields: 'id',
        });
        return createResponse.result.id;
      }
    } catch (error) {
      console.error('Error getting or creating folder:', error);
    }
  };
  
  const getFileIdByName = async (folderId, fileName) => {
    try {
      const response = await window.gapi.client.drive.files.list({
        'q': `'${folderId}' in parents and name = '${fileName}'`,
      });
      const files = response.result.files;
      if (files.length > 0) {
        return files[0].id; // Return the ID of the file
      }
      return null; // File not found
    } catch (error) {
      console.error('Error getting file ID by name:', error);
    }
  };
  

  const uploadCSVToDrive = (blob, fileName, folderId) => {
    const metadata = {
      name: fileName,
      mimeType: 'text/csv',
      parents: [folderId],
    };
    const formData = new FormData();
    formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    formData.append('file', blob);
  
    fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: new Headers({ 'Authorization': `Bearer ${window.gapi.client.getToken().access_token}` }),
      body: formData,
    })
      .then(response => response.json())
      .then(value => {
        if (fileName === 'UB2024-APP_autosave.csv') {
          setAutosaveFileId(value.id); // Save the autosave file ID
        }
      })
      .catch(error => console.error('Error uploading file:', error));
  };
  

  const autosave = () => {
    const filename = 'UB2024-APP_autosave.csv';

    const csv = Papa.unparse(questions, {
      header: true,
      delimiter: ";",
      columns: ["number", "question", "kategoria", "zestaw", "rating", "answer"]
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

    if (signedIn) {
      replaceFileInDrive(blob, filename);
    }
  };

  const replaceFileInDrive = async (blob, fileName) => {
    try {
      const folderId = await getFolderId('UB2024-APP'); // Replace with your folder name
      const fileId = await getFileIdByName(folderId, fileName);
  
      if (fileId) {
        // Delete the existing file
        await window.gapi.client.drive.files.delete({ fileId });
      }
  
      // Upload the new file
      uploadCSVToDrive(blob, fileName, folderId);
    } catch (error) {
      console.error('Error replacing file in Drive:', error);
    }
  };
  

  const loadAutosaveAndReplace = async () => {
    try {
      // Step 1: Delete all existing questions
      clearAllQuestions();
  
      // Step 2: Get the folder ID and find the autosave file ID
      const folderId = await getFolderId('UB2024-APP'); // Replace with your folder name
      const fileId = await getFileIdByName(folderId, 'UB2024-APP_autosave.csv');
  
      if (!fileId) {
        console.error('Autosave file not found');
        return;
      }
  
      // Step 3: Load the autosave file
      const accessToken = window.gapi.client.getToken().access_token;
      const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
  
      if (!response.ok) {
        throw new Error('Failed to fetch autosave file');
      }
  
      const csvText = await response.text();
      handleImportFromText(csvText); // Import the data into your app
  
    } catch (error) {
      console.error('Error loading autosave file:', error);
    }
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

        <button onClick={handleAuthClick} style={{ display: signedIn ? 'none' : 'block' }}>Sign In</button>
        <button onClick={handleSignoutClick} style={{ display: signedIn ? 'block' : 'none' }}>Sign Out</button>
        <button onClick={saveToCSV}>Save State</button>
        <button onClick={autosave}>Autosave</button>
        <button onClick={loadAutosaveAndReplace}>Load Autosave</button>

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

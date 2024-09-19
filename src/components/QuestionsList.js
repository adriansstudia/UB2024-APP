
// src/components/QuestionsList.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import { v4 as uuidv4 } from 'uuid';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faEllipsisV, faEdit, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import './QuestionsList.css'; // Import your custom styles

const CLIENT_ID = process.env.REACT_APP_CLIENT_ID;
const API_KEY = process.env.REACT_APP_API_KEY;
const YOUR_CLIENT_SECRET = process.env.REACT_APP_YOUR_CLIENT_SECRET;
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];
const SCOPES = 'https://www.googleapis.com/auth/drive';

const BASE_FILENAME = 'UB2024-APP_autosave_'; // Base filename for autosaves

const QuestionsList = ({
  questions,
  deleteQuestion,
  addQuestions,
  addNextQuestions,
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
  const [gapiInited, setGapiInited] = useState(false);
  const [gisInited, setGisInited] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [currentAutosaveFilename, setCurrentAutosaveFilename] = useState('');
  const [autosaveEnabled, setAutosaveEnabled] = useState(false); // State for checkbox
  const [autosaveInterval, setAutosaveInterval] = useState(null); // State for autosave interval

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
          aiAnswer: row['ai-answer'], // New column for AI Answer
          law: row['law'] // New column for Law
        }));
        addNextQuestions(importedQuestions);
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
          aiAnswer: row['ai-answer'], // New column for AI Answer
          law: row['law'] // New column for Law
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
    clearAllQuestions()
  };


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

  const initializeGapiClient = () => {
    window.gapi.client.init({
      apiKey: API_KEY,
      discoveryDocs: DISCOVERY_DOCS,
    }).then(() => {
      const token = localStorage.getItem('authToken');
      if (token) {
        window.gapi.client.setToken({ access_token: token });
        setSignedIn(true);
      }
      setGapiInited(true);
      maybeEnableButtons();
    }).catch(error => console.error('Error initializing GAPI client:', error));
  };

  const initializeGisClient = () => {
    window.tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (resp) => {
        if (resp.error) throw resp;
        localStorage.setItem('authToken', resp.access_token);
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
    window.tokenClient.requestAccessToken({ prompt: window.gapi.client.getToken() === null ? 'consent' : '' });
  };

  const handleSignoutClick = () => {
    const token = window.gapi.client.getToken();
    if (token) {
      window.google.accounts.oauth2.revoke(token.access_token);
      localStorage.removeItem('authToken');
      window.gapi.client.setToken('');
      setSignedIn(false);
    }
  };

  const checkAuth = () => {
    if (window.gapi && window.gapi.client) {
      const token = localStorage.getItem('authToken');
      if (token) {
        window.gapi.client.setToken({ access_token: token });
        setSignedIn(true);
      }
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);
  
  const checkFolder = async () => {
    try {
      const response = await window.gapi.client.drive.files.list({ q: 'name = "UB2024-APP"' });
      const files = response.result.files;
      if (files.length > 0) {
        localStorage.setItem('parent_folder', files[0].id);
      } else {
        await createFolder();
      }
    } catch (error) {
      console.error('Error checking folder:', error);
    }
  };

  const createFolder = async () => {
    try {
      const accessToken = window.gapi.client.getToken().access_token;
      const response = await window.gapi.client.request({
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
      });
      localStorage.setItem('parent_folder', response.result.id);
    } catch (error) {
      console.error('Error creating folder:', error);
    }
  };

  const saveToCSV = () => {
    const now = new Date();
    const filename = `UB2024_${now.toISOString().slice(0, 10)}_${now.toTimeString().slice(0, 5).replace(":", "-")}.csv`;

    const csv = Papa.unparse(questions, {
      header: true,
      delimiter: ";",
      columns: ["number", "question", "kategoria", "zestaw", "rating", "answer", "ai-answer", "law"]
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    if (signedIn) uploadCSVToDrive(blob, filename);
  };

  const getFolderId = async (folderName) => {
    try {
      const response = await window.gapi.client.drive.files.list({
        'q': `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder'`,
      });
      const folders = response.result.files;
      if (folders.length > 0) return folders[0].id;

      const createResponse = await window.gapi.client.drive.files.create({
        resource: {
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
        },
        fields: 'id',
      });
      return createResponse.result.id;
    } catch (error) {
      console.error('Error getting or creating folder:', error);
    }
  };

  // Autosave function
  const autosave = () => {
    // Generate filename with date and time
    const now = new Date();
    // Get the UTC time, and add the 2-hour offset for UTC+2
    const timezoneOffsetInHours = 2;
    now.setHours(now.getHours() + timezoneOffsetInHours);

    // Format date as YYYY-MM-DD___HH-MM-SS
    const dateString = now.toISOString()
      .replace(/T/, '___') // Replace 'T' with '___' for your format
      .replace(/:/g, '-')   // Replace colons with dashes for hours, minutes, and seconds
      .replace(/\.\d+Z$/, ''); // Remove milliseconds and 'Z' from the end
    const filename = `${BASE_FILENAME}${dateString}.csv`;
        
    const csv = Papa.unparse(questions, {
      header: true,
      delimiter: ";",
      columns: ["number", "question", "kategoria", "zestaw", "rating", "answer", "ai-answer", "law"]
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

    // Upload the autosave file to Google Drive
    if (signedIn) {
      uploadCSVToDrive(blob, filename);
      setCurrentAutosaveFilename(filename); // Update the filename display
    }
  };

  // Function to start autosaving
  const startAutosave = () => {
    if (autosaveInterval) return; // Prevent multiple intervals
    const interval = setInterval(() => {
      if (autosaveEnabled) {
        autosave(questions, true); // Adjust as needed
      }
    }, 10000); // 10 seconds
    setAutosaveInterval(interval);
  };

  // Function to stop autosaving
  const stopAutosave = () => {
    if (autosaveInterval) {
      clearInterval(autosaveInterval);
      setAutosaveInterval(null);
    }
  };


  // Use effect to start or stop autosave based on checkbox
  useEffect(() => {
    if (autosaveEnabled) {
      startAutosave();
    } else {
      stopAutosave();
    }
    // Cleanup on component unmount
    return () => stopAutosave();
  }, [autosaveEnabled]);

  // Event handler for checkbox change
  const handleCheckboxChange = (event) => {
    setAutosaveEnabled(event.target.checked);
  };

  // Function to upload CSV to Google Drive
  const uploadCSVToDrive = async (blob, fileName) => {
    try {
      const folderId = await getFolderId('UB2024-APP');

      const fileMetadata = {
        name: fileName,
        mimeType: 'text/csv',
        parents: [folderId]
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(fileMetadata)], { type: 'application/json' }));
      form.append('file', blob);

      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: new Headers({ 'Authorization': `Bearer ${window.gapi.client.getToken().access_token}` }),
        body: form
      });

      if (!response.ok) throw new Error('Failed to upload autosave file');
    } catch (error) {
      console.error('Error uploading autosave to Drive:', error);
    }
    removeOldestFiles();
  };

  // Set up interval for autosaving every 10 seconds
  useEffect(() => {
    if (signedIn) {
      const intervalId = setInterval(() => {
       
      }, 10000); // 10000 milliseconds = 10 seconds

      // Cleanup on component unmount
      return () => clearInterval(intervalId);
    }
  }, [questions, signedIn]);


  const removeOldestFiles = async () => {
    try {
      // Get folder ID
      const folderId = await getFolderId('UB2024-APP');
  
      // List all files in the folder with filenames starting with 'UB2024-APP_autosave_'
      const response = await window.gapi.client.drive.files.list({
        q: `'${folderId}' in parents and name contains 'UB2024-APP_autosave_'`,
        fields: 'files(id, name)',
      });
  
      const files = response.result.files;
  
      if (files.length <= 5) {
        console.log('No need to delete files, less than or equal to 5 autosaves present');
        return;
      }
  
      // Sort files based on the timestamp in the filename
      const sortedFiles = files.sort((a, b) => {
        const matchA = a.name.match(/UB2024-APP_autosave_(\d{4}-\d{2}-\d{2}___\d{2}-\d{2}-\d{2})/);
        const matchB = b.name.match(/UB2024-APP_autosave_(\d{4}-\d{2}-\d{2}___\d{2}-\d{2}-\d{2})/);
  
        if (!matchA || !matchB) {
          console.error('Filename does not match expected pattern:', a.name, b.name);
          return 0;
        }
  
        const timeA = matchA[1];
        const timeB = matchB[1];
  
        return timeB.localeCompare(timeA); // Latest first
      });
  
      // Debugging: Log sorted files to check the order
      console.log('Sorted files (newest first):', sortedFiles);
  
      // Remove oldest files if more than 5 exist
      const filesToDelete = sortedFiles.slice(5); // Get files older than the 5 newest
  
      // Debugging: Log files to be deleted
      console.log('Files to delete:', filesToDelete);
  
      for (const file of filesToDelete) {
        await window.gapi.client.drive.files.delete({
          fileId: file.id,
        });
        console.log(`Deleted file: ${file.name}`);
      }
  
    } catch (error) {
      console.error('Error removing oldest autosave files:', error);
    }
  };

  const loadAutosaveAndReplace = async () => {
    try {
      clearAllQuestions();
  
      // Get folder ID
      const folderId = await getFolderId('UB2024-APP');
  
      // List files in the folder with filenames starting with 'UB2024-APP_autosave_'
      const response = await window.gapi.client.drive.files.list({
        q: `'${folderId}' in parents and name contains 'UB2024-APP_autosave_'`,
        fields: 'files(id, name)',
      });
  
      const files = response.result.files;
  
      if (files.length === 0) {
        console.error('No autosave files found');
        return;
      }
  
      // Debugging: Log the files retrieved from Drive
      console.log('Files retrieved from Drive:', files);
  
      // Sort files based on the timestamp in the filename (extract timestamp from the filename)
      const sortedFiles = files.sort((a, b) => {
        const matchA = a.name.match(/UB2024-APP_autosave_(\d{4}-\d{2}-\d{2}___\d{2}-\d{2}-\d{2})/);
        const matchB = b.name.match(/UB2024-APP_autosave_(\d{4}-\d{2}-\d{2}___\d{2}-\d{2}-\d{2})/);
  
        // Check if matches are valid
        if (!matchA || !matchB) {
          console.error('Filename does not match expected pattern:', a.name, b.name);
          return 0; // Don't sort if names don't match the pattern
        }
  
        const timeA = matchA[1];
        const timeB = matchB[1];
  
        // Compare timestamps, latest one should come first
        return timeB.localeCompare(timeA);
      });
  
      // Debugging: Log the sorted files
      console.log('Sorted files:', sortedFiles);
  
      // Get the latest file (first in the sorted list)
      const latestFile = sortedFiles[0];
  
      if (!latestFile) {
        console.error('No matching autosave files found after sorting');
        return;
      }
  
      // Debugging: Log the file to be loaded
      console.log('Latest file to be loaded:', latestFile);
  
      // Fetch the latest file content
      const accessToken = window.gapi.client.getToken().access_token;
      const url = `https://www.googleapis.com/drive/v3/files/${latestFile.id}?alt=media`;
  
      const fileResponse = await fetch(url, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
  
      if (!fileResponse.ok) throw new Error('Failed to fetch autosave file');
  
      const csvText = await fileResponse.text();
      handleImportFromText(csvText); // Import the data into your app
  
    } catch (error) {
      console.error('Error loading autosave:', error);
    }
  };

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
        <button onClick={() => autosave(questions, true)}>Autosave</button>
        <label>
          <input
            type="checkbox"
            checked={autosaveEnabled}
            onChange={handleCheckboxChange}
          />
          Enable Autosave
        </label>
        
        <button onClick={loadAutosaveAndReplace}>Load Autosave</button>
        <button>
        Current Autosave File: {currentAutosaveFilename}
        </button>

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
          {/*<div className="column">AI</div>
          <div className="column">Law</div>*/}
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
              {/*<div className="column">{question.aiAnswer}</div>
              <div className="column">{question.law}</div>*/}

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

        </div>
      )}
    </div>
  );
};

export default QuestionsList;
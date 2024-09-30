
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './QuestionDetail.css'; // Import the CSS file
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAnglesLeft, faAnglesRight, faArrowLeft, faTimes, faEdit, faExpand, faSave, faCircle, faUpload, faSearch, faArrowRight, faCopy } from '@fortawesome/free-solid-svg-icons';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Import the Quill CSS
import { useSwipeable } from 'react-swipeable';
import Papa from 'papaparse';
import Acts from './Acts'; // Import the Acts component



const BASE_FILENAME = 'UB2024-APP_autosave_'; // Base filename for autosaves

const QuestionDetail = ({ questions, updatePodobne, updateRating, sortBy, filterBy, updateAIAnswer, updateLaw}) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [showRatingPopup, setShowRatingPopup] = useState(false);
  const [rating, setRating] = useState(1);

  const [showPodobnePopup, setShowPodobnePopup] = useState(false);
  const [numberP, setNumberP] = useState(1);

  const [isEditVisible, setIsEditVisible] = useState(false);
  const [question, setQuestion] = useState(null);
  const [sortedAndFilteredQuestions, setSortedAndFilteredQuestions] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAIAnswerVisible, setIsAIAnswerVisible] = useState(false);
  const [isAIAnswerEdited, setIsAIAnswerEdited] = useState(false);

  const [aiAnswerContent, setAiAnswerContent] = useState('');

  const [isLawVisible, setIsLawVisible] = useState(false);
  const [isLawListVisible, setIsLawListVisible] = useState(false);
  const [isAPVisible, setIsAPVisible] = useState(false);
  const [isLawEdited, setIsLawEdited] = useState(false);
  const [lawContent, setLawContent] = useState('');
  const [APContent, setAPContent] = useState ('');
  const [isSaved, setIsSaved] = useState(false);


  const [animationClass, setAnimationClass] = useState('');

  const [currentAutosaveFilename, setCurrentAutosaveFilename] = useState('');
  const [autosaveEnabled, setAutosaveEnabled] = useState(false); // State for checkbox
  const [autosaveInterval, setAutosaveInterval] = useState(null); // State for autosave interval
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTermList, setSearchTermList] = useState('');
  const [searchResults, setSearchResults] = useState([]);  // Array of search result positions
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);  // Index of the current match
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null); // Store recognition instance
  const [transcript, setTranscript] = useState('');
  const [lastFinalResult, setLastFinalResult] = useState(''); // Track the last final result
  const [modifiedLawContent, setModifiedLawContent] = useState('');
  const [selectedActTitle, setSelectedActTitle] = useState('');

  const acts = Acts();


  // Filtered acts based on search term
  const filteredActs = acts.filter((act) =>
    act.title.toLowerCase().includes(searchTermList.toLowerCase())
  );
  
  // Handler to select and display a specific act
  const handleActClick = (actId) => {
    const selectedAct = acts.find((act) => act.id === actId);
    if (selectedAct) {
      setAPContent(selectedAct.content);
      setIsAPVisible(true);
      setIsLawListVisible(false);
    }
  };

useEffect(() => {
  // Replace all `id="..."` and all content after AKT="..." with clickable <span> elements
  const newContent = lawContent
    .replace(/id="([^"]+)"/g, (match, idValue) => {
      return `<span class="clickable-id" style="cursor: pointer;" onclick="handleIdClick('${idValue}')">${match}</span>`;
    })
    .replace(/AKT="([^"]+)"/g, (match, actId2) => {
      // Create a clickable span with the original content, preserving HTML
      return `<span class="clickable-act" style="cursor: pointer;" onclick="handleActIdClick('${actId2}')">${match}</span>`;
    });

  setModifiedLawContent(newContent);
}, [lawContent]);

useEffect(() => {
  // Define the global function to set searchTerm for ID
  window.handleIdClick = (idValue) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = idValue;
    setSearchTerm(`id="${tempDiv.innerText}`); // Update with plain text
    searchInLaw();
  };

  window.handleActIdClick = (actId2) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = actId2;
    
    // Set the search term for the list
    setSearchTermList(`${tempDiv.innerText}`); 
    
    // Make the law list visible
    setIsLawListVisible(true);

    // Find the act in the list and trigger handleActClick
    const matchingAct = acts.find((act) => act.title === tempDiv.innerText);

    // If the matching act is found, trigger handleActClick with the matching act's ID
    if (matchingAct) {
      handleActClick(matchingAct.id);
    }
  };

  return () => {
    // Cleanup the global functions when the component unmounts
    delete window.handleIdClick;
    delete window.handleActIdClick; 
  };
}, [acts, setSearchTermList, handleActClick]);





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
      removeOldestFiles();
      if (!response.ok) throw new Error('Failed to upload autosave file');
      // If upload was successful, return true
      return true;
    } catch (error) {
      console.error('Error uploading autosave to Drive:', error);
      // If there was an error, return false
      return false;
    }
    
  };



  const autosave = async () => {
    const now = new Date();
    now.setHours(now.getHours() + 2); // Adjust for UTC+2

    const dateString = now.toISOString().replace(/T/, '___').replace(/:/g, '-').replace(/\.\d+Z$/, '');
    const filename = `${BASE_FILENAME}${dateString}.csv`;

    const csv = Papa.unparse(questions, {
      header: true,
      delimiter: ";",
      columns: ["number", "numberP", "question", "kategoria", "zestaw", "rating", "answer", "aiAnswer", "law"]
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

    // Call uploadCSVToDrive and wait for the result
    const isSaved = await uploadCSVToDrive(blob, filename);
    
    // Update the state based on whether the upload was successful
    setIsSaved(isSaved); // Assuming you have a useState for isSaved

    setCurrentAutosaveFilename(filename); // Update filename display
  };




  const handleAutosave = async () => {
    const savedStatus = await autosave();
    setIsSaved(savedStatus); // Update state based on autosave result
  };

  // Call handleAutosave whenever you want to trigger the autosave

  
  
  const startAutosave = () => {
    if (autosaveEnabled) return; // Only start if not already enabled
  
    setAutosaveEnabled(true); // Update state
    localStorage.setItem('autosaveEnabled', true); // Persist to localStorage
  };
  
  const stopAutosave = () => {
    if (autosaveInterval) {
      clearInterval(autosaveInterval); // Clear the interval
      setAutosaveInterval(null); // Reset interval state
    }
    setAutosaveEnabled(false); // Update state
    localStorage.setItem('autosaveEnabled', false); // Persist to localStorage
  };

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




  // Clean up interval when component unmounts
  useEffect(() => {
    return () => {
      startAutosave();
    }
  }, []);
  useEffect(() => {
    // Only set up the autosave interval if autosave was explicitly enabled
    if (autosaveEnabled) {
      // First, perform an immediate autosave
      autosave(); // Call autosave immediately when the effect runs
  
      const interval = setInterval(() => {
        if (autosaveEnabled) {
          autosave(); // Call autosave only if enabled
        }
      }, 10000); // Autosave every 10 seconds
  
      setAutosaveInterval(interval); // Save interval ID to state
  
      // Cleanup interval on component unmount
      return () => {
        clearInterval(interval);
        setAutosaveInterval(null);
        startAutosave(); // Ensure we don't leave intervals hanging
      };
    }
  }, [autosaveEnabled]); // Re-run only if autosaveEnabled changes
  



  const toggleFullscreen = () => {
    if (!document.fullscreenElement &&    // Standard browsers
        !document.mozFullScreenElement && // Firefox
        !document.webkitFullscreenElement && // Chrome, Safari, Opera
        !document.msFullscreenElement) { // IE/Edge
      // Enter fullscreen
      const element = document.documentElement;
      if (element.requestFullscreen) {
        element.requestFullscreen();
      } else if (element.mozRequestFullScreen) { // Firefox
        element.mozRequestFullScreen();
      } else if (element.webkitRequestFullscreen) { // Chrome, Safari, Opera
        element.webkitRequestFullscreen();
      } else if (element.msRequestFullscreen) { // IE/Edge
        element.msRequestFullscreen();
      }
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.mozCancelFullScreen) { // Firefox
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) { // Chrome, Safari, Opera
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) { // IE/Edge
        document.msExitFullscreen();
      }
    }
  };
  

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
        // if (sortBy === 'numberP') {
        //   return (parseInt(a.numberP, 10) || 0) - (parseInt(b.numberP, 10) || 0);
        // }

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
    if (foundQuestion) {
      setAiAnswerContent(foundQuestion['aiAnswer'] || '');
      setLawContent(foundQuestion['law'] || '');
      setIsAnswerRevealed(false);
      setRating(foundQuestion && !isNaN(parseInt(foundQuestion.rating, 10)) ? parseInt(foundQuestion.rating, 10) : '');
      setNumberP(foundQuestion && foundQuestion.numberP !== undefined ? foundQuestion.numberP : '');

    }
  }, [id, questions, sortBy, filterBy]);


  const swipeHandlers = useSwipeable({
    onSwipedUp: () => handleSwipeUp(),
    onSwipedLeft: () => handleSwipe(1),
    onSwipedRight: () => handleSwipe(-1),
    swipeDuration: 500,  // Increase this value to allow longer swipe durations
    delta: 50,  // Increase this value to require a larger swipe distance
  });
  
  const handleSwipeUp = () => {
    if (!isAnswerRevealed) {
      handleRevealAnswer();
    }
  };

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

  const handlePodobneNr = () => setShowPodobnePopup(true);
  const handlePodobne = (value) => {
    setNumberP(value);
    updatePodobne(question.id, value);
    setShowPodobnePopup(false);
  };

  const handleClosePodobnePopup = () => setShowPodobnePopup(false);
  // Function to handle the "Enter" key press
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handlePodobne(numberP); // Call the handlePodobne function with the current value
    }
  };
  

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
      setIsLawEdited(false);
      setIsLawVisible(false);
      setIsAPVisible(false);
      setIsAIAnswerEdited(false);
      setIsAIAnswerVisible(false);
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
  const handleLawChange = (content) => setLawContent(content);
  const handleAPChange = (content) => setAPContent(content);

  const handleRevealAIAnswer = () => setIsAIAnswerVisible(true);
  const handleHideAIAnswer = () => setIsAIAnswerVisible(false);
  const handleAIAnswerEdit = () => setIsAIAnswerEdited(true);
  const handleAIAnswerHide = () => setIsAIAnswerEdited(false);
  const handleLawEdit = () => setIsLawEdited(true);
  const handleLawHide = () => setIsLawEdited(false);

  const handleRevealLaw = () => setIsLawVisible(true);
  const handleRevealLawList = () => setIsLawListVisible(!isLawListVisible);
  const handleHideLaw = () => setIsLawVisible(false);



  const handleSaveAIAnswer = () => {
    if (question) {
      updateAIAnswer(question.id, aiAnswerContent);
    }
  };

  const handleSaveLaw = () => {
    if (question) {
      updateLaw(question.id, lawContent);
    }
  };

  const modules = {
    toolbar: [
      // [{ 'header': [1, 2, false] }],             // Header levels
      ['bold', 'italic', 'underline', { 'header': [1, 2, false] }, { 'list': 'ordered'}, { 'list': 'bullet' }, { 'color': [] }, { 'background': [] }, { 'align': [] }],           // Bold, Italic, Underline
      // [{ 'list': 'ordered'}, { 'list': 'bullet' }],  // Ordered and unordered lists
      // [{ 'color': [] }, { 'background': [] }],   // Text color and background color
      // [{ 'align': [] }],                         // Align text (left, center, right, justify)
      // ['link', 'image'],                         // Insert link and image
      // ['speech'], // Add custom button for speech recognition
    ],
    clipboard: {
      matchVisual: false // Prevent weird styles from pasting content
    }
  };

  const modulesHidden = {
    toolbar: false,
    clipboard: {
      matchVisual: false // Prevent weird styles from pasting content
    }
  };

  const copyActTitle = (title) => {
    // Add a small break (4px) before 'AKT="' and use plain text from the title
    setLawContent((prevLawContent) => 
      `${prevLawContent}<div style="height: 4px;"></div><div>AKT="${title}"</div><div style="height: 4px;"></div><div>id=""</div>`
    );
    setIsLawEdited(true); // Set the state to show the editor
  };
  



  // Handler for search input
const handleSearchChange = (e) => setSearchTerm(e.target.value);
  // Handler for search input
const handleSearchChangeList = (e) => setSearchTermList(e.target.value);



const escapeSpecialCharacters = (text) => {
  return text.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};


const searchInLaw = () => {
  if (searchTerm) {
    // Escape special characters before creating the regex
    const escapedSearchTerm = escapeSpecialCharacters(searchTerm);
    console.log(`Escaped Search Term: ${escapedSearchTerm}`); // Debugging

    // Create a regex from the escaped search term
    const regex = new RegExp(escapedSearchTerm, 'gi'); // g: global, i: case-insensitive
    const matches = [...APContent.matchAll(regex)];
    
    console.log(`Matches found: ${matches.map(m => m[0])}`); // Debugging

    // Store the indices of the matches
    setSearchResults(matches.map(match => match.index));
    setCurrentSearchIndex(matches.length > 0 ? 0 : -1);
    scrollToMatch(0); // Scroll to the first match
  }
};

  // Function to go to the next instance of the search term
  const goToNextMatch = () => {
    if (searchResults.length > 0) {
      const nextIndex = (currentSearchIndex + 1) % searchResults.length;
      setCurrentSearchIndex(nextIndex);
      scrollToMatch(nextIndex);
    }
  };

  // Function to go to the previous instance of the search term
  const goToPreviousMatch = () => {
    if (searchResults.length > 0) {
      const prevIndex = (currentSearchIndex - 1 + searchResults.length) % searchResults.length;
      setCurrentSearchIndex(prevIndex);
      scrollToMatch(prevIndex);
    }
  };

  const scrollToMatch = (index) => {
    const matchIndex = searchResults[index];
    if (matchIndex !== undefined) {
      // Find the specific highlighted match element by its class or id
      const highlightedElements = document.querySelectorAll('.highlight, .highlight-current');
      const currentElement = highlightedElements[index];
  
      if (currentElement) {
        // Scroll the container to bring the current match into view
        currentElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'  // Ensure the match appears in the middle of the container
        });
      }
    }
  };


const getHighlightedLawContent = () => {
  // Remove all class attributes (e.g., class="...") from APContent
  const cleanedContent = APContent
  // .replace(/class="[^"]*"/g, '')
  // .replace(/href="[^"]*"/g, '') // Remove href attributes
  .replace(/<a/g, '<strong')       // Replace <a with <strong
  .replace(/<\/a>/g, '</strong>')  // Replace </a> with </strong>
 
  // // .replace(/<div id="/g, '<div style="color: green;"') 

  // .replace(/([a-zA-Z0-9]+)\.&nbsp;/g, '<strong style="color:black" $1.&nbsp;</strong>') // Replace any letter or number followed by .&nbsp; with <strong>
  // .replace(/([a-zA-Z0-9]+)\)\s*<\/div>/g, '<strong>$1)</strong></div>')

  // .replace(/data-unit-id="[^"]*"/g, '<div style="color: blue;" id="$1"')
  // .replace(/<div\s+id="([^"]+)"\s*[^>]*>/g, '<div <small style="color:grey;" id="$1"></small>')
  // .replace(/id="([^"]+)"/g, 'style="color: green;" id="$1"')
  // .replace(/<span/g, '<span style="color: black;"') 

  // .replace(/>\.([^"]+)\.&nbsp;</g, '><span style="color: black;"$1</span><');
  .replace(/>\s*([^<]+)<\/div>/g, '><strong style="color: black;">$1</strong></div>')
  .replace(/href="[^"]*"/g, '')
  .replace(/class="[^"]*"/g, '')

  // .replace(/<span/g, '<span style="color: grey"')
  // .replace(/<a/g, '<a style="color: grey"')
  // .replace(/<p/g, '<p style="color: grey"')
  .replace(/>\s*\[([^\]]+)\]</g, '><strong style="color: black;">[$1]</strong><')
  // .replace(/>\s*([^<]+)<span/g, '><strong style="color: grey;">$1</strong><span')
  .replace(/>\s*([^<]+)</g, '><span style="color: black;">$1</span><')


  
  



  if (searchTerm) {
    // Escape special characters for the search term
    const escapedSearchTerm = escapeSpecialCharacters(searchTerm);
    console.log(`Escaped Search Term in Highlighting: ${escapedSearchTerm}`); // Debugging

    const regex = new RegExp(escapedSearchTerm, 'gi');
    let counter = -1;

    return cleanedContent.replace(regex, (match) => {
      counter++;
      return `<span class="${counter === currentSearchIndex ? 'highlight-current' : 'highlight'}">${match}</span>`;
    });
  }
  return cleanedContent; // Return unmodified content if no search term
};



// Function to copy highlighted text to clipboard
const copyHighlightedTextToClipboard = () => {
  // Get all highlighted elements
  const highlightedElements = document.querySelectorAll('.highlight, .highlight-current');
  let highlightedText = '';

  // Loop through each element and append its text to the string
  highlightedElements.forEach((element) => {
    highlightedText += element.textContent + ' ';
  });

  // Copy the highlighted text to the clipboard
  navigator.clipboard.writeText(highlightedText.trim())
  
  // .then(() => {
  //   alert('Highlighted text copied to clipboard!');
  // }).catch((error) => {
  //   console.error('Failed to copy text: ', error);
  // });
};



  return (
    <div className="question-detail-background">
        <button className="back-button" onClick={() => navigate('/UB2024-APP/questions')}>
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <button className="fullscreen-button" onClick={toggleFullscreen}><FontAwesomeIcon icon={faExpand} /></button>

        <div className=""style={{ display: isSaved ? 'block' : 'none' }}>
          <button className="online-yellow" style={{ display: autosaveEnabled ? 'none' : 'block' }} onClick={startAutosave}><FontAwesomeIcon icon={faCircle} />eAS</button>
        </div>
        <div className=""style={{ display: isSaved ? 'block' : 'none' }}>
          <button className="online-green" style={{ display: autosaveEnabled ? 'block' : 'none' }}  onClick={stopAutosave} ><FontAwesomeIcon icon={faCircle} />dAS</button>
        </div>
        <div className=""style={{ display: isSaved ? 'none' : 'block' }}>
          <button className="online-red" style={{ display: autosaveEnabled ? 'block' : 'none' }} onClick={stopAutosave} ><FontAwesomeIcon icon={faCircle} /></button>
        </div>
        <div className=""style={{ display: isSaved ? 'none' : 'block' }}>
          <button className="online-red" style={{ display: autosaveEnabled ? 'none' : 'block' }} onClick={stopAutosave} ><FontAwesomeIcon icon={faCircle} /></button>
        </div>

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
            <>
              <button className="hide-button-ai" onClick={() => setIsAIAnswerVisible(false)}>
                Hide AI
              </button>
              <button className="save-button-ai" onClick={handleSaveAIAnswer}>
                <FontAwesomeIcon icon={faSave} />
              </button>
              <FontAwesomeIcon icon={faEdit} className="law-hide-button" onClick={handleAIAnswerEdit} />
            </>
          )}          
          {isAIAnswerEdited && (
            <>
              <button className="hide-button-ai" onClick={() => setIsAIAnswerEdited(false)}>
                Hide AI
              </button>
              <button className="save-button-ai" onClick={handleSaveAIAnswer}>
                <FontAwesomeIcon icon={faSave} />

              </button>
              <FontAwesomeIcon icon={faEdit} className="law-hide-button" onClick={handleAIAnswerHide} />
            </>
          )}
          

          {!isLawVisible && (
            <button className="law-button" onClick={handleRevealLaw}>
              Law
            </button>
          )}
          {isLawVisible && (
            <>
              {/* <button className='save-button-ai' onClick={setIsLawListVisible(true)}></button> */}
              <button className="law-list-button" onClick={handleRevealLawList}>AP</button>
              <button className="law-hide-button" onClick={() => setIsLawVisible(false)}>
                Hide Law
              </button>
              <button className="save-button-ai" onClick={handleSaveLaw}>
                <FontAwesomeIcon icon={faSave} />
              </button>
              <FontAwesomeIcon icon={faEdit} className="hide-button-ai" onClick={handleLawEdit} />
            </>
          )}



          {isLawEdited && (
            <>
              <button className="law-hide-button" onClick={() => setIsLawEdited(false)}>
                Hide Law
              </button>
              <button className="save-button-ai" onClick={handleSaveLaw}>
                <FontAwesomeIcon icon={faSave} />

              </button>
              <FontAwesomeIcon icon={faEdit} className="hide-button-ai" onClick={handleLawHide} />
            </>
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
          <p><strong>Nr:</strong> {question.number}</p>
          <p onClick={handlePodobneNr}><strong>P:</strong> {numberP} </p>
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
            {/* <div dangerouslySetInnerHTML={{ __html: question.answer }} /> */}
            <ReactQuill 
              className="ai-answer-editor"
              theme="snow"
              value={question.answer}
              modules={modulesHidden}
              readOnly= {true}    
            />        
          </div>

          <div className={`ai-answer-container ${isAIAnswerVisible ? 'revealed' : ''}`}>
            <ReactQuill 
              className="ai-answer-editor"
              theme="snow"
              value={aiAnswerContent}
              modules={modulesHidden}
              readOnly= {true}    
            />                        
          </div>
          <div className={`bottom-mask ${isAIAnswerVisible ? 'revealed' : ''}`}></div>


          <div className={`ai-answer-container-ed ${isAIAnswerEdited ? 'revealed' : ''}`}>
            <ReactQuill 
              className="ai-answer-editor"
              theme="snow"
              value={aiAnswerContent}
              onChange={handleAiAnswerChange}
              modules={modules}
              readOnly= {false}    
            />

          </div> 
          
            
          {/* <div className={`law-container ${isLawVisible ? 'revealed' : ''}`}>Akty Prawne / Normy / Opracowania:
            <ReactQuill 
              className="ai-answer-editor"
              theme="snow"
              value={lawContent}
              onChange={handleLawChange}
              modules={modulesHidden}
              readOnly= {true}    
            />
          </div>
          <div className={`bottom-mask ${isLawVisible ? 'revealed' : ''}`}></div>*/}

          <div className={`law-container-ed ${isLawEdited ? 'revealed' : ''}`}>
            <ReactQuill 
              className="ai-answer-editor"
              theme="snow"
              value={lawContent}
              onChange={handleLawChange}
              modules={modules}
              readOnly= {false}    
            />
          </div>
          <div className={`bottom-mask ${isLawEdited ? 'revealed' : ''}`}></div> 


          {/* <div className={`law-ap-container ${isAPVisible ? 'revealed' : ''}`}>
            <ReactQuill 
              className="ai-answer-editor"
              theme="snow"
              value={APContent}
              onChange={handleAPChange}
              modules={modulesHidden}
              readOnly= {true}    
            />
          </div> */}
          <div className={`law-container ${isLawVisible ? 'revealed' : ''}`}>
          
            {isAPVisible && (
             <div className="search-section">
                <button onClick={copyHighlightedTextToClipboard}><FontAwesomeIcon icon={faCopy} /></button>
                <input
                  type="text"
                  value={searchTerm}
                  placeholder="Search in legal act..."
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button onClick={searchInLaw}>
                  <FontAwesomeIcon icon={faSearch} />
                </button>
                <button onClick={goToPreviousMatch}>
                  <FontAwesomeIcon icon={faArrowLeft} />
                </button>
                <button onClick={goToNextMatch}>
                  <FontAwesomeIcon icon={faArrowRight} />
                </button>
                
              </div>    
            )}
            <div className={`law-list-container ${isLawListVisible ? 'revealed' : ''}`}>

                {/* Table to display filtered acts */}
                <table className="acts-table">
                  <thead>
                    <tr>
                      <th>
                        <button className="clear-button2" onClick={() => setSearchTermList('')}>
                          <i className="fa fa-times" aria-hidden="true"></i>
                        </button>
                      </th>
                      <th>
                        <input
                          className='search-bar'
                          type="text"
                          placeholder="Search acts..."
                          value={searchTermList}
                          onChange={handleSearchChangeList}
                        />
                      </th>
                      
                      
                    </tr>
                  </thead>
                  <tbody>
                    {filteredActs.map((act) => (
                      <tr key={act.id}>
                        <td>
                          {/* Button to copy the title */}
                          <button className="clear-button2" onClick={() => copyActTitle(act.title)}>Copy </button>
                        </td>
                        <td>
                          {/* Button to open the act */}
                          <button className='search-bar' onClick={() => handleActClick(act.id)}>{act.title}</button>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              
            </div>
            <h5 className='clear-button'>instrukcja: WT: id="par(13)ust(1)pkt(1)lit(b)"_  PB: id="art(2)ust(2)pkt(1)lit(b)"</h5>
            
            <div dangerouslySetInnerHTML={{ __html: modifiedLawContent }} />
      

            {/* Law AP Container */}
            <div className={`law-ap-container ${isAPVisible ? 'revealed' : ''}`}>
              <div className="ap-title">
                {question.question}
              </div>
              {/* <div className="search-section">
                <input
                  type="text"
                  value={searchTerm}
                  placeholder="Search in legal act..."
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button onClick={searchInLaw}>
                  <FontAwesomeIcon icon={faSearch} />
                </button>
                <button onClick={goToPreviousMatch}>
                  <FontAwesomeIcon icon={faArrowLeft} />
                </button>
                <button onClick={goToNextMatch}>
                  <FontAwesomeIcon icon={faArrowRight} />
                </button>
              </div> */}
              {/* Display the law content with highlighted matches */}
              <div>
                <button className="law-AP-close" onClick={() => setIsAPVisible(false)}><FontAwesomeIcon icon={faTimes} /></button>
              </div>
              
              <div className={`law-ap-container ${isAPVisible ? 'revealed' : ''}`}dangerouslySetInnerHTML={{ __html: getHighlightedLawContent() }} />
                  {/* Button to copy highlighted text */}
              
    
            </div>
          </div>
          <div className={`bottom-mask ${isLawVisible ? 'revealed' : ''}`}></div>

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

        {showPodobnePopup && (
          <div className="rating-popup">
            <button className="close-popup" onClick={handleClosePodobnePopup}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
            <p>Pytanie podobne do:</p>
            <div>
              <input
                type="text"
                placeholder="Enter your value"
                value={numberP}
                onChange={(e) => setNumberP(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button onClick={() => handlePodobne(numberP)}>
                Submit
              </button>
            </div>
          </div>
        )}


      </div>
    </div>
  );
};

export default QuestionDetail;
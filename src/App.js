import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import MainTab from './components/MainTab';
import QuestionsList from './components/QuestionsList';
import QuestionDetail from './components/QuestionDetail';
import EditQuestion from './components/EditQuestion';
import './App.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { gapi } from 'gapi-script';

const CLIENT_ID = 'YOUR_CLIENT_ID.apps.googleusercontent.com';
const API_KEY = 'AIzaSyB4qNObqLuSYE-MVszqngY-Aw8bGx3ghSk';
const SHEET_ID = '1aR36o-hbh3Sur_ndicM0_KOKbZkczqx6dAB2BL1dEmk'; // The ID of your Google Sheet
const DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];
const SCOPES = "https://www.googleapis.com/auth/spreadsheets";

function App() {
  const [questions, setQuestions] = useState([]);
  const [sortBy, setSortBy] = useState('');
  const [filterBy, setFilterBy] = useState('');
  const [isSignedIn, setIsSignedIn] = useState(false);

  // Initialize the Google API client
  useEffect(() => {
    function start() {
      gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES,
      }).then(() => {
        const authInstance = gapi.auth2.getAuthInstance();
        authInstance.isSignedIn.listen(setIsSignedIn);
        setIsSignedIn(authInstance.isSignedIn.get());
        if (authInstance.isSignedIn.get()) {
          fetchSheetData(); // Fetch data if already signed in
        }
      });
    }

    gapi.load("client:auth2", start);
  }, []);

  const handleSignIn = () => {
    gapi.auth2.getAuthInstance().signIn();
  };

  const handleSignOut = () => {
    gapi.auth2.getAuthInstance().signOut();
  };

  // Fetch questions from Google Sheets
  const fetchSheetData = () => {
    gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Sheet1!A1:Z1000', // Adjust range as needed
    }).then(response => {
      const rows = response.result.values;
      if (rows && rows.length > 0) {
        const parsedQuestions = rows.map(row => ({
          id: row[0],
          kategoria: row[1],
          zestaw: row[2],
          question: row[3],
          answer: row[4],
          rating: row[5],
        }));
        setQuestions(parsedQuestions);
      }
    }).catch(err => console.error('Error fetching data from Google Sheets', err));
  };

  const addQuestionsToSheet = (newQuestions) => {
    const values = newQuestions.map(q => [
      q.id, q.kategoria, q.zestaw, q.question, q.answer, q.rating,
    ]);
    gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'Sheet1!A1',
      valueInputOption: 'RAW',
      resource: { values },
    }).then(() => fetchSheetData());
  };

  const updateQuestionInSheet = (id, updatedQuestion) => {
    // In practice, you might want to find the row and update it.
    const newQuestions = questions.map(q => (q.id === id ? updatedQuestion : q));
    setQuestions(newQuestions);
    // Append to Google Sheet
    addQuestionsToSheet(newQuestions);
  };

  return (
    <Router>
      <div className="App">
        {isSignedIn ? (
          <button onClick={handleSignOut}>Sign Out</button>
        ) : (
          <button onClick={handleSignIn}>Sign In with Google</button>
        )}

        <Routes>
          <Route path="/" element={<Navigate to="/UB2024-APP/" replace />} />
          <Route path="/UB2024-APP/" element={<MainTab />} />
          <Route
            path="/UB2024-APP/questions"
            element={
              <QuestionsList
                questions={questions}
                addQuestions={addQuestionsToSheet}
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
                updateRating={updateQuestionInSheet}
                sortBy={sortBy}
                filterBy={filterBy}
              />
            }
          />
          <Route
            path="/UB2024-APP/edit/:id"
            element={<EditQuestion questions={questions} saveQuestion={updateQuestionInSheet} />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './MainTab.css'; // Add any custom styles for the modal here

const MainTab = () => {
  const navigate = useNavigate();
  const [showPasswordPopup, setShowPasswordPopup] = useState(false);
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Password stored in .env
  const correctPassword = process.env.REACT_APP_PASSWORD;

  const handlePasswordSubmit = () => {
    if (password === correctPassword) {
      navigate('/UB2024-APP/questions');
    } else {
      setErrorMessage('Hehe, źle.');
    }
  };

  // Handle Enter key press for password submission
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handlePasswordSubmit();
    }
  };

  return (
    <div className="main-tab">
      <div className="background-overlay">
        <div className="main-content">
          <h1 className="main-title">UB2024</h1>
          <button
            className="lista-pytan-button"
            onClick={() => setShowPasswordPopup(true)}
          >
            Lista Pytań
          </button>
        </div>

        {/* Password Popup Modal */}
        {showPasswordPopup && (
          <div className="password-popup">
            <div className="password-popup-content">
              <h2>Enter Password</h2>
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                className="password-input"
              />
              <div className="popup-buttons">
                <button onClick={handlePasswordSubmit} className="submit-password-button">
                  Submit
                </button>
                <button
                  onClick={() => setShowPasswordPopup(false)}
                  className="cancel-button"
                >
                  Cancel
                </button>
              </div>
              {errorMessage && <p className="error-message">{errorMessage}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MainTab;

// components/MainTab.js
import React from 'react';
import { useNavigate } from 'react-router-dom';


const MainTab = () => {
  const navigate = useNavigate();

  return (
    <div className="main-tab">
      <h1>UB2024</h1>
      <button className="lista-pytan-button" onClick={() => navigate('/UB2024-APP2/questions')}>
        Lista Pytań
      </button>
    </div>
  );
};

export default MainTab;

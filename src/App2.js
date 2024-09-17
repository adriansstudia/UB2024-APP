import React, { useState } from 'react';
import TinderCard from 'react-tinder-card';
import './App.css';

const App = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cards] = useState([
    "Hello World",
    "Second Page",
    "Third Card"  // Add more cards if needed
  ]);

  const swiped = (direction, index) => {
    if (direction === 'right' || direction === 'left') {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % cards.length);
    }
  };

  return (
    <div className="app">
      <div className="card-container">
        {cards.map((content, index) => (
          index === currentIndex && (
            <TinderCard
              key={index}
              onSwipe={(dir) => swiped(dir, index)}
              preventSwipe={['up', 'down']}
            >
              <div className="card">{content}</div>
            </TinderCard>
          )
        ))}
      </div>
    </div>
  );
};

export default App;

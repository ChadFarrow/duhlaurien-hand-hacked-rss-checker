import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RSSFeedChecker from './components/RSSFeedChecker';
import './App.css';

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/*" element={<RSSFeedChecker />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;

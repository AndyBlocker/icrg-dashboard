import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Downtime from './pages/Downtime';

function App() {
  return (
    <Router basename="/icrg_status">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/downtime" element={<Downtime />} />
      </Routes>
    </Router>
  );
}

export default App;
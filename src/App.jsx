import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import Downtime from './pages/Downtime';

function App() {
  return (
    <ErrorBoundary>
      <Router basename="/icrg_status">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/downtime" element={<Downtime />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
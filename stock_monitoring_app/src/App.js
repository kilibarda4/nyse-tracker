import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import AuthForm from './AuthForm';    // Your SignIn component
import Dashboard from './Dashboard'; // The new Dashboard component
import LandingPage from './LandingPage'; // The landing page
import ProtectedRoute from './ProtectedRoute';


function App() {
  

  return (
    <Router>
      <Routes>
        {/* Landing page is the first page shown */}
        <Route path="/" element={<LandingPage />} />
        {/* Redirect to Dashboard if logged in, else show SignIn */}
        <Route path="/auth" element={<AuthForm />} />
        {/* Protect the dashboard route */}
        <Route
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
            }
        />
      </Routes>
    </Router>
  );
}

export default App;

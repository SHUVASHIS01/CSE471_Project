import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import ApplicantDashboard from './components/ApplicantDashboard';
import ApplyJob from './components/ApplyJob';
import MyApplications from './components/MyApplications';
import PersonalizedJobsPage from './components/PersonalizedJobsPage';
import RecruiterDashboard from './components/RecruiterDashboard';
import PostJob from './components/PostJob';
import JobApplications from './components/JobApplications';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route 
            path="/applicant/dashboard" 
            element={
              <ProtectedRoute role="applicant">
                <ApplicantDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/jobs" 
            element={
              <ProtectedRoute role="applicant">
                <ApplicantDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/apply/:jobId" 
            element={
              <ProtectedRoute role="applicant">
                <ApplyJob />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/my-applications" 
            element={
              <ProtectedRoute role="applicant">
                <MyApplications />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/jobs/personalized" 
            element={
              <ProtectedRoute role="applicant">
                <PersonalizedJobsPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/recruiter/dashboard" 
            element={
              <ProtectedRoute role="recruiter">
                <RecruiterDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/post-job" 
            element={
              <ProtectedRoute role="recruiter">
                <PostJob />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/job/:jobId/applications" 
            element={
              <ProtectedRoute role="recruiter">
                <JobApplications />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

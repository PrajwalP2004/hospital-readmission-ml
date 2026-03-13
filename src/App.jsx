import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import LoadingSpinner from './components/common/LoadingSpinner';

// Lazy load pages for better performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Patients  = lazy(() => import('./pages/Patients'));
const PredictionRunner = lazy(() => import('./pages/PredictionRunner'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Login = lazy(() => import('./pages/Login'));
const PatientPortal = lazy(() => import('./pages/PatientPortal'));

import authService from './services/authService';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ role }) => {
  const user = authService.getCurrentUser();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={user.role === 'patient' ? '/portal' : '/'} replace />;
  return <Outlet />;
};

const App = () => {
  return (
    <Router>
      <Suspense fallback={<LoadingSpinner fullPage label="Initializing MedPredict …" />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Patient Routes */}
          <Route element={<ProtectedRoute role="patient" />}>
            <Route path="/portal" element={<PatientPortal />} />
          </Route>

          {/* Clinician Routes */}
          <Route element={<ProtectedRoute role="clinician" />}>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/patients" element={<Patients />} />
              <Route path="/predictions" element={<PredictionRunner />} />
              <Route path="/analytics" element={<Analytics />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
};

export default App;

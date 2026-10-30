import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UploadResume from './pages/UploadResume';
import Resumes from './pages/Resumes';
import Payslips from './pages/Payslips';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
        <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', color: '#ea580c', fontWeight: '600' }}>
        Loading Admin Dashboard...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Automatically detect basename when deployed in a subfolder like /ats or root /
const getRouterBasename = () => {
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/ats')) {
    return '/ats';
  }
  return '/';
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename={getRouterBasename()}>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="payslips" element={<Navigate to="/?section=payslips" replace />} />
            <Route path="upload" element={<UploadResume />} />
            <Route path="resumes" element={<Resumes />} />
            <Route path="candidates" element={<Navigate to="/" replace />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

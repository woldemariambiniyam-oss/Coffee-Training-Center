import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import PrivateRoute from './components/PrivateRoute'
import Navbar from './components/Navbar'
import { ToastContainer } from './components/ui'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import Sessions from './pages/Sessions'
import Queue from './pages/Queue'
import Exams from './pages/Exams'
import ExamTake from './pages/ExamTake'
import Certificates from './pages/Certificates'
import CertificateVerify from './pages/CertificateVerify'
import Reports from './pages/Reports'
import UserManagement from './pages/UserManagement'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
            <Navbar />
            <main className="container mx-auto px-4 py-8">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/verify/:certificateNumber" element={<CertificateVerify />} />
                <Route
                  path="/dashboard"
                  element={
                    <PrivateRoute>
                      <Dashboard />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/sessions"
                  element={
                    <PrivateRoute>
                      <Sessions />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/queue"
                  element={
                    <PrivateRoute>
                      <Queue />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/exams"
                  element={
                    <PrivateRoute>
                      <Exams />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/exams/:id/take"
                  element={
                    <PrivateRoute>
                      <ExamTake />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/certificates"
                  element={
                    <PrivateRoute>
                      <Certificates />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/reports"
                  element={
                    <PrivateRoute>
                      <Reports />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/users"
                  element={
                    <PrivateRoute>
                      <UserManagement />
                    </PrivateRoute>
                  }
                />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </main>
            <ToastContainer />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App



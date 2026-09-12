import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import PortalWave from './components/PortalWave';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StudentCatalogPage from './pages/StudentCatalogPage';
import StudentReservationsPage from './pages/StudentReservationsPage';
import StudentBorrowedPage from './pages/StudentBorrowedPage';
import StudentBookmarksPage from './pages/StudentBookmarksPage';
import StaffCatalogPage from './pages/StaffCatalogPage';
import StaffReservationsPage from './pages/StaffReservationsPage';
import StaffBorrowedPage from './pages/StaffBorrowedPage';
import { useAuth } from './context/AuthContext';
import './App.css';

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <p>Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'staff' ? '/staff' : '/student'} replace />;
}

export default function App() {
  const { user } = useAuth();
  const location = useLocation();
  const isAuthRoute = location.pathname === '/login' || location.pathname === '/register';

  if (isAuthRoute) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    );
  }

  return (
    <div className="app-shell">
      <Navbar />
      <div className="app-body">
        {user && <Sidebar />}
        <main className="app-content">
          <PortalWave />
          <Routes>
            <Route path="/" element={<HomeRedirect />} />
            <Route
              path="/student"
              element={
                <ProtectedRoute roles={['student']}>
                  <StudentCatalogPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/reservations"
              element={
                <ProtectedRoute roles={['student']}>
                  <StudentReservationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/borrowed"
              element={
                <ProtectedRoute roles={['student']}>
                  <StudentBorrowedPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/bookmarks"
              element={
                <ProtectedRoute roles={['student']}>
                  <StudentBookmarksPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff"
              element={
                <ProtectedRoute roles={['staff']}>
                  <StaffCatalogPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/reservations"
              element={
                <ProtectedRoute roles={['staff']}>
                  <StaffReservationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/borrowed"
              element={
                <ProtectedRoute roles={['staff']}>
                  <StaffBorrowedPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
      {user && <BottomNav />}
    </div>
  );
}

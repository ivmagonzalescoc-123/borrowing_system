import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { NotificationProvider } from './context/NotificationContext.jsx'
import { BookmarkProvider } from './context/BookmarkContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import AppToast from './components/AppToast.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <NotificationProvider>
            <BookmarkProvider>
              <App />
            </BookmarkProvider>
          </NotificationProvider>
        </AuthProvider>
        <AppToast />
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
)

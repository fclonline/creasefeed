import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth.jsx'
import { TeamsProvider } from './hooks/useTeams.jsx'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <TeamsProvider>
          <App />
        </TeamsProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)

import { createRoot } from 'react-dom/client'
import { AuthProvider } from './context/AuthContext';
import { app } from './firebase'; 
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
)

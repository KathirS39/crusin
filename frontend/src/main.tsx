import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { UserProvider } from './context/UserContext'
import { AsgardeoProvider } from '@asgardeo/react'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AsgardeoProvider
      clientId={(import.meta.env.VITE_ASGARDEO_CLIENT_ID as string | undefined) || 'RKiwf5Uj5pSjcRcHQ_a0B75Q6pUa'}
      baseUrl="https://api.asgardeo.io/t/fullstack39"
      scopes={['openid', 'profile', 'email']}
      afterSignInUrl="https://crusin-1.onrender.com"
      afterSignOutUrl="https://crusin-1.onrender.com"
    >
      <UserProvider>
        <App />
      </UserProvider>
    </AsgardeoProvider>
  </StrictMode>,
)

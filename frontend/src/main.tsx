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
      baseUrl={`https://api.asgardeo.io/t/${(import.meta.env.VITE_ASGARDEO_ORG as string | undefined) || 'fullstack39'}`}
      scopes={['openid', 'profile', 'email']}
      afterSignInUrl={window.location.origin}
      afterSignOutUrl={window.location.origin}
    >
      <UserProvider>
        <App />
      </UserProvider>
    </AsgardeoProvider>
  </StrictMode>,
)

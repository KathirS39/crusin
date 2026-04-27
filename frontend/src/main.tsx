import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { UserProvider } from './context/UserContext'
import { AsgardeoProvider } from '@asgardeo/react'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AsgardeoProvider
      clientId={import.meta.env.VITE_ASGARDEO_CLIENT_ID}
      baseUrl={import.meta.env.VITE_ASGARDEO_BASE_URL}
      scopes={['openid', 'profile', 'email']}
      afterSignInUrl={`${import.meta.env.VITE_APP_URL}/`}
      afterSignOutUrl={`${import.meta.env.VITE_APP_URL}/`}
    >
      <UserProvider>
        <App />
      </UserProvider>
    </AsgardeoProvider>
  </StrictMode>,
)

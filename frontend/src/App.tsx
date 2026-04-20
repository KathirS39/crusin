import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
// import { SignedIn, SignedOut, SignInButton, SignOutButton, useAsgardeo } from '@asgardeo/react'
import { UserProvider, useUser } from './context/UserContext'
import Header from './components/Header'
import Footer from './components/Footer'
import RoleSelect from './pages/RoleSelect'
import RiderDashboard from './pages/rider/RiderDashboard'
import RequestRide from './pages/rider/RequestRide'
import PendingRides from './pages/rider/PendingRides'
import CompletedRides from './pages/rider/CompletedRides'
import RiderProfile from './pages/rider/RiderProfile'
import DriverDashboard from './pages/driver/DriverDashboard'
import AvailableRides from './pages/driver/AvailableRides'
import MyRides from './pages/driver/MyRides'
import DriverProfile from './pages/driver/DriverProfile'

function AppRoutes() {
  const { role } = useUser()

  return (
    <Routes>
      <Route index element={
        role === 'rider' ? <Navigate to="/rider/dashboard" replace /> :
        role === 'driver' ? <Navigate to="/driver/dashboard" replace /> :
        <RoleSelect />
      } />

      {/* Rider routes */}
      <Route path="rider/dashboard" element={<RiderDashboard />} />
      <Route path="rider/request" element={<RequestRide />} />
      <Route path="rider/pending" element={<PendingRides />} />
      <Route path="rider/completed" element={<CompletedRides />} />
      <Route path="rider/profile" element={<RiderProfile />} />

      {/* Driver routes */}
      <Route path="driver/dashboard" element={<DriverDashboard />} />
      <Route path="driver/available" element={<AvailableRides />} />
      <Route path="driver/my-rides" element={<MyRides />} />
      <Route path="driver/profile" element={<DriverProfile />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function AppShell() {
  // const { isSignedIn } = useAsgardeo()
  const { clearUser } = useUser()

  useEffect(() => {
    // clears user context on sign-out — re-enable when auth is on
    // if (!isSignedIn) clearUser()
    void clearUser // suppress unused warning
  }, [clearUser])

  return (
    <div className="min-h-screen bg-[#08101e] flex flex-col">
      <Header />

      <main className="flex-1">
        {/* auth guards — re-enable when auth is on */}
        {/* <SignedIn> */}
          <AppRoutes />
          {/* <SignOutButton /> */}
        {/* </SignedIn> */}

        {/* <SignedOut>
          <div className="flex flex-col items-center justify-center h-full py-32 px-4 text-center">
            <h1 className="text-5xl font-bold text-white tracking-tight mb-3">Crusin</h1>
            <p className="text-gray-400 text-lg mb-8 max-w-sm">
              Hop in. Let's roll.
            </p>
            <SignInButton className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3 rounded-xl transition-colors text-lg" />
          </div>
        </SignedOut> */}
        {/* <div className="flex flex-col items-center justify-center h-full py-32 px-4 text-center">
          <h1 className="text-5xl font-bold text-white tracking-tight mb-3">Crusin</h1>
          <p className="text-gray-400 text-lg mb-8 max-w-sm">
            Hop in. Let's roll.
          </p>
        </div> */}
      </main>

      <Footer />
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <AppShell />
      </UserProvider>
    </BrowserRouter>
  )
}

export default App

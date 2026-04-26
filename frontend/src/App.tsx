import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { SignedIn, SignedOut, SignInButton, SignUpButton, useAsgardeo } from '@asgardeo/react'
import axios from 'axios'
import { useUser } from './context/UserContext'
import Header from './components/Header'
import Footer from './components/Footer'
import RoleSelect from './pages/RoleSelect'
import RiderOnboarding from './pages/onboarding/RiderOnboarding'
import DriverOnboarding from './pages/onboarding/DriverOnboarding'
import RiderDashboard from './pages/rider/RiderDashboard'
import RequestRide from './pages/rider/RequestRide'
import PendingRides from './pages/rider/PendingRides'
import CompletedRides from './pages/rider/CompletedRides'
import RiderProfile from './pages/rider/RiderProfile'
import DriverDashboard from './pages/driver/DriverDashboard'
import AvailableRides from './pages/driver/AvailableRides'
import MyRides from './pages/driver/MyRides'
import DriverProfile from './pages/driver/DriverProfile'

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined || '').trim() || 'http://localhost:5001'

export default function App() {
  const { role, setUser, clearUser } = useUser()
  const { isSignedIn, isLoading, user, getAccessToken } = useAsgardeo()

  // true while we are querying the DB to check if this Asgardeo user already has an account
  const [checking, setChecking] = useState(false)

  // Attach the Asgardeo access token to every axios request while signed in
  useEffect(() => {
    if (!isSignedIn) return
    const id = axios.interceptors.request.use(async (config) => {
      try {
        const token = await getAccessToken()
        if (token) config.headers.Authorization = `Bearer ${token}`
      } catch { /* session expired — request proceeds without token, backend returns 401 */ }
      return config
    })
    return () => axios.interceptors.request.eject(id)
  }, [isSignedIn, getAccessToken])

  // When the user signs out, wipe their role/id from context so the next sign-in starts fresh
  useEffect(() => {
    if (!isSignedIn && !isLoading) clearUser()
  }, [isSignedIn, isLoading, clearUser])

  // After sign-in, check whether this email already exists as a rider or driver.
  // If yes, restore their session and skip onboarding entirely.
  useEffect(() => {
    const u = user as { email?: string; username?: string; preferred_username?: string } | null
    const email = u?.email || u?.username || u?.preferred_username
    if (!isSignedIn || isLoading || role || !email) return

    const lookup = async () => {
      setChecking(true)
      const [riderRes, driverRes] = await Promise.allSettled([
        axios.get(`${API_BASE}/riders/lookup?email=${encodeURIComponent(email)}`),
        axios.get(`${API_BASE}/drivers/lookup?email=${encodeURIComponent(email)}`),
      ])
      if (riderRes.status === 'fulfilled') {
        const r = riderRes.value.data as { riderId: number; firstName: string; lastName: string }
        setUser('rider', r.riderId, `${r.firstName} ${r.lastName}`)
      } else if (driverRes.status === 'fulfilled') {
        const d = driverRes.value.data as { driverId: number; firstName: string; lastName: string }
        setUser('driver', d.driverId, `${d.firstName} ${d.lastName}`)
      }
      // If neither found, role stays null → RoleSelect is shown
      setChecking(false)
    }
    lookup()
  }, [isSignedIn, isLoading, user, role, setUser])

  // Show a spinner while Asgardeo initialises or while we check the DB —
  // prevents a flash of the landing page or RoleSelect before we know the user's state
  if (isLoading || checking) {
    return (
      <div className="min-h-screen bg-[#08101e] flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading…</p>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#08101e] flex flex-col">
        <Header />

        <main className="flex-1">
          <SignedIn>
            <Routes>
              {/* Index: redirect to dashboard if role set, otherwise pick a role */}
              <Route index element={
                role === 'rider'  ? <Navigate to="/rider/dashboard"  replace /> :
                role === 'driver' ? <Navigate to="/driver/dashboard" replace /> :
                <RoleSelect />
              } />

              {/* Onboarding — shown once after role is chosen for the first time */}
              <Route path="onboarding/rider"  element={<RiderOnboarding />} />
              <Route path="onboarding/driver" element={<DriverOnboarding />} />

              {/* Rider routes */}
              <Route path="rider/dashboard" element={<RiderDashboard />} />
              <Route path="rider/request"   element={<RequestRide />} />
              <Route path="rider/pending"   element={<PendingRides />} />
              <Route path="rider/completed" element={<CompletedRides />} />
              <Route path="rider/profile"   element={<RiderProfile />} />

              {/* Driver routes */}
              <Route path="driver/dashboard" element={<DriverDashboard />} />
              <Route path="driver/available" element={<AvailableRides />} />
              <Route path="driver/my-rides"  element={<MyRides />} />
              <Route path="driver/profile"   element={<DriverProfile />} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </SignedIn>

          <SignedOut>
            <div className="relative flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] px-4 text-center overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-3xl" />
              </div>
              <img src="/favicon.svg" alt="Crusin" className="w-24 h-24 mb-8 shadow-lg shadow-blue-500/30 rounded-2xl" />
              <h1 className="text-8xl font-extrabold tracking-tight mb-4 bg-gradient-to-b from-white to-blue-400 bg-clip-text text-transparent">
                Crusin
              </h1>
              <p className="text-gray-500 text-lg mb-10">Hop in. Let's roll.</p>
              <div className="flex items-center gap-4">
                <SignInButton className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-10 py-3 rounded-xl transition-colors text-base" />
                <SignUpButton className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold px-10 py-3 rounded-xl transition-colors text-base" />
              </div>
            </div>
          </SignedOut>
        </main>

        <Footer />
      </div>
    </BrowserRouter>
  )
}

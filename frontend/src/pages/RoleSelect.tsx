import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
// import { useAsgardeo } from '@asgardeo/react'
import { useUser } from '../context/UserContext'
import axios from 'axios'

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined || '').trim() || 'http://localhost:5001'

type Role = 'rider' | 'driver'

export default function RoleSelect() {
  // const { user } = useAsgardeo()
  const { setUser } = useUser()
  const navigate = useNavigate()

  const [role, setRole] = useState<Role>('rider')
  const [userId, setUserId] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleContinue = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const id = Number(userId)
    if (!id || isNaN(id)) {
      setError('Please enter a valid numeric ID.')
      setLoading(false)
      return
    }

    try {
      if (role === 'rider') {
        const res = await axios.get(`${API_BASE}/riders/${id}`)
        const rider = res.data as { riderId: number; firstName: string; lastName: string }
        setUser('rider', rider.riderId, `${rider.firstName} ${rider.lastName}`)
        navigate('/rider/dashboard')
      } else {
        const res = await axios.get(`${API_BASE}/drivers/${id}`)
        const driver = res.data as { driverId: number; firstName: string; lastName: string }
        setUser('driver', driver.driverId, `${driver.firstName} ${driver.lastName}`)
        navigate('/driver/dashboard')
      }
    } catch {
      setError(`No ${role} found with that ID. Please check and try again.`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#08101e] flex flex-col items-center justify-center px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white">Welcome to Crusin</h1>
        {/* signed-in username — re-enable when auth is on */}
        {/* {user?.username && (
          <p className="mt-2 text-gray-400">Signed in as {user.username}</p>
        )} */}
      </div>

      <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-2xl p-8">
        <h2 className="text-lg font-semibold text-white mb-1">How will you use Crusin?</h2>
        <p className="text-sm text-gray-400 mb-6">Select your role to continue.</p>

        {/* Role toggle */}
        <div className="flex rounded-xl bg-white/5 p-1 mb-6">
          {(['rider', 'driver'] as Role[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => { setRole(r); setError('') }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                role === r ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {r === 'rider' ? 'Rider' : 'Driver'}
            </button>
          ))}
        </div>

        <form onSubmit={handleContinue} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">
              Your {role === 'rider' ? 'Rider' : 'Driver'} ID
            </label>
            <input
              type="number"
              required
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder={`Enter your ${role} ID`}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors"
          >
            {loading ? 'Loading…' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}

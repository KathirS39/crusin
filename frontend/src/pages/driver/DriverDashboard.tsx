import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useUser } from '../../context/UserContext'

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined || '').trim() || 'http://localhost:5001'

interface Ride {
  rideId: number
  driverId: number | null
  status: string
  pickupLocation: string
  dropoffLocation: string
  cost: string | null
}

export default function DriverDashboard() {
  const { userId: driverId, userName } = useUser()

  const [available, setAvailable] = useState<Ride[]>([])
  const [myRides, setMyRides] = useState<Ride[]>([])
  const [completed, setCompleted] = useState<Ride[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [availRes, completedRes] = await Promise.all([
          axios.get<Ride[]>(`${API_BASE}/rides`, { params: { status: 'requested' } }),
          driverId ? axios.get<Ride[]>(`${API_BASE}/rides/driver/${driverId}`) : Promise.resolve({ data: [] as Ride[] }),
        ])
        setAvailable(availRes.data)
        setCompleted(completedRes.data)

        if (driverId) {
          const allRes = await axios.get<Ride[]>(`${API_BASE}/rides`)
          setMyRides(
            allRes.data.filter(
              (r) =>
                r.driverId === driverId &&
                ['accepted', 'in_progress'].includes(r.status)
            )
          )
        }
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }
    void fetchData()
  }, [driverId])

  const totalEarnings = completed
    .reduce((sum, r) => sum + (r.cost ? parseFloat(r.cost) : 0), 0)
    .toFixed(2)

  const stats = [
    { label: 'Available Rides', value: available.length },
    { label: 'My Active Rides', value: myRides.length },
    { label: 'Completed', value: completed.length },
    { label: 'Total Earnings', value: `$${totalEarnings}`, green: true },
  ]

  const quickActions = [
    { to: '/driver/available', label: 'Available Rides', description: 'Browse and accept rides', icon: '🗺️' },
    { to: '/driver/my-rides', label: 'My Rides', description: 'Manage active trips', icon: '🚗' },
    { to: '/driver/profile', label: 'My Profile', description: 'Update your vehicle info', icon: '👤' },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <p className="text-blue-400 text-sm font-medium uppercase tracking-widest mb-1">Driver Dashboard</p>
        <h1 className="text-3xl font-bold text-white">Welcome back, {userName?.split(' ')[0] ?? 'Driver'}</h1>
        <p className="text-gray-400 mt-1">Ready to drive? Here's what's waiting.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
            <p className={`text-3xl font-bold ${stat.green ? 'text-green-400' : 'text-white'}`}>
              {loading ? '—' : stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {quickActions.map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className="group bg-white/5 border border-white/10 hover:border-blue-500/50 hover:bg-blue-600/5 rounded-2xl p-5 transition-colors"
          >
            <span className="text-2xl">{action.icon}</span>
            <h3 className="text-white font-semibold mt-3 mb-1">{action.label}</h3>
            <p className="text-gray-400 text-sm">{action.description}</p>
          </Link>
        ))}
      </div>

      {/* Available rides preview */}
      {available.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Available Rides</h2>
            <Link to="/driver/available" className="text-blue-400 text-sm hover:text-blue-300">
              See all {available.length}
            </Link>
          </div>
          <div className="space-y-3">
            {available.slice(0, 3).map((ride) => (
              <div
                key={ride.rideId}
                className="flex items-center justify-between gap-4 py-3 border-t border-white/5"
              >
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    {ride.pickupLocation} → {ride.dropoffLocation}
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">Ride #{ride.rideId}</p>
                </div>
                {ride.cost && (
                  <span className="text-green-400 text-sm font-semibold shrink-0">${ride.cost}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

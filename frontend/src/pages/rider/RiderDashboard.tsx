import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useUser } from '../../context/UserContext'

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined || '').trim() || 'http://localhost:5001'

interface Ride {
  rideId: number
  status: string
  pickupLocation: string
  dropoffLocation: string
  cost: string | null
}

export default function RiderDashboard() {
  const { userId: riderId, userName } = useUser()

  const [rides, setRides] = useState<Ride[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!riderId) return
    axios
      .get<Ride[]>(`${API_BASE}/rides/rider/${riderId}`)
      .then((res) => setRides(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [riderId])

  const pending = rides.filter((r) => ['requested', 'accepted', 'in_progress'].includes(r.status))
  const completed = rides.filter((r) => r.status === 'completed')

  const stats = [
    { label: 'Total Rides', value: rides.length },
    { label: 'Pending', value: pending.length },
    { label: 'Completed', value: completed.length },
  ]

  const quickActions = [
    { to: '/rider/request', label: 'Request a Ride', description: 'Book a new ride', icon: '🚗' },
    { to: '/rider/pending', label: 'Pending Rides', description: 'Track your active rides', icon: '⏳' },
    { to: '/rider/completed', label: 'Ride History', description: 'View past trips', icon: '📋' },
    { to: '/rider/profile', label: 'My Profile', description: 'Update your info', icon: '👤' },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <p className="text-blue-400 text-sm font-medium uppercase tracking-widest mb-1">Rider Dashboard</p>
        <h1 className="text-3xl font-bold text-white">Welcome back, {userName?.split(' ')[0] ?? 'Rider'}</h1>
        <p className="text-gray-400 mt-1">Here's an overview of your rides.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white/5 border border-white/10 rounded-2xl p-5"
          >
            <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
            <p className="text-3xl font-bold text-white">
              {loading ? '—' : stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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

      {/* Recent rides */}
      {rides.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Recent Rides</h2>
            <Link to="/rider/pending" className="text-blue-400 text-sm hover:text-blue-300">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {rides.slice(-3).reverse().map((ride) => (
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
                <div className="flex items-center gap-3 shrink-0">
                  {ride.cost && (
                    <span className="text-white text-sm font-medium">${ride.cost}</span>
                  )}
                  <StatusBadge status={ride.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    requested: 'bg-yellow-500/15 text-yellow-400',
    accepted: 'bg-blue-500/15 text-blue-400',
    in_progress: 'bg-blue-500/15 text-blue-400',
    completed: 'bg-green-500/15 text-green-400',
    cancelled: 'bg-red-500/15 text-red-400',
  }
  const labels: Record<string, string> = {
    requested: 'Requested',
    accepted: 'Accepted',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
  }
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${styles[status] ?? 'bg-white/10 text-gray-400'}`}>
      {labels[status] ?? status}
    </span>
  )
}

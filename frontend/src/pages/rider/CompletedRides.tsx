import { useEffect, useState } from 'react'
import axios from 'axios'
import { useUser } from '../../context/UserContext'

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined || '').trim() || 'http://localhost:5001'

interface Ride {
  rideId: number
  pickupLocation: string
  dropoffLocation: string
  status: string
  cost: string | null
  driver?: { driverId: number; firstName: string; lastName: string }
}

export default function CompletedRides() {
  const { userId: riderId } = useUser()

  const [rides, setRides] = useState<Ride[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!riderId) return
    axios
      .get<Ride[]>(`${API_BASE}/rides/rider/${riderId}`)
      .then((res) => {
        setRides(res.data.filter((r) => r.status === 'completed'))
      })
      .catch(() => setError('Failed to load ride history.'))
      .finally(() => setLoading(false))
  }, [riderId])

  const total = rides.reduce((sum, r) => sum + (r.cost ? parseFloat(r.cost) : 0), 0)

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <p className="text-blue-400 text-sm font-medium uppercase tracking-widest mb-1">Rider</p>
        <h1 className="text-3xl font-bold text-white">Ride History</h1>
        <p className="text-gray-400 mt-1">All your completed trips.</p>
      </div>

      {rides.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <p className="text-gray-400 text-sm mb-1">Completed Rides</p>
            <p className="text-3xl font-bold text-white">{rides.length}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <p className="text-gray-400 text-sm mb-1">Total Spent</p>
            <p className="text-3xl font-bold text-white">${total.toFixed(2)}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-gray-400 text-sm">Loading…</div>
      ) : rides.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
          <p className="text-gray-400">No completed rides yet.</p>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-white/10 bg-white/5">
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wide">ID</span>
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wide">Pickup</span>
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wide">Dropoff</span>
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wide">Cost</span>
          </div>

          {rides.map((ride) => (
            <div
              key={ride.rideId}
              className="grid grid-cols-[auto_1fr_1fr_auto] gap-4 px-5 py-4 border-t border-white/5 items-start"
            >
              <span className="text-gray-500 text-sm font-mono">#{ride.rideId}</span>
              <div>
                <p className="text-white text-sm">{ride.pickupLocation}</p>
                {ride.driver && (
                  <p className="text-gray-500 text-xs mt-0.5">
                    {ride.driver.firstName} {ride.driver.lastName}
                  </p>
                )}
              </div>
              <p className="text-white text-sm">{ride.dropoffLocation}</p>
              <span className="text-green-400 text-sm font-semibold">
                {ride.cost ? `$${ride.cost}` : '—'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

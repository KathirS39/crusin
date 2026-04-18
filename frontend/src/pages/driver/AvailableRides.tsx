import { useEffect, useState } from 'react'
import axios from 'axios'
import { useUser } from '../../context/UserContext'

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined || '').trim() || 'http://localhost:5001'

interface Ride {
  rideId: number
  riderId: number | null
  pickupLocation: string
  dropoffLocation: string
  status: string
  cost: string | null
  rider?: { riderId: number; firstName: string; lastName: string }
}

export default function AvailableRides() {
  const { userId: driverId } = useUser()

  const [rides, setRides] = useState<Ride[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [accepting, setAccepting] = useState<number | null>(null)

  const fetchRides = () => {
    setLoading(true)
    axios
      .get<Ride[]>(`${API_BASE}/rides`, { params: { status: 'requested' } })
      .then((res) => setRides(res.data))
      .catch(() => setError('Failed to load available rides.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchRides() }, [])

  const acceptRide = async (rideId: number) => {
    setAccepting(rideId)
    try {
      await axios.put(`${API_BASE}/rides/${rideId}/accept`, { driverId })
      fetchRides()
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || err.message)
      } else {
        setError('Failed to accept ride.')
      }
    } finally {
      setAccepting(null)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-blue-400 text-sm font-medium uppercase tracking-widest mb-1">Driver</p>
          <h1 className="text-3xl font-bold text-white">Available Rides</h1>
          <p className="text-gray-400 mt-1">Ride requests waiting for a driver.</p>
        </div>
        <button
          onClick={fetchRides}
          className="shrink-0 mt-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm px-4 py-2 rounded-xl transition-colors"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-gray-400 text-sm">Loading…</div>
      ) : rides.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
          <p className="text-gray-400">No rides available right now.</p>
          <button
            onClick={fetchRides}
            className="mt-3 text-blue-400 text-sm hover:text-blue-300"
          >
            Check again
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {rides.map((ride) => (
            <div
              key={ride.rideId}
              className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-gray-500 text-xs font-mono">#{ride.rideId}</span>
                  <span className="bg-yellow-500/15 text-yellow-400 text-xs font-medium px-2.5 py-1 rounded-full">
                    Requested
                  </span>
                </div>
                <p className="text-white font-medium text-sm">{ride.pickupLocation}</p>
                <p className="text-gray-400 text-sm mt-0.5">→ {ride.dropoffLocation}</p>
                {ride.rider && (
                  <p className="text-gray-500 text-xs mt-2">
                    Rider: {ride.rider.firstName} {ride.rider.lastName}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {ride.cost && (
                  <span className="text-green-400 font-semibold">${ride.cost}</span>
                )}
                <button
                  onClick={() => void acceptRide(ride.rideId)}
                  disabled={accepting === ride.rideId}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-sm px-5 py-2 rounded-xl transition-colors"
                >
                  {accepting === ride.rideId ? 'Accepting…' : 'Accept'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

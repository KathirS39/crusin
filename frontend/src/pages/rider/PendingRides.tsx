import { useEffect, useState } from 'react'
import axios from 'axios'
import { useUser } from '../../context/UserContext'

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined || '').trim() || 'http://localhost:5001'

interface Ride {
  rideId: number
  riderId: number | null
  driverId: number | null
  pickupLocation: string
  dropoffLocation: string
  status: string
  cost: string | null
  driver?: { driverId: number; firstName: string; lastName: string }
}

export default function PendingRides() {
  const { userId: riderId } = useUser()

  const [rides, setRides] = useState<Ride[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Edit state
  const [editId, setEditId] = useState<number | null>(null)
  const [editPickup, setEditPickup] = useState('')
  const [editDropoff, setEditDropoff] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchRides = () => {
    if (!riderId) return
    setLoading(true)
    axios
      .get<Ride[]>(`${API_BASE}/rides/rider/${riderId}`)
      .then((res) => {
        const active = res.data.filter((r) =>
          ['requested', 'accepted', 'in_progress'].includes(r.status)
        )
        setRides(active)
      })
      .catch(() => setError('Failed to load rides.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchRides() }, [riderId])

  const startEdit = (ride: Ride) => {
    setEditId(ride.rideId)
    setEditPickup(ride.pickupLocation)
    setEditDropoff(ride.dropoffLocation)
  }

  const saveEdit = async (rideId: number) => {
    setSaving(true)
    try {
      await axios.put(`${API_BASE}/rides/${rideId}`, {
        pickupLocation: editPickup,
        dropoffLocation: editDropoff,
      })
      setEditId(null)
      fetchRides()
    } catch {
      setError('Failed to update ride.')
    } finally {
      setSaving(false)
    }
  }

  const cancelRide = async (rideId: number) => {
    try {
      await axios.put(`${API_BASE}/rides/${rideId}`, { status: 'cancelled' })
      fetchRides()
    } catch {
      setError('Failed to cancel ride.')
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <p className="text-blue-400 text-sm font-medium uppercase tracking-widest mb-1">Rider</p>
        <h1 className="text-3xl font-bold text-white">Pending Rides</h1>
        <p className="text-gray-400 mt-1">Your active and upcoming rides.</p>
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
          <p className="text-gray-400">No pending rides.</p>
          <a href="/rider/request" className="mt-3 inline-block text-blue-400 text-sm hover:text-blue-300">
            Request a ride →
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {rides.map((ride) => (
            <div key={ride.rideId} className="bg-white/5 border border-white/10 rounded-2xl p-5">
              {editId === ride.rideId ? (
                /* Edit form */
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Pickup</label>
                    <input
                      value={editPickup}
                      onChange={(e) => setEditPickup(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Dropoff</label>
                    <input
                      value={editDropoff}
                      onChange={(e) => setEditDropoff(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => void saveEdit(ride.rideId)}
                      disabled={saving}
                      className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                    >
                      {saving ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      onClick={() => setEditId(null)}
                      className="bg-white/5 hover:bg-white/10 text-gray-300 text-sm px-4 py-2 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* Display */
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-gray-500 text-xs font-mono">#{ride.rideId}</span>
                      <StatusBadge status={ride.status} />
                    </div>
                    <p className="text-white font-medium text-sm">
                      {ride.pickupLocation}
                    </p>
                    <p className="text-gray-400 text-sm mt-0.5">
                      → {ride.dropoffLocation}
                    </p>
                    {ride.driver && (
                      <p className="text-blue-400 text-xs mt-2">
                        Driver: {ride.driver.firstName} {ride.driver.lastName}
                      </p>
                    )}
                    {ride.cost && (
                      <p className="text-gray-400 text-xs mt-1">Cost: ${ride.cost}</p>
                    )}
                  </div>

                  {/* Actions only for 'requested' rides */}
                  {ride.status === 'requested' && (
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => startEdit(ride)}
                        className="bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => void cancelRide(ride.rideId)}
                        className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-sm px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
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

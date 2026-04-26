import { useEffect, useState } from 'react'
import axios from 'axios'
import { useUser } from '../../context/UserContext'

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined || '').trim() || 'http://localhost:5001'

type RideStatus = 'requested' | 'accepted' | 'in_progress' | 'completed' | 'cancelled'

interface Ride {
  rideId: number
  riderId: number | null
  driverId: number | null
  pickupLocation: string
  dropoffLocation: string
  status: RideStatus
  cost: string | null
  rider?: { riderId: number; firstName: string; lastName: string }
}

export default function MyRides() {
  const { userId: driverId } = useUser()

  const [activeRides, setActiveRides] = useState<Ride[]>([])
  const [completedRides, setCompletedRides] = useState<Ride[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState<number | null>(null)

  const fetchRides = async () => {
    if (!driverId) return
    setLoading(true)
    try {
      const [allRes, completedRes] = await Promise.all([
        axios.get<Ride[]>(`${API_BASE}/rides`),
        axios.get<Ride[]>(`${API_BASE}/rides/driver/${driverId}`),
      ])
      setActiveRides(
        allRes.data.filter(
          (r) =>
            r.driverId === driverId &&
            ['accepted', 'in_progress'].includes(r.status)
        )
      )
      setCompletedRides(completedRes.data)
    } catch {
      setError('Failed to load rides.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void fetchRides() }, [driverId])

  const updateStatus = async (rideId: number, status: RideStatus) => {
    setUpdating(rideId)
    try {
      await axios.put(`${API_BASE}/rides/${rideId}/status`, { status })
      await fetchRides()
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || err.message)
      } else {
        setError('Failed to update status.')
      }
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <p className="text-blue-400 text-sm font-medium uppercase tracking-widest mb-1">Driver</p>
        <h1 className="text-3xl font-bold text-white">My Rides</h1>
        <p className="text-gray-400 mt-1">Manage your active and completed trips.</p>
      </div>

      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-gray-400 text-sm">Loading…</div>
      ) : (
        <>
          {/* Active rides */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-white mb-4">
              Active Rides
              {activeRides.length > 0 && (
                <span className="ml-2 text-sm font-normal text-blue-400">{activeRides.length}</span>
              )}
            </h2>

            {activeRides.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                <p className="text-gray-400 text-sm">No active rides. Go to Available Rides to accept one.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeRides.map((ride) => (
                  <div
                    key={ride.rideId}
                    className="bg-white/5 border border-white/10 rounded-2xl p-5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-gray-500 text-xs font-mono">#{ride.rideId}</span>
                          <StatusBadge status={ride.status} />
                        </div>
                        <p className="text-white font-medium text-sm">{ride.pickupLocation}</p>
                        <p className="text-gray-400 text-sm mt-0.5">→ {ride.dropoffLocation}</p>
                        {ride.rider && (
                          <p className="text-gray-500 text-xs mt-2">
                            Rider: {ride.rider.firstName} {ride.rider.lastName}
                          </p>
                        )}
                        {ride.cost && (
                          <p className="text-green-400 text-sm font-semibold mt-1">${ride.cost}</p>
                        )}
                      </div>

                      <div className="flex gap-2 shrink-0">
                        {ride.status === 'accepted' && (
                          <button
                            onClick={() => void updateStatus(ride.rideId, 'in_progress')}
                            disabled={updating === ride.rideId}
                            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
                          >
                            {updating === ride.rideId ? '…' : 'Start Ride'}
                          </button>
                        )}
                        {ride.status === 'in_progress' && (
                          <button
                            onClick={() => void updateStatus(ride.rideId, 'completed')}
                            disabled={updating === ride.rideId}
                            className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
                          >
                            {updating === ride.rideId ? '…' : 'Complete'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Completed rides */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">
                Completed Rides
                {completedRides.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-gray-400">{completedRides.length}</span>
                )}
              </h2>
              {completedRides.length > 0 && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2 flex items-center gap-2">
                  <span className="text-green-400 text-sm">Total Earnings</span>
                  <span className="text-green-400 font-bold text-lg">
                    ${completedRides.reduce((sum, r) => sum + (r.cost ? parseFloat(r.cost) : 0), 0).toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {completedRides.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                <p className="text-gray-400 text-sm">No completed rides yet.</p>
              </div>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-white/10 bg-white/5">
                  <span className="text-gray-400 text-xs font-semibold uppercase tracking-wide">ID</span>
                  <span className="text-gray-400 text-xs font-semibold uppercase tracking-wide">Pickup</span>
                  <span className="text-gray-400 text-xs font-semibold uppercase tracking-wide">Dropoff</span>
                  <span className="text-gray-400 text-xs font-semibold uppercase tracking-wide">Cost</span>
                </div>
                {completedRides.map((ride) => (
                  <div
                    key={ride.rideId}
                    className="grid grid-cols-[auto_1fr_1fr_auto] gap-4 px-5 py-4 border-t border-white/5 items-start"
                  >
                    <span className="text-gray-500 text-sm font-mono">#{ride.rideId}</span>
                    <div>
                      <p className="text-white text-sm">{ride.pickupLocation}</p>
                      {ride.rider && (
                        <p className="text-gray-500 text-xs mt-0.5">
                          {ride.rider.firstName} {ride.rider.lastName}
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
          </section>
        </>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    accepted: 'bg-blue-500/15 text-blue-400',
    in_progress: 'bg-yellow-500/15 text-yellow-400',
    completed: 'bg-green-500/15 text-green-400',
  }
  const labels: Record<string, string> = {
    accepted: 'Accepted',
    in_progress: 'In Progress',
    completed: 'Completed',
  }
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${styles[status] ?? 'bg-white/10 text-gray-400'}`}>
      {labels[status] ?? status}
    </span>
  )
}

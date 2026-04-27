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
  ratingGiven: number | null
  driver?: { driverId: number; firstName: string; lastName: string }
}

function StarRating({
  value,
  onChange,
  readonly = false,
}: {
  value: number
  onChange?: (v: number) => void
  readonly?: boolean
}) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={`text-2xl leading-none transition-all duration-100 ${
            star <= (hovered || value)
              ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.7)]'
              : 'text-gray-700'
          } ${!readonly ? 'hover:scale-125 cursor-pointer' : 'cursor-default'}`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

export default function CompletedRides() {
  const { userId: riderId } = useUser()

  const [rides, setRides] = useState<Ride[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pending, setPending] = useState<Record<number, number>>({})
  const [submitting, setSubmitting] = useState<Record<number, boolean>>({})
  const [ratingError, setRatingError] = useState<Record<number, string>>({})

  useEffect(() => {
    if (!riderId) return
    axios
      .get<Ride[]>(`${API_BASE}/rides/rider/${riderId}`)
      .then((res) => setRides(res.data.filter((r) => r.status === 'completed')))
      .catch(() => setError('Failed to load ride history.'))
      .finally(() => setLoading(false))
  }, [riderId])

  const total = rides.reduce((sum, r) => sum + (r.cost ? parseFloat(r.cost) : 0), 0)

  const submitRating = async (rideId: number) => {
    const rating = pending[rideId]
    if (!rating) return
    setSubmitting((s) => ({ ...s, [rideId]: true }))
    setRatingError((e) => ({ ...e, [rideId]: '' }))
    try {
      await axios.put(`${API_BASE}/rides/${rideId}/rate`, { rating })
      setRides((prev) =>
        prev.map((r) => (r.rideId === rideId ? { ...r, ratingGiven: rating } : r))
      )
      setPending((p) => { const next = { ...p }; delete next[rideId]; return next })
    } catch {
      setRatingError((e) => ({ ...e, [rideId]: 'Failed to submit. Try again.' }))
    } finally {
      setSubmitting((s) => ({ ...s, [rideId]: false }))
    }
  }

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
        <div className="space-y-4">
          {rides.map((ride) => (
            <div
              key={ride.rideId}
              className="bg-white/5 border border-white/10 rounded-2xl p-5 transition-colors hover:bg-white/[0.07]"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-gray-500 text-xs font-mono">#{ride.rideId}</span>
                    {ride.driver && (
                      <span className="text-gray-500 text-xs">
                        · {ride.driver.firstName} {ride.driver.lastName}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-white truncate">{ride.pickupLocation}</span>
                    <span className="text-gray-600 flex-shrink-0">→</span>
                    <span className="text-white truncate">{ride.dropoffLocation}</span>
                  </div>
                </div>
                <span className="text-green-400 font-semibold text-sm flex-shrink-0">
                  {ride.cost ? `$${ride.cost}` : '—'}
                </span>
              </div>

              <div className="border-t border-white/5 pt-4">
                {ride.ratingGiven ? (
                  <div className="flex items-center gap-3">
                    <StarRating value={ride.ratingGiven} readonly />
                    <span className="text-gray-500 text-xs">You rated this ride</span>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-widest font-medium mb-2">
                      Rate your driver
                    </p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <StarRating
                        value={pending[ride.rideId] ?? 0}
                        onChange={(v) => setPending((p) => ({ ...p, [ride.rideId]: v }))}
                      />
                      {pending[ride.rideId] > 0 && (
                        <button
                          onClick={() => submitRating(ride.rideId)}
                          disabled={submitting[ride.rideId]}
                          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors"
                        >
                          {submitting[ride.rideId] ? 'Submitting…' : 'Submit'}
                        </button>
                      )}
                    </div>
                    {ratingError[ride.rideId] && (
                      <p className="text-red-400 text-xs mt-2">{ratingError[ride.rideId]}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

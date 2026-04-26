import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useUser } from '../../context/UserContext'

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined || '').trim() || 'http://localhost:5001'

function calcCost(pickup: string, dropoff: string): number {
  const base = 5
  const distance = Math.abs(pickup.length - dropoff.length) + (pickup.length + dropoff.length) / 4
  return Math.round((base + distance * 0.5) * 100) / 100
}

interface Suggestion {
  name: string
  category: string
  description: string
}

export default function RequestRide() {
  const { userId: riderId } = useUser()
  const navigate = useNavigate()

  const [pickup, setPickup] = useState('')
  const [dropoff, setDropoff] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null)
  const [destination, setDestination] = useState('')
  const [loadingRecs, setLoadingRecs] = useState(false)

  const estimatedCost = pickup && dropoff ? calcCost(pickup, dropoff) : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const trimmedPickup  = pickup.trim()
    const trimmedDropoff = dropoff.trim()
    if (!trimmedPickup)  { setError('Pickup location cannot be empty.'); return }
    if (!trimmedDropoff) { setError('Dropoff location cannot be empty.'); return }

    setLoading(true)

    try {
      const rideRes = await axios.post(`${API_BASE}/rides`, {
        riderId,
        pickupLocation: trimmedPickup,
        dropoffLocation: trimmedDropoff,
        status: 'requested',
        cost: estimatedCost,
      })

      const rideId = (rideRes.data as { rideId: number }).rideId
      setDestination(trimmedDropoff)

      // Fetch AI recommendations
      setLoadingRecs(true)
      try {
        const recRes = await axios.post(`${API_BASE}/recommendations`, { rideId })
        setSuggestions((recRes.data as { suggestions: Suggestion[] }).suggestions)
      } catch (recErr) {
        const msg = axios.isAxiosError(recErr)
          ? recErr.response?.data?.error || recErr.message
          : 'Unknown error'
        console.error('Recommendations failed:', msg)
        setSuggestions([])
      } finally {
        setLoadingRecs(false)
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || err.message)
      } else {
        setError('Failed to request ride. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Success screen with recommendations
  if (suggestions !== null || loadingRecs) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <div className="w-14 h-14 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✓</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Ride Requested!</h1>
          <p className="text-gray-400 mt-1">Your driver is being matched. Heading to <span className="text-white">{destination}</span>?</p>
        </div>

        <div className="mb-6">
          <p className="text-blue-400 text-sm font-medium uppercase tracking-widest mb-3">Nearby Spots</p>
          {loadingRecs ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 animate-pulse">
                  <div className="h-3 bg-white/10 rounded mb-3 w-2/3" />
                  <div className="h-2 bg-white/10 rounded mb-2" />
                  <div className="h-2 bg-white/10 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : suggestions && suggestions.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {suggestions.map((s, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                  <span className="inline-block bg-blue-500/15 text-blue-400 text-xs font-medium px-2.5 py-1 rounded-full mb-3">
                    {s.category}
                  </span>
                  <h3 className="text-white font-semibold text-sm mb-1">{s.name}</h3>
                  <p className="text-gray-400 text-xs leading-relaxed">{s.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No recommendations available right now.</p>
          )}
        </div>

        <button
          onClick={() => navigate('/rider/pending')}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          View My Rides →
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="mb-8">
        <p className="text-blue-400 text-sm font-medium uppercase tracking-widest mb-1">Rider</p>
        <h1 className="text-3xl font-bold text-white">Request a Ride</h1>
        <p className="text-gray-400 mt-1">Enter your pickup and dropoff locations.</p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Pickup Location</label>
            <input
              type="text"
              required
              value={pickup}
              onChange={(e) => setPickup(e.target.value)}
              placeholder="e.g. 2108 Speedway, Austin TX"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Dropoff Location</label>
            <input
              type="text"
              required
              value={dropoff}
              onChange={(e) => setDropoff(e.target.value)}
              placeholder="e.g. Austin–Bergstrom Airport"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {estimatedCost !== null && (
            <div className="bg-blue-600/10 border border-blue-500/20 rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-blue-300 text-sm">Estimated cost</span>
              <span className="text-white font-bold text-lg">${estimatedCost}</span>
            </div>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? 'Requesting…' : 'Confirm Ride Request'}
          </button>
        </form>
      </div>
    </div>
  )
}

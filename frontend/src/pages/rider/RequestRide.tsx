import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useUser } from '../../context/UserContext'

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined || '').trim() || 'http://localhost:5001'

interface NominatimResult {
  display_name: string
  lat: string
  lon: string
}

interface AISuggestion {
  name: string
  category: string
  description: string
}

function LocationInput({ label, value, onChange, placeholder }: {
  label: string
  value: string
  onChange: (val: string) => void
  placeholder: string
}) {
  const [results, setResults] = useState<NominatimResult[]>([])
  const [open, setOpen] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    onChange(val)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (val.length < 3) { setResults([]); setOpen(false); return }
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val)}&format=json&limit=5`
        )
        const data: NominatimResult[] = await res.json()
        setResults(data)
        setOpen(data.length > 0)
      } catch { /* ignore network errors */ }
    }, 400)
  }

  const select = (name: string) => {
    onChange(name)
    setResults([])
    setOpen(false)
  }

  return (
    <div className="relative">
      <label className="block text-sm text-gray-400 mb-1.5">{label}</label>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder={placeholder}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      />
      {open && (
        <ul className="absolute z-50 w-full mt-1 bg-[#0f1c2e] border border-white/10 rounded-xl overflow-hidden shadow-xl">
          {results.map((r, i) => (
            <li
              key={i}
              onMouseDown={() => select(r.display_name)}
              className="px-4 py-3 text-sm text-gray-300 hover:bg-white/10 cursor-pointer border-t border-white/5 first:border-t-0 truncate"
            >
              {r.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function RequestRide() {
  const { userId: riderId } = useUser()
  const navigate = useNavigate()

  const [pickup, setPickup]   = useState('')
  const [dropoff, setDropoff] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const [suggestions, setSuggestions]     = useState<AISuggestion[] | null>(null)
  const [destination, setDestination]     = useState('')
  const [actualCost, setActualCost]       = useState<string | null>(null)
  const [loadingRecs, setLoadingRecs]     = useState(false)

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
      })

      const ride = rideRes.data as { rideId: number; cost: string | null }
      setDestination(trimmedDropoff)
      setActualCost(ride.cost)

      setLoadingRecs(true)
      try {
        const recRes = await axios.post(`${API_BASE}/recommendations`, { rideId: ride.rideId })
        setSuggestions((recRes.data as { suggestions: AISuggestion[] }).suggestions)
      } catch (recErr) {
        console.error('Recommendations failed:', axios.isAxiosError(recErr)
          ? recErr.response?.data?.error || recErr.message
          : recErr)
        setSuggestions([])
      } finally {
        setLoadingRecs(false)
      }
    } catch (err) {
      setError(axios.isAxiosError(err)
        ? err.response?.data?.error || err.message
        : 'Failed to request ride. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Success screen ────────────────────────────────────────────────────────
  if (suggestions !== null || loadingRecs) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <div className="w-14 h-14 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✓</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Ride Requested!</h1>
          <p className="text-gray-400 mt-1">
            Heading to <span className="text-white">{destination}</span>
          </p>
          {actualCost && (
            <div className="inline-flex items-center gap-2 mt-3 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2">
              <span className="text-green-400 text-sm">Estimated fare</span>
              <span className="text-green-400 font-bold text-lg">${actualCost}</span>
            </div>
          )}
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

  // ── Request form ──────────────────────────────────────────────────────────
  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="mb-8">
        <p className="text-blue-400 text-sm font-medium uppercase tracking-widest mb-1">Rider</p>
        <h1 className="text-3xl font-bold text-white">Request a Ride</h1>
        <p className="text-gray-400 mt-1">Enter your pickup and dropoff locations.</p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <LocationInput
            label="Pickup Location"
            value={pickup}
            onChange={setPickup}
            placeholder="e.g. 2108 Speedway, Austin TX"
          />
          <LocationInput
            label="Dropoff Location"
            value={dropoff}
            onChange={setDropoff}
            placeholder="e.g. Austin–Bergstrom Airport"
          />

          <p className="text-gray-500 text-xs">
            Fare is calculated from real driving distance ($2.50 base + $1.75/mile).
          </p>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? 'Calculating route…' : 'Confirm Ride Request'}
          </button>
        </form>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useUser } from '../../context/UserContext'

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined || '').trim() || 'http://localhost:5001'

function calcCost(pickup: string, dropoff: string): number {
  // Simple deterministic cost based on string lengths — replace with real logic if needed
  const base = 5
  const distance = Math.abs(pickup.length - dropoff.length) + (pickup.length + dropoff.length) / 4
  return Math.round((base + distance * 0.5) * 100) / 100
}

export default function RequestRide() {
  const { userId: riderId } = useUser()
  const navigate = useNavigate()

  const [pickup, setPickup] = useState('')
  const [dropoff, setDropoff] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const estimatedCost = pickup && dropoff ? calcCost(pickup, dropoff) : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await axios.post(`${API_BASE}/rides`, {
        riderId,
        pickupLocation: pickup,
        dropoffLocation: dropoff,
        status: 'requested',
        cost: estimatedCost,
      })
      navigate('/rider/pending')
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

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="mb-8">
        <p className="text-blue-400 text-sm font-medium uppercase tracking-widest mb-1">Rider</p>
        <h1 className="text-3xl font-bold text-white">Request a Ride</h1>
        <p className="text-gray-400 mt-1">Enter your pickup and dropoff locations.</p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
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

          {/* Cost estimate */}
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

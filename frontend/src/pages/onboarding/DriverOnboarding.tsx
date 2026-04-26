import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAsgardeo } from '@asgardeo/react'
import axios from 'axios'
import { useUser } from '../../context/UserContext'

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined || '').trim() || 'http://localhost:5001'

export default function DriverOnboarding() {
  const navigate = useNavigate()
  const { user } = useAsgardeo()
  const { setUser } = useUser()

  const [form, setForm] = useState({
    firstName:    '',
    lastName:     '',
    email:        '',
    carMake:      '',
    carModel:     '',
    carColor:     '',
    licensePlate: '',
  })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  // Sync Asgardeo profile fields once the user object is available.
  // Asgardeo may expose email as `email`, `username`, or `preferred_username`.
  useEffect(() => {
    const u = user as { email?: string; username?: string; preferred_username?: string; given_name?: string; family_name?: string } | null
    if (!u) return
    const resolvedEmail = u.email || u.username || u.preferred_username || ''
    setForm(prev => ({
      ...prev,
      firstName: prev.firstName || u.given_name  || '',
      lastName:  prev.lastName  || u.family_name || '',
      email:     prev.email     || resolvedEmail,
    }))
  }, [user])

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await axios.post(`${API_BASE}/drivers`, form)
      const driver = res.data as { driverId: number; firstName: string; lastName: string }
      setUser('driver', driver.driverId, `${driver.firstName} ${driver.lastName}`)
      navigate('/driver/dashboard', { replace: true })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg ?? 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
  const labelClass = 'block text-sm text-gray-400 mb-1.5'

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#08101e] flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="w-14 h-14 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🚗</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Set up your driver profile</h1>
          <p className="mt-1 text-sm text-gray-400">Tell us about yourself and your vehicle.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-5">
          {/* Personal info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>First name</label>
              <input required value={form.firstName} onChange={set('firstName')} className={inputClass} placeholder="James" />
            </div>
            <div>
              <label className={labelClass}>Last name</label>
              <input required value={form.lastName} onChange={set('lastName')} className={inputClass} placeholder="Brown" />
            </div>
          </div>

          <div>
            <label className={labelClass}>Email</label>
            <input required type="email" value={form.email} onChange={set('email')} className={inputClass} />
          </div>

          {/* Vehicle info */}
          <div className="pt-2 border-t border-white/10">
            <p className="text-sm font-medium text-white mb-4">Vehicle information</p>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Make</label>
                  <input required value={form.carMake} onChange={set('carMake')} className={inputClass} placeholder="Toyota" />
                </div>
                <div>
                  <label className={labelClass}>Model</label>
                  <input required value={form.carModel} onChange={set('carModel')} className={inputClass} placeholder="Camry" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Color</label>
                  <input required value={form.carColor} onChange={set('carColor')} className={inputClass} placeholder="Silver" />
                </div>
                <div>
                  <label className={labelClass}>License plate</label>
                  <input required value={form.licensePlate} onChange={set('licensePlate')} className={inputClass} placeholder="TX-AAA-001" />
                </div>
              </div>
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors mt-2"
          >
            {loading ? 'Creating account…' : 'Create driver account'}
          </button>
        </form>
      </div>
    </div>
  )
}

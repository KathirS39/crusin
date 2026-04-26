import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAsgardeo } from '@asgardeo/react'
import axios from 'axios'
import { useUser } from '../../context/UserContext'

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined || '').trim() || 'http://localhost:5001'

export default function RiderOnboarding() {
  const navigate = useNavigate()
  const { user } = useAsgardeo()
  const { setUser } = useUser()

  const [form, setForm] = useState({
    firstName:      '',
    lastName:       '',
    email:          '',
    phone:          '',
    cardNumber:     '',
    cardExpiry:     '',
    cardCvv:        '',
    billingAddress: '',
    billingCity:    '',
    billingState:   '',
    billingZip:     '',
  })
  const [error, setError]   = useState('')
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
    console.log('Submitting rider form:', form)
    try {
      const res = await axios.post(`${API_BASE}/riders`, form)
      const rider = res.data as { riderId: number; firstName: string; lastName: string }
      setUser('rider', rider.riderId, `${rider.firstName} ${rider.lastName}`)
      navigate('/rider/dashboard', { replace: true })
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { error?: string; missingFields?: string[] } } })?.response?.data
      const msg = data?.missingFields?.length
        ? `Missing fields: ${data.missingFields.join(', ')}`
        : (data?.error ?? 'Something went wrong. Please try again.')
      setError(msg)
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
            <span className="text-3xl">🙋</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Set up your rider profile</h1>
          <p className="mt-1 text-sm text-gray-400">Just a few details and you're ready to roll.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-5">
          {/* Personal info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>First name</label>
              <input required value={form.firstName} onChange={set('firstName')} className={inputClass} placeholder="Alice" />
            </div>
            <div>
              <label className={labelClass}>Last name</label>
              <input required value={form.lastName} onChange={set('lastName')} className={inputClass} placeholder="Johnson" />
            </div>
          </div>

          <div>
            <label className={labelClass}>Email</label>
            <input required type="email" value={form.email} onChange={set('email')} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Phone number</label>
            <input required value={form.phone} onChange={set('phone')} className={inputClass} placeholder="512-555-0101" />
          </div>

          {/* Payment info */}
          <div className="pt-2 border-t border-white/10">
            <p className="text-sm font-medium text-white mb-4">Payment information</p>

            <div className="space-y-4">
              <div>
                <label className={labelClass}>Card number</label>
                <input required value={form.cardNumber} onChange={set('cardNumber')} className={inputClass} placeholder="4111 1111 1111 1111" maxLength={19} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Expiry (MM/YY)</label>
                  <input required value={form.cardExpiry} onChange={set('cardExpiry')} className={inputClass} placeholder="09/27" maxLength={5} />
                </div>
                <div>
                  <label className={labelClass}>CVV</label>
                  <input required value={form.cardCvv} onChange={set('cardCvv')} className={inputClass} placeholder="123" maxLength={3} />
                </div>
              </div>

              <div>
                <label className={labelClass}>Billing address</label>
                <input required value={form.billingAddress} onChange={set('billingAddress')} className={inputClass} placeholder="2108 Speedway" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className={labelClass}>City</label>
                  <input required value={form.billingCity} onChange={set('billingCity')} className={inputClass} placeholder="Austin" />
                </div>
                <div>
                  <label className={labelClass}>State</label>
                  <input required value={form.billingState} onChange={set('billingState')} className={inputClass} placeholder="TX" maxLength={2} />
                </div>
                <div>
                  <label className={labelClass}>ZIP</label>
                  <input required value={form.billingZip} onChange={set('billingZip')} className={inputClass} placeholder="78712" maxLength={5} />
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
            {loading ? 'Creating account…' : 'Create rider account'}
          </button>
        </form>
      </div>
    </div>
  )
}

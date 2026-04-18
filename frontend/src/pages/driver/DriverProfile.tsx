import { useEffect, useState } from 'react'
import axios from 'axios'
import { useUser } from '../../context/UserContext'

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined || '').trim() || 'http://localhost:5001'

interface Driver {
  driverId: number
  firstName: string
  lastName: string
  email: string
  carMake: string
  carModel: string
  carColor: string
  licensePlate: string
  rating: string
}

export default function DriverProfile() {
  const { userId: driverId, setUser } = useUser()

  const [driver, setDriver] = useState<Driver | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editing, setEditing] = useState(false)

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    carMake: '',
    carModel: '',
    carColor: '',
    licensePlate: '',
  })

  useEffect(() => {
    if (!driverId) return
    axios
      .get<Driver>(`${API_BASE}/drivers/${driverId}`)
      .then((res) => {
        setDriver(res.data)
        setForm({
          firstName: res.data.firstName,
          lastName: res.data.lastName,
          carMake: res.data.carMake,
          carModel: res.data.carModel,
          carColor: res.data.carColor,
          licensePlate: res.data.licensePlate,
        })
      })
      .catch(() => setError('Failed to load profile.'))
      .finally(() => setLoading(false))
  }, [driverId])

  const handleSave = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const res = await axios.put<Driver>(`${API_BASE}/drivers/${driverId}`, form)
      setDriver(res.data)
      setUser('driver', driverId!, `${res.data.firstName} ${res.data.lastName}`)
      setEditing(false)
      setSuccess('Profile updated.')
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || err.message)
      } else {
        setError('Failed to update profile.')
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="max-w-xl mx-auto px-4 py-8 text-gray-400 text-sm">Loading…</div>

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="mb-8">
        <p className="text-blue-400 text-sm font-medium uppercase tracking-widest mb-1">Driver</p>
        <h1 className="text-3xl font-bold text-white">My Profile</h1>
        <p className="text-gray-400 mt-1">View and update your driver information.</p>
      </div>

      {success && (
        <div className="mb-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl px-4 py-3 text-sm">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        {!editing ? (
          <div className="space-y-1">
            <ProfileField label="First Name" value={driver?.firstName} />
            <ProfileField label="Last Name" value={driver?.lastName} />
            <ProfileField label="Email" value={driver?.email} />
            <ProfileField label="Car Make" value={driver?.carMake} />
            <ProfileField label="Car Model" value={driver?.carModel} />
            <ProfileField label="Car Color" value={driver?.carColor} />
            <ProfileField label="License Plate" value={driver?.licensePlate} />
            <ProfileField label="Rating" value={driver?.rating ? `${driver.rating} / 5.00` : undefined} />

            <button
              onClick={() => setEditing(true)}
              className="mt-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors"
            >
              Edit Profile
            </button>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">First Name</label>
                <input
                  required
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Last Name</label>
                <input
                  required
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Car Make</label>
                <input
                  required
                  value={form.carMake}
                  onChange={(e) => setForm({ ...form, carMake: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Car Model</label>
                <input
                  required
                  value={form.carModel}
                  onChange={(e) => setForm({ ...form, carModel: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Car Color</label>
                <input
                  required
                  value={form.carColor}
                  onChange={(e) => setForm({ ...form, carColor: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">License Plate</label>
                <input
                  required
                  value={form.licensePlate}
                  onChange={(e) => setForm({ ...form, licensePlate: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors"
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="bg-white/5 hover:bg-white/10 text-gray-300 font-medium px-5 py-2.5 rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

function ProfileField({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className="text-white text-sm font-medium">{value || '—'}</span>
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import './Body.css'

type RideStatus = 'requested' | 'accepted' | 'in_progress' | 'completed' | 'cancelled'

interface Rider {
  riderId: number
  firstName: string
  lastName: string
  email: string
  phone: string
}

interface Driver {
  driverId: number
  firstName: string
  lastName: string
  carMake: string
  carModel: string
  licensePlate: string
}

interface Ride {
  rideId: number
  riderId: number | null
  driverId: number | null
  pickupLocation: string
  dropoffLocation: string
  status: RideStatus
  cost: string | null
}

interface RiderForm {
  firstName: string
  lastName: string
  email: string
  password: string
  phone: string
  cardNumber: string
}

interface DriverForm {
  firstName: string
  lastName: string
  email: string
  password: string
  carMake: string
  carModel: string
  carColor: string
  licensePlate: string
  rating: string
}

interface RideForm {
  riderId: string
  driverId: string
  pickupLocation: string
  dropoffLocation: string
  status: RideStatus
  cost: string
}

const API_BASE_URL =
  ((import.meta as { env?: { VITE_API_BASE_URL?: string } }).env?.VITE_API_BASE_URL || '').trim() ||
  'http://localhost:5001'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

const emptyRiderForm: RiderForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  phone: '',
  cardNumber: '',
}

const emptyDriverForm: DriverForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  carMake: '',
  carModel: '',
  carColor: '',
  licensePlate: '',
  rating: '5.0',
}

const emptyRideForm: RideForm = {
  riderId: '',
  driverId: '',
  pickupLocation: '',
  dropoffLocation: '',
  status: 'requested',
  cost: '',
}

const Body = () => {
  const [riders, setRiders] = useState<Rider[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [rides, setRides] = useState<Ride[]>([])
  const [statusFilter, setStatusFilter] = useState<'all' | RideStatus>('all')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('Loading dashboard...')
  const [riderForm, setRiderForm] = useState<RiderForm>(emptyRiderForm)
  const [driverForm, setDriverForm] = useState<DriverForm>(emptyDriverForm)
  const [rideForm, setRideForm] = useState<RideForm>(emptyRideForm)

  const fetchAllData = async () => {
    setLoading(true)
    setError('')

    try {
      const [ridersRes, driversRes, ridesRes] = await Promise.all([
        api.get<Rider[]>('/riders'),
        api.get<Driver[]>('/drivers'),
        api.get<Ride[]>('/rides', {
          params: statusFilter === 'all' ? undefined : { status: statusFilter },
        }),
      ])

      setRiders(ridersRes.data)
      setDrivers(driversRes.data)
      setRides(ridesRes.data)
      setMessage('Live backend data loaded.')
    } catch (requestError) {
      if (axios.isAxiosError(requestError)) {
        const detail = requestError.response?.data?.detail || requestError.response?.data?.error
        setError(detail || requestError.message || 'Failed to load data')
      } else {
        setError('Failed to load data')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchAllData()
  }, [])

  useEffect(() => {
    void fetchAllData()
  }, [statusFilter])

  const stats = useMemo(() => {
    const total = rides.length
    const requested = rides.filter((ride) => ride.status === 'requested').length
    const active = rides.filter((ride) => ['accepted', 'in_progress'].includes(ride.status)).length
    const completed = rides.filter((ride) => ride.status === 'completed').length

    return [
      { label: 'Rides', value: total },
      { label: 'Requested', value: requested },
      { label: 'Active', value: active },
      { label: 'Completed', value: completed },
    ]
  }, [rides])

  const handleRiderSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    try {
      await api.post('/riders', riderForm)
      setRiderForm(emptyRiderForm)
      await fetchAllData()
      setMessage('Rider created.')
    } catch (requestError) {
      if (axios.isAxiosError(requestError)) {
        setError(requestError.response?.data?.error || requestError.message)
      }
    }
  }

  const handleDriverSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    try {
      await api.post('/drivers', driverForm)
      setDriverForm(emptyDriverForm)
      await fetchAllData()
      setMessage('Driver created.')
    } catch (requestError) {
      if (axios.isAxiosError(requestError)) {
        setError(requestError.response?.data?.error || requestError.message)
      }
    }
  }

  const handleRideSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    try {
      await api.post('/rides', {
        ...rideForm,
        riderId: Number(rideForm.riderId),
        driverId: rideForm.driverId ? Number(rideForm.driverId) : undefined,
        cost: rideForm.cost ? Number(rideForm.cost) : undefined,
      })
      setRideForm(emptyRideForm)
      await fetchAllData()
      setMessage('Ride created.')
    } catch (requestError) {
      if (axios.isAxiosError(requestError)) {
        setError(requestError.response?.data?.error || requestError.message)
      }
    }
  }

  const handleDeleteRider = async (riderId: number) => {
    try {
      await api.delete(`/riders/${riderId}`)
      await fetchAllData()
      setMessage(`Rider ${riderId} deleted.`)
    } catch (requestError) {
      if (axios.isAxiosError(requestError)) {
        setError(requestError.response?.data?.error || requestError.message)
      }
    }
  }

  const handleDeleteDriver = async (driverId: number) => {
    try {
      await api.delete(`/drivers/${driverId}`)
      await fetchAllData()
      setMessage(`Driver ${driverId} deleted.`)
    } catch (requestError) {
      if (axios.isAxiosError(requestError)) {
        setError(requestError.response?.data?.error || requestError.message)
      }
    }
  }

  const handleDeleteRide = async (rideId: number) => {
    try {
      await api.delete(`/rides/${rideId}`)
      await fetchAllData()
      setMessage(`Ride ${rideId} deleted.`)
    } catch (requestError) {
      if (axios.isAxiosError(requestError)) {
        setError(requestError.response?.data?.error || requestError.message)
      }
    }
  }

  const handleRideStatusChange = async (rideId: number, status: RideStatus) => {
    try {
      if (status === 'cancelled') {
        await api.put(`/rides/${rideId}/cancel`)
      } else {
        await api.put(`/rides/${rideId}/status`, { status })
      }
      await fetchAllData()
      setMessage(`Ride ${rideId} moved to ${status}.`)
    } catch (requestError) {
      if (axios.isAxiosError(requestError)) {
        setError(requestError.response?.data?.error || requestError.message)
      }
    }
  }

  return (
    <main className="dashboard-shell">
      <section className="dashboard-hero">
        <div>
          <p className="dashboard-eyebrow">Crusin Phase 4</p>
          <h1>Frontend dashboard with live backend data</h1>
          <p>
            No auth yet by request. This page manages riders, drivers, and rides directly
            through your existing backend endpoints.
          </p>
        </div>
        <button type="button" onClick={() => void fetchAllData()}>
          Refresh
        </button>
      </section>

      <section className="stats-grid">
        {stats.map((card) => (
          <article key={card.label} className="stat-card">
            <span>{card.label}</span>
            <strong>{card.value}</strong>
          </article>
        ))}
      </section>

      <section className="status-row">
        <span>{loading ? 'Loading...' : message}</span>
        {error ? <span className="error-chip">{error}</span> : null}
      </section>

      <section className="grid-two">
        <article className="panel">
          <h2>Create rider</h2>
          <form onSubmit={handleRiderSubmit}>
            <input
              value={riderForm.firstName}
              onChange={(event) => setRiderForm({ ...riderForm, firstName: event.target.value })}
              placeholder="First name"
              required
            />
            <input
              value={riderForm.lastName}
              onChange={(event) => setRiderForm({ ...riderForm, lastName: event.target.value })}
              placeholder="Last name"
              required
            />
            <input
              value={riderForm.email}
              onChange={(event) => setRiderForm({ ...riderForm, email: event.target.value })}
              placeholder="Email"
              type="email"
              required
            />
            <input
              value={riderForm.password}
              onChange={(event) => setRiderForm({ ...riderForm, password: event.target.value })}
              placeholder="Password"
              type="password"
              required
            />
            <input
              value={riderForm.phone}
              onChange={(event) => setRiderForm({ ...riderForm, phone: event.target.value })}
              placeholder="Phone"
              required
            />
            <input
              value={riderForm.cardNumber}
              onChange={(event) => setRiderForm({ ...riderForm, cardNumber: event.target.value })}
              placeholder="Card number"
              required
            />
            <button type="submit">Add rider</button>
          </form>

          <div className="list">
            {riders.map((rider) => (
              <article key={rider.riderId} className="row-card">
                <div>
                  <strong>
                    {rider.firstName} {rider.lastName}
                  </strong>
                  <p>{rider.email}</p>
                </div>
                <button type="button" onClick={() => void handleDeleteRider(rider.riderId)}>
                  Delete
                </button>
              </article>
            ))}
          </div>
        </article>

        <article className="panel">
          <h2>Create driver</h2>
          <form onSubmit={handleDriverSubmit}>
            <input
              value={driverForm.firstName}
              onChange={(event) => setDriverForm({ ...driverForm, firstName: event.target.value })}
              placeholder="First name"
              required
            />
            <input
              value={driverForm.lastName}
              onChange={(event) => setDriverForm({ ...driverForm, lastName: event.target.value })}
              placeholder="Last name"
              required
            />
            <input
              value={driverForm.email}
              onChange={(event) => setDriverForm({ ...driverForm, email: event.target.value })}
              placeholder="Email"
              type="email"
              required
            />
            <input
              value={driverForm.password}
              onChange={(event) => setDriverForm({ ...driverForm, password: event.target.value })}
              placeholder="Password"
              type="password"
              required
            />
            <input
              value={driverForm.carMake}
              onChange={(event) => setDriverForm({ ...driverForm, carMake: event.target.value })}
              placeholder="Car make"
              required
            />
            <input
              value={driverForm.carModel}
              onChange={(event) => setDriverForm({ ...driverForm, carModel: event.target.value })}
              placeholder="Car model"
              required
            />
            <input
              value={driverForm.carColor}
              onChange={(event) => setDriverForm({ ...driverForm, carColor: event.target.value })}
              placeholder="Car color"
              required
            />
            <input
              value={driverForm.licensePlate}
              onChange={(event) => setDriverForm({ ...driverForm, licensePlate: event.target.value })}
              placeholder="License plate"
              required
            />
            <input
              value={driverForm.rating}
              onChange={(event) => setDriverForm({ ...driverForm, rating: event.target.value })}
              placeholder="Rating"
            />
            <button type="submit">Add driver</button>
          </form>

          <div className="list">
            {drivers.map((driver) => (
              <article key={driver.driverId} className="row-card">
                <div>
                  <strong>
                    {driver.firstName} {driver.lastName}
                  </strong>
                  <p>
                    {driver.carMake} {driver.carModel} - {driver.licensePlate}
                  </p>
                </div>
                <button type="button" onClick={() => void handleDeleteDriver(driver.driverId)}>
                  Delete
                </button>
              </article>
            ))}
          </div>
        </article>
      </section>

      <section className="panel panel-large">
        <div className="ride-header">
          <h2>Create and manage rides</h2>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'all' | RideStatus)}>
            <option value="all">All statuses</option>
            <option value="requested">Requested</option>
            <option value="accepted">Accepted</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <form onSubmit={handleRideSubmit} className="ride-form">
          <input
            value={rideForm.riderId}
            onChange={(event) => setRideForm({ ...rideForm, riderId: event.target.value })}
            placeholder="Rider ID"
            required
          />
          <input
            value={rideForm.driverId}
            onChange={(event) => setRideForm({ ...rideForm, driverId: event.target.value })}
            placeholder="Driver ID"
          />
          <input
            value={rideForm.pickupLocation}
            onChange={(event) => setRideForm({ ...rideForm, pickupLocation: event.target.value })}
            placeholder="Pickup location"
            required
          />
          <input
            value={rideForm.dropoffLocation}
            onChange={(event) => setRideForm({ ...rideForm, dropoffLocation: event.target.value })}
            placeholder="Dropoff location"
            required
          />
          <select
            value={rideForm.status}
            onChange={(event) => setRideForm({ ...rideForm, status: event.target.value as RideStatus })}
          >
            <option value="requested">Requested</option>
            <option value="accepted">Accepted</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <input
            value={rideForm.cost}
            onChange={(event) => setRideForm({ ...rideForm, cost: event.target.value })}
            placeholder="Cost"
          />
          <button type="submit">Add ride</button>
        </form>

        <div className="table">
          <div className="table-head">
            <span>ID</span>
            <span>Route</span>
            <span>Status</span>
            <span>Actions</span>
          </div>
          {rides.map((ride) => (
            <div className="table-row" key={ride.rideId}>
              <span>#{ride.rideId}</span>
              <span>
                {ride.pickupLocation} to {ride.dropoffLocation}
              </span>
              <span>{ride.status}</span>
              <span className="actions">
                <button type="button" onClick={() => void handleRideStatusChange(ride.rideId, 'accepted')}>
                  Accept
                </button>
                <button type="button" onClick={() => void handleRideStatusChange(ride.rideId, 'in_progress')}>
                  Start
                </button>
                <button type="button" onClick={() => void handleRideStatusChange(ride.rideId, 'completed')}>
                  Complete
                </button>
                <button type="button" onClick={() => void handleRideStatusChange(ride.rideId, 'cancelled')}>
                  Cancel
                </button>
                <button type="button" onClick={() => void handleDeleteRide(ride.rideId)}>
                  Delete
                </button>
              </span>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}

export default Body
import { Link } from 'react-router-dom'
// import { useAsgardeo } from '@asgardeo/react'
import { useUser } from '../context/UserContext'

export default function Header() {
  // const { signOut } = useAsgardeo()
  const { role, userName } = useUser()

  const riderLinks = [
    { to: '/rider/dashboard', label: 'Dashboard' },
    { to: '/rider/request', label: 'Request Ride' },
    { to: '/rider/pending', label: 'Pending' },
    { to: '/rider/completed', label: 'History' },
    { to: '/rider/profile', label: 'Profile' },
  ]

  const driverLinks = [
    { to: '/driver/dashboard', label: 'Dashboard' },
    { to: '/driver/available', label: 'Available Rides' },
    { to: '/driver/my-rides', label: 'My Rides' },
    { to: '/driver/profile', label: 'Profile' },
  ]

  const links = role === 'driver' ? driverLinks : role === 'rider' ? riderLinks : []

  return (
    <header className="bg-[#08101e] border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link
          to={role === 'rider' ? '/rider/dashboard' : role === 'driver' ? '/driver/dashboard' : '/'}
          className="text-xl font-bold text-white tracking-tight shrink-0"
        >
          Crusin
        </Link>

        {/* Nav links */}
        {links.length > 0 && (
          <nav className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}

        {/* Right side */}
        <div className="flex items-center gap-3 shrink-0">
          {userName && (
            <span className="text-sm text-gray-400 hidden sm:block">{userName}</span>
          )}
          {/* sign-out button — re-enable when auth is on */}
          {/* {role && (
            <button
              onClick={() => void signOut()}
              className="text-sm bg-white/5 hover:bg-white/10 border border-white/10 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              Sign out
            </button>
          )} */}
        </div>
      </div>

      {/* Mobile nav */}
      {links.length > 0 && (
        <div className="md:hidden border-t border-white/10 px-4 py-2 flex gap-1 overflow-x-auto">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="shrink-0 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}

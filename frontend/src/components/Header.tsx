import { Link } from 'react-router-dom'
import { SignOutButton, useAsgardeo } from '@asgardeo/react'
import { useUser } from '../context/UserContext'
import { useState, useEffect, useRef } from 'react'

function getStrataNodes(): HTMLElement[] {
  return Array.from(document.querySelectorAll('body > *')).filter(el => {
    const tag = el.tagName
    const id  = (el as HTMLElement).id
    return id !== 'root' && tag !== 'SCRIPT' && tag !== 'STYLE' && tag !== 'LINK'
  }) as HTMLElement[]
}

function findStrataLauncher(): HTMLButtonElement | null {
  for (const node of getStrataNodes()) {
    const shadow = (node as Element).shadowRoot
    const btn = shadow
      ? shadow.querySelector<HTMLButtonElement>('button')
      : node.querySelector<HTMLButtonElement>('button')
    if (btn) return btn
  }
  return null
}

export default function Header() {
  const { role, userName } = useUser()
  const { isSignedIn } = useAsgardeo()
  const [chatOpen, setChatOpen] = useState(false)
  const chatOpenRef = useRef(false)

  useEffect(() => {
    const hideIfClosed = () => {
      if (chatOpenRef.current) return
      getStrataNodes().forEach(el => { el.style.display = 'none' })
    }
    hideIfClosed()
    const observer = new MutationObserver(hideIfClosed)
    observer.observe(document.body, { childList: true })
    return () => observer.disconnect()
  }, [])

  const openChat = () => {
    setChatOpen(true)
    chatOpenRef.current = true
    getStrataNodes().forEach(el => { el.style.display = '' })
    // Give Strata time to render before triggering the panel open
    setTimeout(() => {
      const launcher = findStrataLauncher()
      if (launcher) {
        launcher.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
        // Hide their button after the panel animates open
        setTimeout(() => { launcher.style.display = 'none' }, 50)
      }
    }, 50)
  }

  const closeChat = () => {
    setChatOpen(false)
    chatOpenRef.current = false
    getStrataNodes().forEach(el => { el.style.display = 'none' })
  }

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
      <div className="max-w-6xl mx-auto px-4 h-14 grid grid-cols-3 items-center">
        {/* Brand — left col */}
        <Link
          to={role === 'rider' ? '/rider/dashboard' : role === 'driver' ? '/driver/dashboard' : '/'}
          className="flex items-center gap-2 text-xl font-bold text-white tracking-tight justify-self-start"
        >
          <img src="/favicon.svg" alt="" className="w-7 h-7 rounded-md" />
          Crusin
        </Link>

        {/* Nav links — center col */}
        <nav className="hidden md:flex items-center justify-center gap-1">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="whitespace-nowrap px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side — right col */}
        <div className="flex items-center gap-3 justify-self-end">
          {userName && (
            <span className="text-sm text-gray-400 hidden sm:block">{userName}</span>
          )}
          <button
            onClick={chatOpen ? closeChat : openChat}
            className="text-sm text-gray-400 hover:text-white hover:bg-white/5 px-3 py-1.5 rounded-lg transition-colors"
          >
            {chatOpen ? 'Close AI Chat' : 'AI Chat'}
          </button>
          {isSignedIn && (
            <SignOutButton className="text-sm bg-white/5 hover:bg-white/10 border border-white/10 text-white px-3 py-1.5 rounded-lg transition-colors" />
          )}
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

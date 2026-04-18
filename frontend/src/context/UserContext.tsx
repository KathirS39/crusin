import { createContext, useCallback, useContext, useState } from 'react'
import type { ReactNode } from 'react'

type Role = 'rider' | 'driver'

interface UserState {
  role: Role | null
  userId: number | null
  userName: string | null
}

interface UserContextType extends UserState {
  setUser: (role: Role, userId: number, userName: string) => void
  clearUser: () => void
}

const UserContext = createContext<UserContextType | null>(null)

const EMPTY: UserState = { role: null, userId: null, userName: null }

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<UserState>(EMPTY)

  const setUser = useCallback((role: Role, userId: number, userName: string) => {
    setUserState({ role, userId, userName })
  }, [])

  const clearUser = useCallback(() => setUserState(EMPTY), [])

  return (
    <UserContext.Provider value={{ ...user, setUser, clearUser }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used within UserProvider')
  return ctx
}

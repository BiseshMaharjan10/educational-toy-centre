import { useCallback, useEffect, useRef } from 'react'
import { useRefreshTokenMutation } from '../../features/auth/authApi'

const REFRESH_INTERVAL_MS = 5 * 60 * 1000
const ACTIVE_WINDOW_MS = 15 * 60 * 1000

const activityEvents: Array<keyof WindowEventMap> = [
  'mousemove',
  'mousedown',
  'keydown',
  'scroll',
  'touchstart',
]

export default function AuthSessionBootstrap() {
  const [refreshToken] = useRefreshTokenMutation()
  const lastActivityRef = useRef<number>(Date.now())

  const markActivity = useCallback(() => {
    lastActivityRef.current = Date.now()
  }, [])

  const refreshSession = useCallback(async () => {
    try {
      await refreshToken(undefined).unwrap()
    } catch {
      // If no valid refresh cookie exists, user remains logged out.
    }
  }, [refreshToken])

  useEffect(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('accessToken')
    void refreshSession()

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        markActivity()
        void refreshSession()
      }
    }

    activityEvents.forEach((event) => {
      window.addEventListener(event, markActivity, { passive: true })
    })
    document.addEventListener('visibilitychange', handleVisibilityChange)

    const interval = window.setInterval(() => {
      const isRecentlyActive =
        Date.now() - lastActivityRef.current <= ACTIVE_WINDOW_MS

      if (isRecentlyActive) {
        void refreshSession()
      }
    }, REFRESH_INTERVAL_MS)

    return () => {
      window.clearInterval(interval)
      activityEvents.forEach((event) => {
        window.removeEventListener(event, markActivity)
      })
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [markActivity, refreshSession])

  return null
}
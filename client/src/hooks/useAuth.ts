import { useAppSelector, useAppDispatch } from '../app/hooks'
import { logout } from '../features/auth/authSlice'
import { useLogoutMutation } from '../features/auth/authApi'

export const useAuth = () => {
  const dispatch = useAppDispatch()
  const { user, accessToken, isAuthenticated } = useAppSelector(
    (state) => state.auth
  )
  const [logoutApi] = useLogoutMutation()

  const handleLogout = async () => {
    try {
      await logoutApi(undefined).unwrap()
    } finally {
      dispatch(logout())
    }
  }

  return {
    user,
    accessToken,
    isAuthenticated,
    isAdmin: user?.role === 'ADMIN',
    logout: handleLogout,
  }
}
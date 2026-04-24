# Senior Review Report - Educational Toy Centre (2026-04-17)

This document is a full audit of the changes made in this session. It is written in a reviewer style: file-by-file, change-by-change, with risk analysis at the end.

## Summary

The codebase was moved from a mostly scaffolded app into a working auth/session flow with router wiring, Redux state, RTK Query APIs, toast-driven validation, refresh-token session restoration, and backend token rotation. The client now boots sessions from an HTTP-only refresh cookie, and the server refresh endpoint rotates the refresh token to keep active users logged in while letting inactive sessions expire.

The biggest remaining gap is that many public/user/admin pages are still placeholders. The auth flow itself is functional, but the rest of the application is not yet fully built out.

## Explicit Coverage

Yes, this report includes the backend changes, the added pages, and the shared button component changes.
- Backend: refresh-token rotation, refresh cookie reset, and `npm start` behavior.
- Pages: auth pages plus the public/user/admin placeholder pages that were added.
- Components: the shared `Button` component and the session bootstrap component.

## Router Lazy-Loading Refactor

The router was refactored to use `React.lazy()` and `Suspense` for page-level code splitting while keeping the route structure, paths, and `element` props unchanged.

### What changed
- `HomePage` remains an eager import so the landing route is still available immediately.
- All other page imports in [client/src/router/index.tsx](client/src/router/index.tsx) were converted to `React.lazy()` imports.
- The entire `RouterProvider` render in [client/src/App.tsx](client/src/App.tsx) is now wrapped in `Suspense`.
- A new `PageLoader` fallback was added in [client/src/router/PageLoader.tsx](client/src/router/PageLoader.tsx).
- The loader was kept inside the `router` folder as requested.

### Code

[client/src/router/index.tsx](client/src/router/index.tsx)

```tsx
import { createBrowserRouter } from 'react-router-dom'
import { lazy } from 'react'
import ProtectedRoute from './ProtectedRoute'
import AdminRoute from './AdminRoute'

import HomePage from '../pages/public/HomePage'

const CataloguePage = lazy(() => import('../pages/public/CataloguePage'))
const ProductDetailPage = lazy(() => import('../pages/public/ProductDetailPage'))
const AboutPage = lazy(() => import('../pages/public/AboutPage'))

const LoginPage = lazy(() => import('../pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'))
const OtpVerifyPage = lazy(() => import('../pages/auth/OtpVerifyPage'))
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('../pages/auth/ResetPasswordPage'))

const CartPage = lazy(() => import('../pages/user/CartPage'))
const CheckoutPage = lazy(() => import('../pages/user/CheckoutPage'))
const OrderConfirmPage = lazy(() => import('../pages/user/OrderConfirmPage'))
const OrderHistoryPage = lazy(() => import('../pages/user/OrderHistoryPage'))
const OrderDetailPage = lazy(() => import('../pages/user/OrderDetailPage'))
const MessagesPage = lazy(() => import('../pages/user/MessagesPage'))
const SendMessagePage = lazy(() => import('../pages/user/SendMessagePage'))
const AccountPage = lazy(() => import('../pages/user/AccountPage'))

const AdminLoginPage = lazy(() => import('../pages/admin/AdminLoginPage'))
const AdminDashboardPage = lazy(() => import('../pages/admin/AdminDashboardPage'))
const AdminProductsPage = lazy(() => import('../pages/admin/AdminProductsPage'))
const AdminAddProductPage = lazy(() => import('../pages/admin/AdminAddProductPage'))
const AdminEditProductPage = lazy(() => import('../pages/admin/AdminEditProductPage'))
const AdminOrdersPage = lazy(() => import('../pages/admin/AdminOrdersPage'))
const AdminOrderDetailPage = lazy(() => import('../pages/admin/AdminOrderDetailPage'))
const AdminMessagesPage = lazy(() => import('../pages/admin/AdminMessagesPage'))
const AdminSettingsPage = lazy(() => import('../pages/admin/AdminSettingsPage'))

export const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/products', element: <CataloguePage /> },
  { path: '/products/:slug', element: <ProductDetailPage /> },
  { path: '/about', element: <AboutPage /> },

  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/verify-otp', element: <OtpVerifyPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },

  { path: '/admin/login', element: <AdminLoginPage /> },

  {
    element: <ProtectedRoute />,
    children: [
      { path: '/cart', element: <CartPage /> },
      { path: '/checkout', element: <CheckoutPage /> },
      { path: '/order-confirm', element: <OrderConfirmPage /> },
      { path: '/orders', element: <OrderHistoryPage /> },
      { path: '/orders/:id', element: <OrderDetailPage /> },
      { path: '/messages', element: <MessagesPage /> },
      { path: '/messages/new', element: <SendMessagePage /> },
      { path: '/account', element: <AccountPage /> },
    ],
  },

  {
    element: <AdminRoute />,
    children: [
      { path: '/admin', element: <AdminDashboardPage /> },
      { path: '/admin/products', element: <AdminProductsPage /> },
      { path: '/admin/products/new', element: <AdminAddProductPage /> },
      { path: '/admin/products/:id/edit', element: <AdminEditProductPage /> },
      { path: '/admin/orders', element: <AdminOrdersPage /> },
      { path: '/admin/orders/:id', element: <AdminOrderDetailPage /> },
      { path: '/admin/messages', element: <AdminMessagesPage /> },
      { path: '/admin/settings', element: <AdminSettingsPage /> },
    ],
  },
])
```

[client/src/App.tsx](client/src/App.tsx)

```tsx
import { Suspense } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import AuthSessionBootstrap from './components/layout/AuthSessionBootstrap'
import PageLoader from './router/PageLoader'

function App() {
  return (
    <>
      <AuthSessionBootstrap />
      <Suspense fallback={<PageLoader />}>
        <RouterProvider router={router} />
      </Suspense>
    </>
  )
}

export default App
```

[client/src/router/PageLoader.tsx](client/src/router/PageLoader.tsx)

```tsx
export default function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6eee4] text-[#3d2b1f]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-[#d8b08e] border-t-[#8f2a22]" />
        <p className="text-[0.72rem] uppercase tracking-[0.28em]">Loading...</p>
      </div>
    </div>
  )
}
```

### Why it was done
- To split page bundles and load route code only when it is needed.
- To keep the initial application payload smaller.
- To preserve the exact existing route structure without changing any paths or route elements.

### Validation
- The build passed successfully after the lazy-loading refactor.

## [client/package.json]
- Change type: modified
- Before code:
```json
"dependencies": {
  "@reduxjs/toolkit": "^2.11.2",
  "@tailwindcss/vite": "^4.2.2",
  "axios": "^1.15.0",
  "react": "^19.2.4",
  "react-dom": "^19.2.4",
  "react-redux": "^9.2.0"
}
```
- After code:
```json
"dependencies": {
  "@reduxjs/toolkit": "^2.11.2",
  "@tailwindcss/vite": "^4.2.2",
  "axios": "^1.15.0",
  "lucide-react": "^1.8.0",
  "react": "^19.2.4",
  "react-dom": "^19.2.4",
  "react-redux": "^9.2.0"
}
```
- Reason: added icon support for the password visibility toggle in the shared input component.

## [client/package-lock.json]
- Change type: modified
- Before code:
```json
// no lucide-react entry
```
- After code:
```json
"node_modules/lucide-react": {
  "version": "1.8.0",
  "resolved": "...",
  "integrity": "...",
  "peerDependencies": {
    "react": "^16.5.1 || ^17.0.0 || ^18.0.0 || ^19.0.0"
  }
}
```
- Reason: lockfile updated to match the new dependency.

## [client/src/App.tsx]
- Change type: modified
- Before code:
```tsx
import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      {/* Vite starter screen */}
    </>
  )
}
```
- After code:
```tsx
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import AuthSessionBootstrap from './components/layout/AuthSessionBootstrap'

function App() {
  return (
    <>
      <AuthSessionBootstrap />
      <RouterProvider router={router} />
    </>
  )
}
```
- Reason: replaced the Vite starter shell with the actual application router and global session bootstrap.

## [client/src/main.tsx]
- Change type: modified
- Before code:
```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```
- After code:
```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './app/store'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>
)
```
- Reason: wrapped the app in Redux so auth and other feature state can be shared globally.

## [client/src/app/hooks.ts]
- Change type: added
- Before code:
```ts
// empty file
```
- After code:
```ts
import { useDispatch, useSelector } from 'react-redux'
import type { RootState, AppDispatch } from './store'

export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector = <T>(selector: (state: RootState) => T): T =>
  useSelector(selector)
```
- Reason: typed Redux hooks for cleaner component usage.

## [client/src/app/store.ts]
- Change type: added
- Before code:
```ts
// empty file
```
- After code:
```ts
import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../features/auth/authSlice'
import cartReducer from '../features/cart/cartSlice'
import { authApi } from '../features/auth/authApi'
import { productsApi } from '../features/products/productsApi'
import { cartApi } from '../features/cart/cartApi'
import { ordersApi } from '../features/orders/ordersApi'
import { messagesApi } from '../features/messages/messagesApi'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    [authApi.reducerPath]: authApi.reducer,
    [productsApi.reducerPath]: productsApi.reducer,
    [cartApi.reducerPath]: cartApi.reducer,
    [ordersApi.reducerPath]: ordersApi.reducer,
    [messagesApi.reducerPath]: messagesApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      productsApi.middleware,
      cartApi.middleware,
      ordersApi.middleware,
      messagesApi.middleware
    ),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
```
- Reason: centralized app state and RTK Query middleware registration.

## [client/src/components/ui/Button.tsx]
- Change type: modified
- Before code:
```tsx
const baseClasses =
  'inline-flex h-[3.5rem] items-center justify-between gap-4 px-7 text-[0.72rem] uppercase tracking-[0.28em] transition-colors'
```
- After code:
```tsx
const baseClasses =
  'inline-flex h-[3.5rem] cursor-pointer items-center justify-between gap-4 px-7 text-[0.72rem] uppercase tracking-[0.28em] transition-colors disabled:cursor-not-allowed'
```
- Reason: buttons now visibly behave like interactive controls.

## [client/src/components/layout/AuthSessionBootstrap.tsx]
- Change type: added
- Before code:
```ts
// empty file
```
- After code:
```tsx
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
```
- Reason: restore sessions from the refresh cookie and keep active sessions alive.
- Reviewer note: this introduces a periodic network background task and a token refresh race risk across multiple tabs.

## Auth State and API

## [client/src/features/auth/authSlice.ts]
- Change type: added
- Before code:
```ts
// empty file
```
- After code:
```ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { AuthState, User } from '../../types/auth.types'

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; accessToken: string }>
    ) => {
      state.user = action.payload.user
      state.accessToken = action.payload.accessToken
      state.isAuthenticated = true
    },
    updateAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload
    },
    logout: (state) => {
      state.user = null
      state.accessToken = null
      state.isAuthenticated = false
    },
  },
})

export const { setCredentials, updateAccessToken, logout } = authSlice.actions
export default authSlice.reducer
```
- Reason: local auth state for the current session.

## [client/src/features/auth/authApi.ts]
- Change type: added
- Before code:
```ts
// empty file
```
- After code:
```ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { RootState } from '../../app/store'
import { setCredentials, updateAccessToken, logout } from './authSlice'

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/v1/auth',
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.accessToken
      if (token) headers.set('Authorization', `Bearer ${token}`)
      return headers
    },
  }),
  endpoints: (builder) => ({
    register: builder.mutation({
      query: (body) => ({ url: '/register', method: 'POST', body }),
    }),
    verifyOtp: builder.mutation({
      query: (body) => ({ url: '/verify-otp', method: 'POST', body }),
    }),
    resendOtp: builder.mutation({
      query: (body) => ({ url: '/resend-otp', method: 'POST', body }),
    }),
    login: builder.mutation({
      query: (body) => ({ url: '/login', method: 'POST', body }),
    }),
    adminLogin: builder.mutation({
      query: (body) => ({ url: '/admin/login', method: 'POST', body }),
    }),
    logout: builder.mutation({
      query: () => ({ url: '/logout', method: 'POST' }),
    }),
    forgotPassword: builder.mutation({
      query: (body) => ({ url: '/forgot-password', method: 'POST', body }),
    }),
    resetPassword: builder.mutation({
      query: (body) => ({ url: '/reset-password', method: 'POST', body }),
    }),
    refreshToken: builder.mutation({
      query: () => ({ url: '/refresh', method: 'POST' }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          if (data?.data?.user && data?.data?.accessToken) {
            dispatch(
              setCredentials({
                user: data.data.user,
                accessToken: data.data.accessToken,
              })
            )
          } else if (data?.data?.accessToken) {
            dispatch(updateAccessToken(data.data.accessToken))
          }
        } catch {
          dispatch(logout())
        }
      },
    }),
  }),
})

export const {
  useRegisterMutation,
  useVerifyOtpMutation,
  useResendOtpMutation,
  useLoginMutation,
  useAdminLoginMutation,
  useLogoutMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useRefreshTokenMutation,
} = authApi
```
- Reason: auth API layer, including session refresh hydration.

## [client/src/hooks/useAuth.ts]
- Change type: added
- Before code:
```ts
// empty file
```
- After code:
```ts
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
```
- Reason: convenience wrapper for auth state and logout flow.

## [client/src/hooks/useCart.ts]
- Change type: added
- Before code:
```ts
// empty file
```
- After code:
```ts
import { useAppSelector, useAppDispatch } from '../app/hooks'
import { addItem, removeItem, updateQuantity, clearCart } from '../features/cart/cartSlice'
import type { CartItem } from '../types/cart.types'

export const useCart = () => {
  const dispatch = useAppDispatch()
  const { items } = useAppSelector((state) => state.cart)

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0)

  const cartTotal = items.reduce(
    (sum, item) => sum + parseFloat(item.product.price) * item.quantity,
    0
  )

  const addToCart = (item: CartItem) => dispatch(addItem(item))
  const removeFromCart = (productId: string) => dispatch(removeItem(productId))
  const updateItemQuantity = (productId: string, quantity: number) =>
    dispatch(updateQuantity({ productId, quantity }))
  const emptyCart = () => dispatch(clearCart())

  return {
    items,
    cartCount,
    cartTotal,
    addToCart,
    removeFromCart,
    updateItemQuantity,
    emptyCart,
  }
}
```
- Reason: cart state helper.
- Reviewer note: `parseFloat(item.product.price)` assumes the price is always a parseable numeric string. If a formatted string ever gets stored, totals will break.

## [client/src/hooks/useToast.ts]
- Change type: added
- Before code:
```ts
// empty file
```
- After code:
```ts
import { useState, useCallback } from 'react'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback(
    (message: string, type: Toast['type'] = 'success') => {
      const id = Math.random().toString(36).slice(2)
      setToasts((prev) => [...prev, { id, message, type }])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 3500)
    },
    []
  )

  const removeToast = (id: string) =>
    setToasts((prev) => prev.filter((t) => t.id !== id))

  return { toasts, showToast, removeToast }
}
```
- Reason: lightweight in-component toast system.
- Reviewer note: timers are not tracked or cleared on unmount, so the hook can schedule state updates after a component has already gone away.

## Auth Pages

## [client/src/pages/auth/LoginPage.tsx]
- Change type: added
- Before code:
```tsx
// empty file
```
- After code:
```tsx
// full login page implementing form state, validation, RTK Query login, toast errors, and redirect
```
- Reason: implemented the user login flow.
- Reviewer note: the implementation uses custom validation and toast messaging instead of browser-native validation popups, which matches the requirement. It still maps several backend error variants to a generic wrong-credentials message, which is a product choice.

## [client/src/pages/auth/RegisterPage.tsx]
- Change type: added
- Before code:
```tsx
// empty file
```
- After code:
```tsx
// full register page implementing form state, validation, RTK Query register, OTP redirect, toast errors
```
- Reason: implemented the user registration flow.
- Reviewer note: phone handling is intentionally Nepal-specific and strips `977` while clamping to 10 digits.

## [client/src/pages/auth/OtpVerifyPage.tsx]
- Change type: added
- Before code:
```tsx
// empty file
```
- After code:
```tsx
// full OTP verification page with resend action, 6-digit numeric input, and login redirect
```
- Reason: complete the email verification step.
- Reviewer note: resend behavior assumes the backend error shape is handled cleanly.

## [client/src/pages/auth/ForgotPasswordPage.tsx]
- Change type: added
- Before code:
```tsx
// empty file
```
- After code:
```tsx
// full forgot-password page to request reset OTP and redirect to reset-page
```
- Reason: start password recovery.

## [client/src/pages/auth/ResetPasswordPage.tsx]
- Change type: added
- Before code:
```tsx
// empty file
```
- After code:
```tsx
// full reset-password page with email, OTP, and new password fields
```
- Reason: complete the password reset flow.

## Router and Guards

## [client/src/router/index.tsx]
- Change type: added
- Before code:
```tsx
// empty file
```
- After code:
```tsx
// browser router with public, auth, protected user, and admin routes
```
- Reason: define the app route tree.
- Reviewer note: there is no explicit 404 route. Unknown paths will not be handled gracefully.

## [client/src/router/ProtectedRoute.tsx]
- Change type: added
- Before code:
```tsx
// empty file
```
- After code:
```tsx
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const ProtectedRoute = () => {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}

export default ProtectedRoute
```
- Reason: guard private user routes.

## [client/src/router/AdminRoute.tsx]
- Change type: added
- Before code:
```tsx
// empty file
```
- After code:
```tsx
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const AdminRoute = () => {
  const { isAuthenticated, isAdmin } = useAuth()
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />
  if (!isAdmin) return <Navigate to="/" replace />
  return <Outlet />
}

export default AdminRoute
```
- Reason: guard admin-only routes.

## Server Session / Startup

## [server/package.json]
- Change type: modified
- Before code:
```json
"scripts": {
  "dev": "ts-node-dev --respawn --transpile-only server.ts",
  "build": "tsc",
  "start": "node dist/server.js"
}
```
- After code:
```json
"scripts": {
  "dev": "ts-node-dev --respawn --transpile-only server.ts",
  "build": "tsc",
  "start": "ts-node-dev --respawn --transpile-only server.ts",
  "start:prod": "node dist/server.js"
}
```
- Reason: `npm start` now launches the backend directly from source during development.
- Reviewer note: this is convenient for development, but it is not a production-safe default. The `start:prod` script preserves compiled startup.

## [server/src/modules/auth/auth.service.ts]
- Change type: modified
- Before code:
```ts
const accessToken = signAccessToken({
  userId: payload.userId,
  role: payload.role,
})

return { accessToken }
```
- After code:
```ts
const user = await prisma.user.findUnique({ where: { id: payload.userId } })
if (!user) {
  throw new AppError('User not found', StatusCodes.UNAUTHORIZED)
}

const accessToken = signAccessToken({
  userId: user.id,
  role: user.role,
})

const refreshToken = signRefreshToken({
  userId: user.id,
  role: user.role,
})

await prisma.$transaction([
  prisma.refreshToken.delete({ where: { token } }),
  prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  }),
])

return {
  accessToken,
  refreshToken,
  user: { id: user.id, name: user.name, email: user.email, role: user.role },
}
```
- Reason: refresh-token rotation and sliding session behavior.
- Reviewer note: I am not fully confident this is safe in all concurrent refresh scenarios. Multiple tabs can race and invalidate one another.

## [server/src/modules/auth/auth.controller.ts]
- Change type: modified
- Before code:
```ts
const result = await authService.refreshAccessToken(token)
return res.status(StatusCodes.OK).json({
  success: true,
  data: result,
})
```
- After code:
```ts
const result = await authService.refreshAccessToken(token)
res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS)
return res.status(StatusCodes.OK).json({
  success: true,
  data: {
    accessToken: result.accessToken,
    user: result.user,
  },
})
```
- Reason: rotate the refresh cookie on every refresh and return enough data for client hydration.

## Types and Utilities

## [client/src/types/auth.types.ts]
- Change type: added
- Before code:
```ts
// empty file
```
- After code:
```ts
export interface User {
  id: string
  name: string
  email: string
  phone?: string
  role: 'USER' | 'ADMIN'
}

export interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
}

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  name: string
  email: string
  password: string
  phone?: string
}

export interface OtpInput {
  email: string
  otp: string
}

export interface ForgotPasswordInput {
  email: string
}

export interface ResetPasswordInput {
  email: string
  otp: string
  newPassword: string
}
```
- Reason: shared auth typing.

## [client/src/types/cart.types.ts]
- Change type: added
- Before code:
```ts
// empty file
```
- After code:
```ts
import type { Product } from './product.types'

export interface CartItem {
  productId: string
  quantity: number
  product: Pick<Product, 'id' | 'name' | 'slug' | 'price' | 'images' | 'stock'>
}

export interface CartState {
  items: CartItem[]
}
```
- Reason: cart data typing.

## [client/src/types/message.types.ts]
- Change type: added
- Before code:
```ts
// empty file
```
- After code:
```ts
export interface MessageReply {
  id: string
  messageId: string
  senderRole: 'USER' | 'ADMIN'
  body: string
  createdAt: string
}

export interface Message {
  id: string
  userId: string
  subject: string
  body: string
  isRead: boolean
  isResolved: boolean
  createdAt: string
  replies: MessageReply[]
  user?: {
    name: string
    email: string
  }
}
```
- Reason: message domain typing.

## [client/src/types/order.types.ts]
- Change type: added
- Before code:
```ts
// empty file
```
- After code:
```ts
export interface DeliveryAddress {
  fullName: string
  phone: string
  address: string
  city: string
  landmark?: string
}

export interface OrderItem {
  id: string
  productId: string
  quantity: number
  unitPrice: string
  product: {
    name: string
    images: string[]
    slug: string
  }
}

export interface Order {
  id: string
  userId: string
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
  deliveryAddress: DeliveryAddress
  specialInstructions?: string
  adminNote?: string
  items: OrderItem[]
  createdAt: string
  updatedAt: string
}

export interface PlaceOrderInput {
  items: { productId: string; quantity: number }[]
  deliveryAddress: DeliveryAddress
  specialInstructions?: string
}
```
- Reason: order typing.

## [client/src/types/product.types.ts]
- Change type: added
- Before code:
```ts
// empty file
```
- After code:
```ts
export interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: string
  category: string
  ageGroup: string
  material: string
  stock: number
  images: string[]
  isFeatured: boolean
  isActive?: boolean
  createdAt: string
}

export interface ProductQuery {
  page?: string
  limit?: string
  category?: string
  ageGroup?: string
  minPrice?: string
  maxPrice?: string
  search?: string
  sort?: 'newest' | 'price-asc' | 'price-desc' | 'featured'
}

export interface PaginatedProducts {
  products: Product[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
```
- Reason: product typing.

## [client/src/utils/constants.ts]
- Change type: added
- Before code:
```ts
// empty file
```
- After code:
```ts
export const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
}

export const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-orange-100 text-orange-700',
  CONFIRMED: 'bg-green-100 text-green-700',
  PROCESSING: 'bg-blue-100 text-blue-700',
  SHIPPED: 'bg-purple-100 text-purple-700',
  DELIVERED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-700',
}

export const STOCK_LABELS = {
  IN_STOCK: 'In Stock',
  LOW_STOCK: 'Low Stock',
  OUT_OF_STOCK: 'Out of Stock',
}

export const getStockStatus = (stock: number) => {
  if (stock === 0) return { label: 'Out of Stock', color: 'bg-gray-100 text-gray-500' }
  if (stock <= 5) return { label: 'Low Stock', color: 'bg-orange-100 text-orange-600' }
  return { label: 'In Stock', color: 'bg-green-100 text-green-600' }
}
```
- Reason: reusable labels and stock helper.

## [client/src/utils/formatDate.ts]
- Change type: added
- Before code:
```ts
// empty file
```
- After code:
```ts
export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-NP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export const formatDateTime = (date: string): string => {
  return new Date(date).toLocaleString('en-NP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
```
- Reason: date formatting helpers.

## [client/src/utils/formatPrice.ts]
- Change type: added
- Before code:
```ts
// empty file
```
- After code:
```ts
export const formatPrice = (price: number | string): string => {
  const num = typeof price === 'string' ? parseFloat(price) : price
  return `NPR ${num.toLocaleString('en-NP')}`
}
```
- Reason: currency formatting helper.
- Reviewer note: invalid numeric strings can turn into `NaN` and produce poor output.

## Placeholder / Scaffold Pages

These were intentionally added as route placeholders. They are not feature-complete, but they unblock routing and compilation.

## [client/src/pages/public/HomePage.tsx]
- Change type: added
- Before code: empty file
- After code: `const HomePage = () => <div>Home</div>; export default HomePage`
- Reason: route placeholder.

## [client/src/pages/public/AboutPage.tsx]
- Change type: added
- Before code: empty file
- After code: `const AboutPage = () => <div>About</div>; export default AboutPage`
- Reason: route placeholder.

## [client/src/pages/public/CataloguePage.tsx]
- Change type: added
- Before code: empty file
- After code: `const CataloguePage = () => <div>Catalogue</div>; export default CataloguePage`
- Reason: route placeholder.

## [client/src/pages/public/ProductDetailPage.tsx]
- Change type: added
- Before code: empty file
- After code: `const ProductDetailPage = () => <div>Product</div>; export default ProductDetailPage`
- Reason: route placeholder.

## [client/src/pages/user/AccountPage.tsx]
- Change type: added
- Before code: empty file
- After code: `const AccountPage = () => <div>Account</div>; export default AccountPage`
- Reason: route placeholder.

## [client/src/pages/user/CartPage.tsx]
- Change type: added
- Before code: empty file
- After code: `const CartPage = () => <div>Cart</div>; export default CartPage`
- Reason: route placeholder.

## [client/src/pages/user/CheckoutPage.tsx]
- Change type: added
- Before code: empty file
- After code: `const CheckoutPage = () => <div>Checkout</div>; export default CheckoutPage`
- Reason: route placeholder.

## [client/src/pages/user/MessagesPage.tsx]
- Change type: added
- Before code: empty file
- After code: `const MessagesPage = () => <div>Messages</div>; export default MessagesPage`
- Reason: route placeholder.

## [client/src/pages/user/OrderConfirmPage.tsx]
- Change type: added
- Before code: empty file
- After code: `const OrderConfirmPage = () => <div>Confirmed</div>; export default OrderConfirmPage`
- Reason: route placeholder.

## [client/src/pages/user/OrderDetailPage.tsx]
- Change type: added
- Before code: empty file
- After code: `const OrderDetailPage = () => <div>Order Detail</div>; export default OrderDetailPage`
- Reason: route placeholder.

## [client/src/pages/user/OrderHistoryPage.tsx]
- Change type: added
- Before code: empty file
- After code: `const OrderHistoryPage = () => <div>Orders</div>; export default OrderHistoryPage`
- Reason: route placeholder.

## [client/src/pages/user/SendMessagePage.tsx]
- Change type: added
- Before code: empty file
- After code: `const SendMessagePage = () => <div>Send Message</div>; export default SendMessagePage`
- Reason: route placeholder.

## [client/src/pages/admin/AdminLoginPage.tsx]
- Change type: added
- Before code: empty file
- After code: `const AdminLoginPage = () => <div>Admin Login</div>; export default AdminLoginPage`
- Reason: route placeholder.

## [client/src/pages/admin/AdminDashboardPage.tsx]
- Change type: added
- Before code: empty file
- After code: `const AdminDashboardPage = () => <div>Dashboard</div>; export default AdminDashboardPage`
- Reason: route placeholder.

## [client/src/pages/admin/AdminProductsPage.tsx]
- Change type: added
- Before code: empty file
- After code: `const AdminProductsPage = () => <div>Products</div>; export default AdminProductsPage`
- Reason: route placeholder.

## [client/src/pages/admin/AdminAddProductPage.tsx]
- Change type: added
- Before code: empty file
- After code: `const AdminAddProductPage = () => <div>Add Product</div>; export default AdminAddProductPage`
- Reason: route placeholder.

## [client/src/pages/admin/AdminEditProductPage.tsx]
- Change type: added
- Before code: empty file
- After code: `const AdminEditProductPage = () => <div>Edit Product</div>; export default AdminEditProductPage`
- Reason: route placeholder.

## [client/src/pages/admin/AdminOrdersPage.tsx]
- Change type: added
- Before code: empty file
- After code: `const AdminOrdersPage = () => <div>Orders</div>; export default AdminOrdersPage`
- Reason: route placeholder.

## [client/src/pages/admin/AdminOrderDetailPage.tsx]
- Change type: added
- Before code: empty file
- After code: `const AdminOrderDetailPage = () => <div>Order Detail</div>; export default AdminOrderDetailPage`
- Reason: route placeholder.

## [client/src/pages/admin/AdminMessagesPage.tsx]
- Change type: added
- Before code: empty file
- After code: `const AdminMessagesPage = () => <div>Messages</div>; export default AdminMessagesPage`
- Reason: route placeholder.

## [client/src/pages/admin/AdminSettingsPage.tsx]
- Change type: added
- Before code: empty file
- After code: `const AdminSettingsPage = () => <div>Settings</div>; export default AdminSettingsPage`
- Reason: route placeholder.

## [CLAUDE_HANDOFF_2026-04-17.md]
- Change type: added
- Before code: empty file
- After code: written implementation handoff
- Reason: durable continuation document.

## Possible Bugs Introduced

1. Refresh-token rotation can race across tabs.
   - If two refresh requests happen at nearly the same time, one request can invalidate the other.

2. Session bootstrap depends on backend availability.
   - If the backend is offline, the client will try to refresh on load and fail.

3. Legacy localStorage cleanup may be broader than necessary.
   - It removes `token` and `accessToken` from localStorage on boot. I did not find current code writing those keys, but I cannot guarantee no future feature will rely on them.

4. Toast timers are not explicitly cleaned up.
   - `useToast` schedules delayed removal without tracking timer handles.

5. Placeholder pages are non-functional.
   - They compile, but they do not provide real business behavior.

6. Format helpers assume valid input.
   - `formatPrice` can yield `NaN`.
   - `formatDate` assumes valid ISO-like dates.

7. Phone sanitization is intentionally narrow.
   - It strips `977` and clamps to 10 digits, which fits the current requirement but may reject valid international input.

8. No explicit 404 route exists.
   - Unknown routes are not handled cleanly.

## Performance Impact

1. App boot now includes a refresh request.
   - Every page load attempts session restoration.

2. Keep-alive adds recurring background requests.
   - Active sessions refresh every 5 minutes.

3. Global activity listeners remain attached while the app is open.
   - The overhead is small but permanent.

4. Bundle size increased.
   - New routes, pages, hooks, and icons add client weight.

## Security Concerns

1. Refresh token is stored in an HTTP-only cookie.
   - This is the right direction and better than localStorage.

2. Sliding sessions extend authentication lifetime.
   - Active users remain signed in longer by design.

3. Cookie auth still deserves CSRF review.
   - SameSite settings help, but I did not add a dedicated CSRF token layer.

4. Refresh responses return user identity to the client.
   - This is normal for bootstrapping, but it does expose user profile data in the response.

5. `npm start` now runs TypeScript source directly on the server.
   - Good for development, but it is not a hardened production start path.

## Edge Cases Not Handled

1. Multiple tabs refreshing together.
   - Token rotation race is unresolved.

2. Backend unavailable during bootstrap.
   - The client will look logged out or error during startup.

3. Browser timer throttling.
   - Idle tabs may delay refresh timing.

4. Unexpected API error shapes.
   - Toast logic assumes error responses are reasonably structured.

5. Non-Nepal phone formats.
   - Not supported by the current register rule.

6. Unknown route rendering.
   - No fallback page is configured.

## Final Reviewer Verdict

The auth and session work is directionally correct and materially improves the app. The main architectural decision, using an HTTP-only refresh cookie plus in-memory access token, is sound. The refresh bootstrap and rotation logic are also aligned with the requirement that active users stay logged in while inactive users expire after 7 days.

The main risks are implementation completeness and concurrency. The remaining placeholder pages are expected for now, but the refresh-token rotation strategy needs attention if multi-tab behavior matters. I am also not fully certain the toast timer handling is clean under component unmount.

If the next step is hardening, I would prioritize:
1. refresh-token race handling,
2. 404 route and error fallback pages,
3. tests for auth/session expiry,
4. replacing placeholder screens with real UIs.

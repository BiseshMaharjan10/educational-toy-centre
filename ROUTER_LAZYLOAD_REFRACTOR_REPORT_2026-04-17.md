# Router Lazy-Loading Refactor Report

This document summarizes the router refactor completed on 2026-04-17.

## Goal

Refactor the frontend router to use `React.lazy()` and `Suspense` for code splitting while keeping the route structure exactly the same.

## What Changed

- `HomePage` remains an eager import.
- All other page imports were converted to `React.lazy()`.
- The full `RouterProvider` render in `App.tsx` is wrapped with `Suspense`.
- A `PageLoader` fallback was added in the router folder.
- No route paths or `element` props were changed.

## Updated Files

### [client/src/router/index.tsx](client/src/router/index.tsx)

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

### [client/src/App.tsx](client/src/App.tsx)

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

### [client/src/router/PageLoader.tsx](client/src/router/PageLoader.tsx)

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

## Why This Was Done

- Reduces the initial bundle size.
- Loads route code only when needed.
- Keeps the router structure stable and unchanged.
- Improves perceived performance with a loader while pages stream in.

## Validation

- The client build passed successfully after the refactor.

## Notes

- `HomePage` is still eager-loaded as requested.
- No route paths were changed.
- No `element` props were changed.
- `PageLoader` is stored in the router folder as requested.

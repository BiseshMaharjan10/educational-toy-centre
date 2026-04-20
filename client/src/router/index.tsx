import { createBrowserRouter } from 'react-router-dom'
import { lazy } from 'react'
import ProtectedRoute from './ProtectedRoute'
import AdminRoute from './AdminRoute'

import HomePage from '../pages/public/HomePage'

const CataloguePage = lazy(() => import('../pages/public/CataloguePage'))
const ProductDetailPage = lazy(() => import('../pages/public/ProductDetailPage'))
const AboutPage = lazy(() => import('../pages/public/AboutPage'))
const NotFoundPage = lazy(() => import('../pages/public/NotFoundPage'))

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

  { path: '*', element: <NotFoundPage /> },
])
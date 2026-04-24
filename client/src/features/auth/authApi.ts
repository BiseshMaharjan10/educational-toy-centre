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
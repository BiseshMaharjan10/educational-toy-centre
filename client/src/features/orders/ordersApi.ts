import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { RootState } from '../../app/store'

export const ordersApi = createApi({
  reducerPath: 'ordersApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/v1/orders',
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.accessToken
      if (token) headers.set('Authorization', `Bearer ${token}`)
      return headers
    },
  }),
  tagTypes: ['Order'],
  endpoints: (builder) => ({
    placeOrder: builder.mutation({
      query: (body) => ({ url: '/', method: 'POST', body }),
      invalidatesTags: ['Order'],
    }),
    getUserOrders: builder.query({
      query: (params = {}) => {
        const qs = new URLSearchParams(params).toString()
        return qs ? `/mine?${qs}` : '/mine'
      },
      providesTags: ['Order'],
    }),
    getUserOrderById: builder.query({
      query: (id) => `/mine/${id}`,
      providesTags: ['Order'],
    }),
    cancelUserOrder: builder.mutation({
      query: (id) => ({ url: `/mine/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Order'],
    }),
    getAdminOrders: builder.query({
      query: (params = {}) => {
        const qs = new URLSearchParams(params).toString()
        return qs ? `/admin?${qs}` : '/admin'
      },
      providesTags: ['Order'],
    }),
    getAdminOrderById: builder.query({
      query: (id) => `/admin/${id}`,
      providesTags: ['Order'],
    }),
    updateOrderStatus: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/admin/${id}/status`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Order'],
    }),
    getOrderStats: builder.query({
      query: () => '/admin/stats',
    }),
  }),
})

export const {
  usePlaceOrderMutation,
  useGetUserOrdersQuery,
  useGetUserOrderByIdQuery,
  useCancelUserOrderMutation,
  useGetAdminOrdersQuery,
  useGetAdminOrderByIdQuery,
  useUpdateOrderStatusMutation,
  useGetOrderStatsQuery,
} = ordersApi
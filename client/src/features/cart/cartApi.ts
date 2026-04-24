import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { RootState } from '../../app/store'

export const cartApi = createApi({
  reducerPath: 'cartApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/v1/cart',
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.accessToken
      if (token) headers.set('Authorization', `Bearer ${token}`)
      return headers
    },
  }),
  endpoints: (builder) => ({
    getCart: builder.query({
      query: () => '/',
    }),
    syncCart: builder.mutation({
      query: (body) => ({ url: '/sync', method: 'POST', body }),
    }),
    updateCart: builder.mutation({
      query: (body) => ({ url: '/', method: 'PUT', body }),
    }),
    clearCart: builder.mutation({
      query: () => ({ url: '/', method: 'DELETE' }),
    }),
  }),
})

export const {
  useGetCartQuery,
  useSyncCartMutation,
  useUpdateCartMutation,
  useClearCartMutation,
} = cartApi
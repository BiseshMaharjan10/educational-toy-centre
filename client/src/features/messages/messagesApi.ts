import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { RootState } from '../../app/store'

export const messagesApi = createApi({
  reducerPath: 'messagesApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/v1/messages',
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.accessToken
      if (token) headers.set('Authorization', `Bearer ${token}`)
      return headers
    },
  }),
  tagTypes: ['Message'],
  endpoints: (builder) => ({
    sendMessage: builder.mutation({
      query: (body) => ({ url: '/', method: 'POST', body }),
      invalidatesTags: ['Message'],
    }),
    getUserMessages: builder.query({
      query: (params = {}) => {
        const qs = new URLSearchParams(params).toString()
        return qs ? `/mine?${qs}` : '/mine'
      },
      providesTags: ['Message'],
    }),
    getUserMessageById: builder.query({
      query: (id) => `/mine/${id}`,
      providesTags: ['Message'],
    }),
    userReply: builder.mutation({
      query: ({ id, body }) => ({
        url: `/mine/${id}/reply`,
        method: 'POST',
        body: { body },
      }),
      invalidatesTags: ['Message'],
    }),
    getAdminMessages: builder.query({
      query: (params = {}) => {
        const qs = new URLSearchParams(params).toString()
        return qs ? `/admin?${qs}` : '/admin'
      },
      providesTags: ['Message'],
    }),
    getAdminMessageById: builder.query({
      query: (id) => `/admin/${id}`,
      providesTags: ['Message'],
    }),
    adminReply: builder.mutation({
      query: ({ id, body }) => ({
        url: `/admin/${id}/reply`,
        method: 'POST',
        body: { body },
      }),
      invalidatesTags: ['Message'],
    }),
    markResolved: builder.mutation({
      query: (id) => ({ url: `/admin/${id}/resolve`, method: 'PATCH' }),
      invalidatesTags: ['Message'],
    }),
    markRead: builder.mutation({
      query: (id) => ({ url: `/admin/${id}/read`, method: 'PATCH' }),
      invalidatesTags: ['Message'],
    }),
  }),
})

export const {
  useSendMessageMutation,
  useGetUserMessagesQuery,
  useGetUserMessageByIdQuery,
  useUserReplyMutation,
  useGetAdminMessagesQuery,
  useGetAdminMessageByIdQuery,
  useAdminReplyMutation,
  useMarkResolvedMutation,
  useMarkReadMutation,
} = messagesApi
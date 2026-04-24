import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { RootState } from '../../app/store'
import type { PaginatedProducts, Product, ProductQuery } from '../../types/product.types'

export const productsApi = createApi({
  reducerPath: 'productsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/v1/products',
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.accessToken
      if (token) headers.set('Authorization', `Bearer ${token}`)
      return headers
    },
  }),
  tagTypes: ['Product'],
  endpoints: (builder) => ({
    getProducts: builder.query<{ success: boolean; data: PaginatedProducts }, ProductQuery>({
      query: (params = {}) => {
        const qs = new URLSearchParams(params as Record<string, string>).toString()
        return qs ? `/?${qs}` : '/'
      },
      providesTags: ['Product'],
    }),
    getFeaturedProducts: builder.query<{ success: boolean; data: { products: Product[] } }, void>({
      query: () => '/featured',
    }),
    getCategories: builder.query<{ success: boolean; data: { categories: string[] } }, void>({
      query: () => '/categories',
    }),
    getProductBySlug: builder.query<{ success: boolean; data: { product: Product } }, string>({
      query: (slug) => `/${slug}`,
      providesTags: ['Product'],
    }),
    getAdminProducts: builder.query<{ success: boolean; data: PaginatedProducts }, ProductQuery>({
      query: (params = {}) => {
        const qs = new URLSearchParams(params as Record<string, string>).toString()
        return qs ? `/admin/all?${qs}` : '/admin/all'
      },
      providesTags: ['Product'],
    }),
    createProduct: builder.mutation({
      query: (formData) => ({
        url: '/admin',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Product'],
    }),
    updateProduct: builder.mutation({
      query: ({ id, formData }) => ({
        url: `/admin/${id}`,
        method: 'PUT',
        body: formData,
      }),
      invalidatesTags: ['Product'],
    }),
    deleteProduct: builder.mutation({
      query: (id) => ({ url: `/admin/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Product'],
    }),
    updateStock: builder.mutation({
      query: ({ id, stock }) => ({
        url: `/admin/${id}/stock`,
        method: 'PATCH',
        body: { stock },
      }),
      invalidatesTags: ['Product'],
    }),
  }),
})

export const {
  useGetProductsQuery,
  useGetFeaturedProductsQuery,
  useGetCategoriesQuery,
  useGetProductBySlugQuery,
  useGetAdminProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useUpdateStockMutation,
} = productsApi
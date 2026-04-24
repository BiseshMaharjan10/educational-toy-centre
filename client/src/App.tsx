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
import { Link } from 'react-router-dom'

const NotFoundPage = () => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-[#e7cfb4]">
    <h1 className="text-6xl font-bold text-[#84240c]">404</h1>
    <p className="mt-4 text-lg text-[#563232]">Page not found</p>
    <Link to="/" className="mt-6 text-[#84240c] underline">
      Go back home
    </Link>
  </div>
)

export default NotFoundPage
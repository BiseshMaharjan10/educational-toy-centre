import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { useLoginMutation } from '../../features/auth/authApi'
import { setCredentials } from '../../features/auth/authSlice'
import { useAppDispatch } from '../../app/hooks'
import { useToast } from '../../hooks/useToast'

type LoginResponse = {
  success: boolean
  message: string
  data: {
    accessToken: string
    user: {
      id: string
      name: string
      email: string
      role: 'USER' | 'ADMIN'
    }
  }
}

export default function LoginPage() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [login, { isLoading }] = useLoginMutation()
  const { toasts, showToast, removeToast } = useToast()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const isValidEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const normalizedEmail = email.trim().toLowerCase()

    if (!isValidEmail(normalizedEmail)) {
      showToast('Email not valid', 'error')
      return
    }

    if (!password.trim()) {
      showToast('Password is required', 'error')
      return
    }

    try {
      const res = (await login({ email: normalizedEmail, password }).unwrap()) as LoginResponse

      dispatch(
        setCredentials({
          user: res.data.user,
          accessToken: res.data.accessToken,
        })
      )

      navigate('/account', { replace: true })
    } catch (err: any) {
      const rawMessage = err?.data?.message || 'Login failed'
      const message = /invalid email|invalid credentials|unauthorized|not found/i.test(
        rawMessage
      )
        ? 'Wrong email or password'
        : rawMessage
      showToast(message, 'error')
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f6eee4] text-[#3a271a]">
      <header className="relative z-10 px-7 pt-6 md:px-8 md:pt-7">
        <span className="font-serif italic text-[1.05rem] tracking-[0.01em] text-[#3d2b1f]">
          Education Toy Centre
        </span>
      </header>

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-4.5rem)] max-w-[1500px] flex-col justify-center px-4 pb-8 pt-6 md:px-8 lg:px-10">
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.9fr)] lg:gap-16 xl:gap-24">
          <div className="relative max-w-[840px]">
            <div className="relative w-full overflow-hidden shadow-[0_20px_45px_rgba(60,40,20,0.08)] aspect-[1.27] max-h-[520px]">
              <img
                src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80&sat=-100"
                alt="Workshop craftsman reference"
                className="absolute inset-0 h-full w-full object-cover grayscale contrast-125"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.02),rgba(0,0,0,0.18))]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_35%,rgba(255,255,255,0.35),transparent_24%),radial-gradient(circle_at_78%_20%,rgba(255,255,255,0.22),transparent_18%)]" />
            </div>

            <div className="mt-6 max-w-[350px] pl-3 md:mt-7 md:pl-4 lg:absolute lg:left-0 lg:top-[76%] lg:mt-0 lg:max-w-[340px] lg:-translate-y-1/2 lg:pl-0">
              <p className="font-serif italic text-[clamp(1.5rem,2vw,2.4rem)] leading-[1.15] text-[#3d271b]">
                "The soul of the object resides in the silence of its form."
              </p>

              <div className="mt-6 flex items-center gap-4">
                <span className="h-px w-8 bg-[#c96552]" />
                <span className="text-[0.68rem] uppercase tracking-[0.22em] text-[#9d6d54]">
                  Education Toy Centre
                </span>
              </div>
            </div>
          </div>

          <div className="w-full max-w-[420px] lg:pt-14">
            <form className="mt-12 space-y-8" onSubmit={handleSubmit} noValidate>
              <Input
                label="Email"
                type="text"
                inputMode="email"
                autoComplete="email"
                placeholder="EMAIL ADDRESS"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                className="tracking-[0.35em]"
                showVisibilityToggle
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />

              <Button className="mt-2" showArrow type="submit" disabled={isLoading}>
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
            </form>

            <div className="mt-6">
              <span
                onClick={() => navigate('/forgot-password')}
                className="cursor-pointer text-[0.66rem] uppercase tracking-[0.22em] text-[#8f6f5a] hover:underline"
              >
                Forgot password?
              </span>
            </div>

            <div className="mt-6 text-center">
              <span className="text-[0.9rem] text-[#8f6f5a]">
                Don&apos;t have an account?{' '}
              </span>
              <span
                onClick={() => navigate('/register')}
                className="cursor-pointer text-[0.9rem] font-semibold text-[#8f2a22] underline"
              >
                Sign Up
              </span>
            </div>
          </div>
        </div>

        <p className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-center text-[0.62rem] uppercase leading-[1.55] tracking-[0.18em] text-[#b89a7e]">
          Est. 1924 © Education Toy Centre Provenance.
          <br />
          All pieces archived and authenticated.
        </p>
      </section>

      <div className="fixed right-4 top-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <button
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            className={
              toast.type === 'error'
                ? 'block rounded-md bg-[#8f2a22] px-4 py-3 text-left text-sm text-[#f7eee5] shadow-lg'
                : toast.type === 'success'
                  ? 'block rounded-md bg-green-700 px-4 py-3 text-left text-sm text-white shadow-lg'
                  : 'block rounded-md bg-[#3a271a] px-4 py-3 text-left text-sm text-white shadow-lg'
            }
          >
            {toast.message}
          </button>
        ))}
      </div>
    </main>
  )
}
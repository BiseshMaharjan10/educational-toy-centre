import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { useResetPasswordMutation } from '../../features/auth/authApi'
import { useToast } from '../../hooks/useToast'

type ApiMessageResponse = {
	success: boolean
	message: string
}

export default function ResetPasswordPage() {
	const navigate = useNavigate()
	const [searchParams] = useSearchParams()
	const [resetPassword, { isLoading }] = useResetPasswordMutation()
	const { toasts, showToast, removeToast } = useToast()

	const [email, setEmail] = useState(searchParams.get('email') || '')
	const [otp, setOtp] = useState('')
	const [newPassword, setNewPassword] = useState('')

	const isValidEmail = (value: string) =>
		/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

	const handleOtpChange = (value: string) => {
		setOtp(value.replace(/\D/g, '').slice(0, 6))
	}

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()

		const normalizedEmail = email.trim().toLowerCase()
		const normalizedOtp = otp.replace(/\D/g, '')

		if (!isValidEmail(normalizedEmail)) {
			showToast('Email not valid', 'error')
			return
		}

		if (normalizedOtp.length !== 6) {
			showToast('OTP must be 6 digits', 'error')
			return
		}

		if (newPassword.trim().length < 8) {
			showToast('Password must be at least 8 characters', 'error')
			return
		}

		try {
			const res = (await resetPassword({
				email: normalizedEmail,
				otp: normalizedOtp,
				newPassword,
			}).unwrap()) as ApiMessageResponse

			showToast(res.message || 'Password reset successful', 'success')
			navigate('/login', { replace: true })
		} catch (err: any) {
			showToast(err?.data?.message || 'Password reset failed', 'error')
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
						<div className="relative aspect-[1.27] max-h-[520px] w-full overflow-hidden shadow-[0_20px_45px_rgba(60,40,20,0.08)]">
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
						<form className="mt-12 space-y-6" onSubmit={handleSubmit} noValidate>
							<Input
								label="Email Address"
								type="text"
								inputMode="email"
								autoComplete="email"
								placeholder="Email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
							/>

							<Input
								label="OTP Code"
								type="text"
								inputMode="numeric"
								pattern="[0-9]*"
								maxLength={6}
								placeholder="6 digit code"
								value={otp}
								onChange={(e) => handleOtpChange(e.target.value)}
								required
							/>

							<Input
								label="New Password"
								type="password"
								placeholder="New password"
								className="tracking-[0.35em]"
								showVisibilityToggle
								value={newPassword}
								onChange={(e) => setNewPassword(e.target.value)}
								autoComplete="new-password"
								required
							/>

							<Button className="mt-2" showArrow type="submit" disabled={isLoading}>
								{isLoading ? 'Resetting...' : 'Reset Password'}
							</Button>
						</form>

						<div className="mt-6">
							<span
								onClick={() => navigate('/login')}
								className="cursor-pointer text-[0.75rem] uppercase tracking-[0.2em] text-[#8f6f5a] underline"
							>
								Back to Login
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

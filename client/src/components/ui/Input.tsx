import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import type { InputHTMLAttributes } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
	label: string
	labelClassName?: string
	containerClassName?: string
	showVisibilityToggle?: boolean
}

export default function Input({
	label,
	labelClassName = '',
	containerClassName = '',
	className = '',
	type = 'text',
	showVisibilityToggle = false,
	...props
}: InputProps) {
	const [isVisible, setIsVisible] = useState(false)
	const isPasswordField = type === 'password' && showVisibilityToggle
	const resolvedType = isPasswordField && isVisible ? 'text' : type
	const paddingRightClass = isPasswordField ? 'pr-11' : ''

	return (
		<label className={`block ${containerClassName}`}>
			<span className={`mb-3 block text-[0.66rem] uppercase tracking-[0.24em] text-[#6b5649] ${labelClassName}`}>
				{label}
			</span>
			<div className="relative">
				<input
					type={resolvedType}
					className={`w-full border-0 border-b border-[#ddb997] bg-transparent px-0 pb-3 text-[0.72rem] tracking-[0.2em] text-[#b08b67] outline-none placeholder:text-[#d8c2a4] ${paddingRightClass} ${className}`}
					{...props}
				/>
				{isPasswordField ? (
					<button
						type="button"
						onClick={() => setIsVisible((current) => !current)}
						aria-label={isVisible ? 'Hide password' : 'Show password'}
						className="absolute right-0 top-0 flex h-full items-center justify-center px-0 text-[#b08b67] transition-colors hover:text-[#3d2b1f]"
					>
						{isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
					</button>
				) : null}
			</div>
		</label>
	)
}

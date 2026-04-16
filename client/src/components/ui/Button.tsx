import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: ButtonVariant
	children: ReactNode
	showArrow?: boolean
}

const baseClasses =
	'inline-flex h-[3.5rem] items-center justify-between gap-4 px-7 text-[0.72rem] uppercase tracking-[0.28em] transition-colors'

const variantClasses: Record<ButtonVariant, string> = {
	primary:
		'w-full bg-[#8f2a22] text-[#f7eee5] shadow-[0_10px_30px_rgba(143,42,34,0.22)] hover:bg-[#7c221b]',
}

export default function Button({
	variant = 'primary',
	showArrow = false,
	children,
	className = '',
	...props
}: ButtonProps) {
	return (
		<button className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
			<span>{children}</span>
			{showArrow ? (
				<span aria-hidden="true" className="text-base leading-none">
					→
				</span>
			) : null}
		</button>
	)
}

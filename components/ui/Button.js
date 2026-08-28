"use client";

const variants = {
	primary: "bg-custom-blue text-white hover:bg-custom-button-green",
	secondary: "bg-button-gray text-text-dark hover:bg-border-gray",
	danger: "bg-red-600 text-white hover:bg-red-700",
};

export default function Button({
	variant = "primary",
	isLoading = false,
	disabled = false,
	className = "",
	children,
	...props
}) {
	return (
		<button
			disabled={disabled || isLoading}
			className={`px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
			{...props}
		>
			{isLoading ? "..." : children}
		</button>
	);
}

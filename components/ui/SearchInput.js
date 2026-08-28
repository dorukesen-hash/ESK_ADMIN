"use client";

import { Search } from "lucide-react";

export default function SearchInput({ value, onChange, placeholder = "Ara..." }) {
	return (
		<div className="relative w-full max-w-xs">
			<Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-light" />
			<input
				type="text"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				className="w-full border border-border-gray py-2 pl-9 pr-3 text-sm text-text-dark focus:border-custom-blue focus:outline-none"
			/>
		</div>
	);
}

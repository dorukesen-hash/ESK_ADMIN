"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ page, totalPages, onPageChange }) {
	if (!totalPages || totalPages <= 1) return null;

	return (
		<div className="mt-4 flex items-center justify-center gap-4">
			<button
				type="button"
				disabled={page <= 1}
				onClick={() => onPageChange(page - 1)}
				className="text-text-dark transition disabled:opacity-30"
			>
				<ChevronLeft size={18} />
			</button>
			<span className="text-sm text-text-light">
				{page} / {totalPages}
			</span>
			<button
				type="button"
				disabled={page >= totalPages}
				onClick={() => onPageChange(page + 1)}
				className="text-text-dark transition disabled:opacity-30"
			>
				<ChevronRight size={18} />
			</button>
		</div>
	);
}

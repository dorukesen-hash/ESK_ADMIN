"use client";

import { ChevronRight } from "lucide-react";

export default function CatalogBreadcrumb({ items }) {
	return (
		<div className="flex flex-wrap items-center gap-1">
			{items.map((item, index) => {
				const isLast = index === items.length - 1;
				return (
					<span key={`${item.label}-${index}`} className="flex items-center gap-1">
						{index > 0 && <ChevronRight size={13} className="text-border-gray" />}
						{isLast ? (
							<span className="text-sm font-semibold text-text-dark">{item.label}</span>
						) : (
							<button
								type="button"
								onClick={item.onClick}
								className="text-sm font-medium text-text-light hover:text-custom-blue hover:underline"
							>
								{item.label}
							</button>
						)}
					</span>
				);
			})}
		</div>
	);
}

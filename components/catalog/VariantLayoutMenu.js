"use client";

import { useEffect, useRef, useState } from "react";
import { Bookmark, ChevronDown, Trash2 } from "lucide-react";

// Layouts are per-browser (localStorage), not shared across the team or
// devices - a deliberate scoping choice to avoid a backend schema change for
// what's fundamentally a personal "which columns am I looking at" preference.
const STORAGE_KEY = "esk-admin-variant-layouts";

function loadLayouts() {
	if (typeof window === "undefined") return {};
	try {
		return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
	} catch (error) {
		return {};
	}
}

function persistLayouts(layouts) {
	window.localStorage.setItem(STORAGE_KEY, JSON.stringify(layouts));
}

export default function VariantLayoutMenu({ visibility, onApply }) {
	const [open, setOpen] = useState(false);
	const [layouts, setLayouts] = useState({});
	const ref = useRef(null);

	useEffect(() => {
		setLayouts(loadLayouts());
	}, []);

	useEffect(() => {
		const handleClickOutside = (e) => {
			if (ref.current && !ref.current.contains(e.target)) setOpen(false);
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleSaveCurrent = () => {
		const name = window.prompt("Name this layout:");
		if (!name) return;
		const next = { ...layouts, [name]: visibility };
		setLayouts(next);
		persistLayouts(next);
	};

	const handleDelete = (name, e) => {
		e.stopPropagation();
		if (!window.confirm(`Delete layout "${name}"?`)) return;
		const next = { ...layouts };
		delete next[name];
		setLayouts(next);
		persistLayouts(next);
	};

	const names = Object.keys(layouts);

	return (
		<div className="relative" ref={ref}>
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				className="flex items-center gap-1.5 border border-border-gray bg-white px-3 py-2 text-sm font-medium text-text-dark hover:bg-button-gray"
			>
				<Bookmark size={15} />
				Layouts
				<ChevronDown size={14} />
			</button>
			{open && (
				<div className="absolute right-0 z-20 mt-1 w-64 border border-border-gray bg-white shadow-custom">
					{names.length === 0 && (
						<div className="px-3 py-3 text-sm text-text-light">No saved layouts yet.</div>
					)}
					{names.map((name) => (
						<div
							key={name}
							className="flex items-center justify-between px-3 py-2 text-sm text-text-dark hover:bg-custom-table-soft-blue"
						>
							<button
								type="button"
								onClick={() => {
									onApply(layouts[name]);
									setOpen(false);
								}}
								className="flex-1 truncate text-left"
							>
								{name}
							</button>
							<button
								type="button"
								onClick={(e) => handleDelete(name, e)}
								className="text-text-light hover:text-red-600"
							>
								<Trash2 size={14} />
							</button>
						</div>
					))}
					<div className="border-t border-border-gray p-2">
						<button
							type="button"
							onClick={handleSaveCurrent}
							className="w-full px-2 py-1.5 text-left text-sm font-medium text-custom-blue hover:bg-custom-table-soft-blue"
						>
							+ Save current as...
						</button>
					</div>
				</div>
			)}
		</div>
	);
}

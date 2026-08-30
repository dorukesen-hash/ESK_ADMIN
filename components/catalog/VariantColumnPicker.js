"use client";

import { useEffect, useRef, useState } from "react";
import { SlidersHorizontal, ChevronDown } from "lucide-react";
import { VARIANT_FIELD_GROUPS } from "./variantFieldConfig";

export default function VariantColumnPicker({ visibility, onChange }) {
	const [open, setOpen] = useState(false);
	const ref = useRef(null);

	useEffect(() => {
		const handleClickOutside = (e) => {
			if (ref.current && !ref.current.contains(e.target)) setOpen(false);
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const isVisible = (key) => visibility[key] !== false;

	const toggleField = (key) => {
		onChange({ ...visibility, [key]: !isVisible(key) });
	};

	const toggleGroup = (group, makeVisible) => {
		const next = { ...visibility };
		group.fields.forEach((f) => {
			next[f.key] = makeVisible;
		});
		onChange(next);
	};

	const visibleCount = VARIANT_FIELD_GROUPS.reduce(
		(acc, g) => acc + g.fields.filter((f) => isVisible(f.key)).length,
		0
	);

	return (
		<div className="relative" ref={ref}>
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				className="flex items-center gap-1.5 border border-border-gray bg-white px-3 py-2 text-sm font-medium text-text-dark hover:bg-button-gray"
			>
				<SlidersHorizontal size={15} />
				Columns <span className="text-text-light">({visibleCount})</span>
				<ChevronDown size={14} />
			</button>
			{open && (
				<div className="absolute right-0 z-20 mt-1 max-h-[70vh] w-80 overflow-y-auto border border-border-gray bg-white shadow-custom">
					{VARIANT_FIELD_GROUPS.map((group) => {
						const groupVisibleCount = group.fields.filter((f) => isVisible(f.key)).length;
						const allVisible = groupVisibleCount === group.fields.length;
						return (
							<div key={group.id} className="border-b border-border-gray last:border-b-0">
								<div className="flex items-center justify-between bg-button-gray px-3 py-2">
									<span className="text-xs font-semibold uppercase tracking-wide text-text-dark">{group.label}</span>
									<button
										type="button"
										onClick={() => toggleGroup(group, !allVisible)}
										className="text-xs font-medium text-custom-blue hover:underline"
									>
										{allVisible ? "Hide all" : "Show all"}
									</button>
								</div>
								<div className="p-2">
									{group.fields.map((field) => (
										<label
											key={field.key}
											className="flex items-center gap-2 px-1 py-1 text-sm text-text-dark hover:bg-custom-table-soft-blue"
										>
											<input
												type="checkbox"
												checked={isVisible(field.key)}
												onChange={() => toggleField(field.key)}
												className="h-4 w-4 border-border-gray text-custom-blue focus:ring-custom-blue"
											/>
											{field.label}
										</label>
									))}
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}

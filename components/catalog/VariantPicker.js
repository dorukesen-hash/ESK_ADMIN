"use client";

import { useState } from "react";
import SearchInput from "@/components/ui/SearchInput";
import { useVariantSearch } from "@/hooks/catalog/useFeatured";

export default function VariantPicker({ onSelect, excludeIds = [], placeholder = "Varyant ara..." }) {
	const [query, setQuery] = useState("");
	const { data: results = [], isFetching } = useVariantSearch(query);
	const filtered = results.filter((v) => !excludeIds.includes(v.id));

	return (
		<div>
			<SearchInput value={query} onChange={setQuery} placeholder={placeholder} />
			{query.length > 1 && (
				<div className="mt-2 max-h-48 overflow-y-auto border border-border-gray bg-white shadow-custom">
					{isFetching && <div className="px-3 py-2 text-sm text-text-light">Aranıyor...</div>}
					{!isFetching && filtered.length === 0 && (
						<div className="px-3 py-2 text-sm text-text-light">Sonuç yok</div>
					)}
					{filtered.map((v) => (
						<button
							key={v.id}
							type="button"
							onClick={() => {
								onSelect(v);
								setQuery("");
							}}
							className="block w-full px-3 py-2 text-left text-sm text-text-dark hover:bg-custom-table-soft-blue"
						>
							{v.title} <span className="text-text-light">({v.stock})</span>
						</button>
					))}
				</div>
			)}
		</div>
	);
}

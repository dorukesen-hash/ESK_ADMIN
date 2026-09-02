"use client";

import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

// Sorting is opt-in and backward compatible: a column only becomes
// clickable if it sets `sortable: true`, and only if the page also passes
// `sortState`/`onSortChange` - existing callers that pass neither keep
// working exactly as before.
export default function DataTable({
	columns,
	rows,
	getRowId,
	isLoading = false,
	emptyMessage = "Kayıt bulunamadı",
	loadingMessage = "Yükleniyor...",
	actionsLabel = "İşlemler",
	actions,
	onRowClick,
	sortState,
	onSortChange,
}) {
	const handleHeaderClick = (col) => {
		if (!col.sortable || !onSortChange) return;
		const isSameColumn = sortState?.id === col.key;
		onSortChange({ id: col.key, desc: isSameColumn ? !sortState.desc : false });
	};
	if (isLoading) {
		return (
			<div className="bg-white p-8 text-center text-sm text-text-light shadow-custom">
				{loadingMessage}
			</div>
		);
	}

	if (!rows || rows.length === 0) {
		return (
			<div className="bg-white p-8 text-center text-sm text-text-light shadow-custom">
				{emptyMessage}
			</div>
		);
	}

	return (
		<div className="overflow-x-auto bg-white shadow-custom">
			<table className="min-w-full divide-y divide-border-gray text-sm">
				<thead className="bg-custom-table-head">
					<tr>
						{columns.map((col) => (
							<th
								key={col.key}
								onClick={() => handleHeaderClick(col)}
								className={`whitespace-nowrap px-4 py-3 text-left font-semibold text-text-dark ${
									col.sortable && onSortChange ? "cursor-pointer select-none" : ""
								}`}
							>
								{col.sortable && onSortChange ? (
									<span className="inline-flex items-center gap-1">
										{col.header}
										{sortState?.id === col.key ? (
											sortState.desc ? <ChevronDown size={14} /> : <ChevronUp size={14} />
										) : (
											<ChevronsUpDown size={14} className="text-text-light" />
										)}
									</span>
								) : (
									col.header
								)}
							</th>
						))}
						{actions && (
							<th className="whitespace-nowrap px-4 py-3 text-right font-semibold text-text-dark">
								{actionsLabel}
							</th>
						)}
					</tr>
				</thead>
				<tbody className="divide-y divide-border-gray">
					{rows.map((row) => (
						<tr
							key={getRowId(row)}
							onClick={onRowClick ? () => onRowClick(row) : undefined}
							className={`hover:bg-custom-table-soft-blue ${onRowClick ? "cursor-pointer" : ""}`}
						>
							{columns.map((col) => (
								<td key={col.key} className="whitespace-nowrap px-4 py-3 text-text-dark">
									{col.render ? col.render(row) : row[col.key]}
								</td>
							))}
							{actions && (
								<td className="whitespace-nowrap px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
									{actions(row)}
								</td>
							)}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

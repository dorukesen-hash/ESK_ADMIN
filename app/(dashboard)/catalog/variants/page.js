"use client";

import { useCallback, useMemo, useState } from "react";
import {
	useReactTable,
	getCoreRowModel,
	getFilteredRowModel,
	getSortedRowModel,
	flexRender,
} from "@tanstack/react-table";
import { ChevronUp, ChevronDown } from "lucide-react";
import { useAllVariants, useUpdateVariantField } from "@/hooks/catalog/useVariants";
import { ALL_VARIANT_FIELDS, DEFAULT_VISIBLE_KEYS } from "@/components/catalog/variantFieldConfig";
import VariantGridCell from "@/components/catalog/VariantGridCell";
import VariantColumnPicker from "@/components/catalog/VariantColumnPicker";
import VariantLayoutMenu from "@/components/catalog/VariantLayoutMenu";
import { notifyError } from "@/lib/toast";

function buildInitialVisibility() {
	const visibility = {};
	ALL_VARIANT_FIELDS.forEach((f) => {
		visibility[f.key] = DEFAULT_VISIBLE_KEYS.includes(f.key);
	});
	return visibility;
}

const textFilterFn = (row, columnId, filterValue) => {
	if (!filterValue) return true;
	const cellValue = row.getValue(columnId);
	return String(cellValue ?? "")
		.toLowerCase()
		.includes(String(filterValue).toLowerCase());
};

const booleanFilterFn = (row, columnId, filterValue) => {
	if (!filterValue || filterValue === "all") return true;
	const cellValue = Boolean(row.getValue(columnId));
	return filterValue === "yes" ? cellValue : !cellValue;
};

export default function VariantsGridPage() {
	const { data: variants = [], isLoading } = useAllVariants();
	const updateField = useUpdateVariantField();

	const [columnVisibility, setColumnVisibility] = useState(buildInitialVisibility);
	const [columnFilters, setColumnFilters] = useState([]);
	const [sorting, setSorting] = useState([]);

	// getVariantsForAdmin's Category/Subcategory/Product includes are unrestricted
	// full associations - project down to just the names the grid shows.
	const rows = useMemo(
		() =>
			variants.map((v) => ({
				...v,
				categoryName: v.category?.name ?? "-",
				subcategoryName: v.subcategory?.name ?? "-",
				productName: v.product?.title ?? "-",
			})),
		[variants]
	);

	const handleSave = useCallback(
		async (id, field, value) => {
			try {
				await updateField.mutateAsync({ id, field, value });
			} catch (error) {
				notifyError(`Could not save "${field}".`);
				throw error;
			}
		},
		[updateField]
	);

	const columns = useMemo(
		() =>
			ALL_VARIANT_FIELDS.map((field) => ({
				accessorKey: field.key,
				id: field.key,
				header: (ctx) => <ColumnHeaderCell column={ctx.column} field={field} />,
				cell: (ctx) =>
					field.type === "readonly" ? (
						<VariantGridCell value={ctx.getValue()} type="readonly" />
					) : (
						<VariantGridCell
							value={ctx.getValue()}
							type={field.type}
							decimal={field.decimal}
							onSave={(value) => handleSave(ctx.row.original.id, field.key, value)}
						/>
					),
				filterFn: field.type === "boolean" ? booleanFilterFn : textFilterFn,
				size: field.type === "boolean" ? 90 : field.key === "title" ? 260 : 150,
			})),
		[handleSave]
	);

	const table = useReactTable({
		data: rows,
		columns,
		state: { columnVisibility, columnFilters, sorting },
		onColumnVisibilityChange: setColumnVisibility,
		onColumnFiltersChange: setColumnFilters,
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel(),
	});

	const visibleRowCount = table.getFilteredRowModel().rows.length;

	return (
		<div>
			<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
				<div>
					<h1 className="font-montserrat text-xl font-semibold text-text-dark">Variants</h1>
					<p className="text-sm text-text-light">
						{visibleRowCount} of {rows.length} variants — edits save automatically.
					</p>
				</div>
				<div className="flex items-center gap-2">
					<VariantLayoutMenu visibility={columnVisibility} onApply={setColumnVisibility} />
					<VariantColumnPicker visibility={columnVisibility} onChange={setColumnVisibility} />
				</div>
			</div>

			{isLoading ? (
				<div className="bg-white p-8 text-center text-sm text-text-light shadow-custom">Loading...</div>
			) : (
				<div className="overflow-auto bg-white shadow-custom" style={{ maxHeight: "calc(100vh - 220px)" }}>
					<table className="border-collapse text-sm" style={{ width: table.getTotalSize() }}>
						<thead className="sticky top-0 z-10">
							{table.getHeaderGroups().map((headerGroup) => (
								<tr key={headerGroup.id}>
									{headerGroup.headers.map((header) => (
										<th
											key={header.id}
											style={{ width: header.getSize() }}
											className={`border-b border-r border-border-gray bg-custom-table-head align-top ${
												header.column.id === "title" ? "sticky left-0 z-20" : ""
											}`}
										>
											{flexRender(header.column.columnDef.header, header.getContext())}
										</th>
									))}
								</tr>
							))}
						</thead>
						<tbody>
							{table.getRowModel().rows.map((row) => (
								<tr key={row.id} className="hover:bg-custom-table-soft-blue">
									{row.getVisibleCells().map((cell) => (
										<td
											key={cell.id}
											style={{ width: cell.column.getSize() }}
											className={`border-b border-r border-border-gray ${
												cell.column.id === "title" ? "sticky left-0 z-[5] bg-white" : ""
											}`}
										>
											{flexRender(cell.column.columnDef.cell, cell.getContext())}
										</td>
									))}
								</tr>
							))}
							{table.getRowModel().rows.length === 0 && (
								<tr>
									<td
										colSpan={table.getVisibleLeafColumns().length}
										className="p-8 text-center text-sm text-text-light"
									>
										No variants match the current filters.
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}

function ColumnHeaderCell({ column, field }) {
	const sorted = column.getIsSorted();
	const filterValue = column.getFilterValue();

	return (
		<div className="select-none">
			<button
				type="button"
				onClick={column.getToggleSortingHandler()}
				className="flex w-full items-center gap-1 px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-text-dark hover:text-custom-blue"
			>
				<span className="truncate">{field.label}</span>
				{sorted === "asc" && <ChevronUp size={11} />}
				{sorted === "desc" && <ChevronDown size={11} />}
			</button>
			{field.type !== "readonly" && (
				<div className="px-1.5 pb-1.5">
					{field.type === "boolean" ? (
						<select
							value={filterValue ?? "all"}
							onChange={(e) => column.setFilterValue(e.target.value === "all" ? undefined : e.target.value)}
							className="w-full border border-border-gray bg-white px-1 py-1 text-xs text-text-dark"
						>
							<option value="all">All</option>
							<option value="yes">Yes</option>
							<option value="no">No</option>
						</select>
					) : (
						<input
							type="text"
							value={filterValue ?? ""}
							onChange={(e) => column.setFilterValue(e.target.value || undefined)}
							placeholder="Filter..."
							className="w-full border border-border-gray bg-white px-1.5 py-1 text-xs text-text-dark focus:border-custom-blue focus:outline-none"
						/>
					)}
				</div>
			)}
		</div>
	);
}

"use client";

import { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import {
	useReactTable,
	getCoreRowModel,
	getFilteredRowModel,
	getSortedRowModel,
	flexRender,
} from "@tanstack/react-table";
import { ChevronUp, ChevronDown, History, Table2, Image as ImageIcon, PencilLine } from "lucide-react";
import Button from "@/components/ui/Button";
import { useAllVariants, useUpdateVariantField } from "@/hooks/catalog/useVariants";
import { ALL_VARIANT_FIELDS, DEFAULT_VISIBLE_KEYS } from "@/components/catalog/variantFieldConfig";
import VariantGridCell from "@/components/catalog/VariantGridCell";
import VariantColumnPicker from "@/components/catalog/VariantColumnPicker";
import VariantLayoutMenu from "@/components/catalog/VariantLayoutMenu";
import MassEditModal from "@/components/catalog/MassEditModal";
import VariantHistoryModal from "@/components/catalog/VariantHistoryModal";
import BulkEditModal from "@/components/catalog/BulkEditModal";
import NodeImagesModal from "@/components/catalog/NodeImagesModal";
import { notifyError } from "@/lib/toast";

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL;

// Pinned columns, left to right - order matters (getStart('left') sums the
// size of every pinned column BEFORE this one, so this array's order is what
// actually determines each column's sticky offset).
const PINNED_LEFT = ["select", "images", "title"];

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

// Deliberately small and padding-light so this never becomes the tallest
// thing in the row - a full-size thumbnail would grow every row to fit it.
function VariantImageCell({ variant, onOpen }) {
	const images = variant.variant_images ?? [];
	const first = images[0]?.image;

	return (
		<button
			type="button"
			onClick={onOpen}
			title="Manage images"
			className="flex h-full w-full items-center justify-center gap-1 px-1.5 py-1"
		>
			{first ? (
				// next/image's fixed width/height mode (not fill - no positioned
				// wrapper needed for a small fixed element) - lets Next resize the
				// often-huge original down to 20px server-side instead of shipping
				// the full file for a table-cell thumbnail.
				<Image
					src={`${CDN_URL}/${first.url}`}
					alt=""
					width={20}
					height={20}
					className="h-5 w-5 flex-shrink-0 object-cover"
				/>
			) : (
				<span className="flex h-5 w-5 flex-shrink-0 items-center justify-center border border-dashed border-border-gray text-text-light">
					<ImageIcon size={11} />
				</span>
			)}
			{images.length > 1 && <span className="text-[10px] text-text-light">+{images.length - 1}</span>}
		</button>
	);
}

// Common style for a pinned (sticky-left) header/cell - offset computed by
// TanStack from the actual sizes of every pinned column before this one, not
// hand-counted, so it stays correct if a pinned column's size ever changes.
function pinnedStyle(column) {
	if (!column.getIsPinned()) return {};
	return { position: "sticky", left: column.getStart("left"), zIndex: column.getIsPinned() ? 2 : 1 };
}

export default function VariantsGridPage() {
	const { data: variants = [], isLoading } = useAllVariants();
	// Destructure just the stable mutateAsync function, not the whole mutation
	// result object - useMutation() returns a NEW object every render (isPending
	// etc. are render-time state) even though mutateAsync itself is memoized, so
	// depending on the whole object below would recreate handleSave -> columns
	// -> every header/cell render function on every render, tearing down and
	// rebuilding the filter <input> DOM nodes and losing focus on each keystroke.
	const { mutateAsync: saveVariantField } = useUpdateVariantField();

	const [columnVisibility, setColumnVisibility] = useState(buildInitialVisibility);
	const [columnFilters, setColumnFilters] = useState([]);
	const [sorting, setSorting] = useState([]);
	const [columnSizing, setColumnSizing] = useState({});
	const [rowSelection, setRowSelection] = useState({});
	const [massEditOpen, setMassEditOpen] = useState(false);
	const [bulkEditOpen, setBulkEditOpen] = useState(false);
	const [historyVariant, setHistoryVariant] = useState(null);
	const [imagesVariant, setImagesVariant] = useState(null);

	const openHistory = useCallback((variant) => setHistoryVariant(variant), []);
	const openImages = useCallback((variant) => setImagesVariant(variant), []);

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
				await saveVariantField({ id, field, value });
			} catch (error) {
				notifyError(`Could not save "${field}".`);
				throw error;
			}
		},
		[saveVariantField]
	);

	const columns = useMemo(() => {
		const selectColumn = {
			id: "select",
			header: ({ table }) => (
				<div className="flex h-full items-center justify-center px-2">
					<input
						type="checkbox"
						checked={table.getIsAllRowsSelected()}
						ref={(el) => {
							if (el) el.indeterminate = table.getIsSomeRowsSelected() && !table.getIsAllRowsSelected();
						}}
						onChange={table.getToggleAllRowsSelectedHandler()}
						className="h-4 w-4 border-border-gray text-custom-blue focus:ring-custom-blue"
					/>
				</div>
			),
			cell: ({ row }) => (
				<div className="flex h-full items-center justify-center px-2">
					<input
						type="checkbox"
						checked={row.getIsSelected()}
						onChange={row.getToggleSelectedHandler()}
						className="h-4 w-4 border-border-gray text-custom-blue focus:ring-custom-blue"
					/>
				</div>
			),
			size: 40,
			enableResizing: false,
			enableSorting: false,
		};

		const imagesColumn = {
			id: "images",
			header: () => (
				<div className="flex h-full items-center px-1.5 text-xs font-semibold uppercase tracking-wide text-text-dark">
					<ImageIcon size={12} />
				</div>
			),
			cell: (ctx) => <VariantImageCell variant={ctx.row.original} onOpen={() => openImages(ctx.row.original)} />,
			size: 60,
			enableResizing: false,
			enableSorting: false,
		};

		const fieldColumns = ALL_VARIANT_FIELDS.map((field) => ({
			accessorKey: field.key,
			id: field.key,
			header: (ctx) => <ColumnHeaderCell column={ctx.column} field={field} />,
			cell: (ctx) => {
				const editor =
					field.type === "readonly" ? (
						<VariantGridCell value={ctx.getValue()} type="readonly" />
					) : (
						<VariantGridCell
							value={ctx.getValue()}
							type={field.type}
							decimal={field.decimal}
							onSave={(value) => handleSave(ctx.row.original.id, field.key, value)}
						/>
					);
				if (field.key !== "title") return editor;
				return (
					<div className="flex items-center">
						<div className="min-w-0 flex-1">{editor}</div>
						<button
							type="button"
							onClick={() => openHistory(ctx.row.original)}
							title="History"
							className="mr-1 flex-shrink-0 text-text-light hover:text-custom-blue"
						>
							<History size={14} />
						</button>
					</div>
				);
			},
			filterFn: field.type === "boolean" ? booleanFilterFn : textFilterFn,
			size: field.type === "boolean" ? 90 : field.key === "title" ? 280 : 150,
		}));

		return [selectColumn, imagesColumn, ...fieldColumns];
	}, [handleSave, openHistory, openImages]);

	const table = useReactTable({
		data: rows,
		columns,
		state: {
			columnVisibility,
			columnFilters,
			sorting,
			columnSizing,
			rowSelection,
			columnPinning: { left: PINNED_LEFT },
		},
		getRowId: (row) => row.id,
		onColumnVisibilityChange: setColumnVisibility,
		onColumnFiltersChange: setColumnFilters,
		onSortingChange: setSorting,
		onColumnSizingChange: setColumnSizing,
		onRowSelectionChange: setRowSelection,
		enableRowSelection: true,
		columnResizeMode: "onChange",
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel(),
	});

	const visibleRowCount = table.getFilteredRowModel().rows.length;
	const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id]);
	const imagesTargetImages = imagesVariant
		? (imagesVariant.variant_images ?? []).map((vi) => ({ id: vi.imageId, url: vi.image?.url }))
		: [];

	return (
		<>
		{/* h-full fills the dashboard main's actual remaining height (Topbar +
		main's own padding already accounted for by the flex chain) instead of
		a hand-guessed calc() - the toolbar row takes its natural height,
		the table area below (flex-1 min-h-0) takes exactly what's left, and
		min-w-0 throughout keeps a wide table scrolling INSIDE this page
		rather than blowing out the whole dashboard column (see the matching
		min-w-0 fix in app/(dashboard)/layout.js). */}
		<div className="flex h-full min-w-0 flex-col">
			<div className="mb-4 flex flex-shrink-0 flex-wrap items-center justify-between gap-3">
				<div>
					<h1 className="font-montserrat text-xl font-semibold text-text-dark">Variants</h1>
					<p className="text-sm text-text-light">
						{visibleRowCount} of {rows.length} variants — edits save automatically.
					</p>
				</div>
				<div className="flex items-center gap-2">
					{selectedIds.length > 0 && (
						<Button variant="secondary" onClick={() => setBulkEditOpen(true)}>
							<span className="flex items-center gap-1.5">
								<PencilLine size={15} /> Bulk Edit ({selectedIds.length})
							</span>
						</Button>
					)}
					<VariantLayoutMenu visibility={columnVisibility} onApply={setColumnVisibility} />
					<Button variant="secondary" onClick={() => setMassEditOpen(true)}>
						<span className="flex items-center gap-1.5">
							<Table2 size={15} /> Mass Edit
						</span>
					</Button>
					<VariantColumnPicker visibility={columnVisibility} onChange={setColumnVisibility} />
				</div>
			</div>

			{isLoading ? (
				<div className="bg-white p-8 text-center text-sm text-text-light shadow-custom">Loading...</div>
			) : (
				<div className="min-h-0 w-full min-w-0 flex-1 overflow-auto bg-white shadow-custom">
					<table className="border-collapse text-sm" style={{ width: table.getTotalSize() }}>
						<thead className="sticky top-0 z-10">
							{table.getHeaderGroups().map((headerGroup) => (
								<tr key={headerGroup.id}>
									{headerGroup.headers.map((header) => (
										<th
											key={header.id}
											style={{ width: header.getSize(), ...pinnedStyle(header.column) }}
											className="relative border-b border-r border-border-gray bg-custom-table-head align-top"
										>
											{flexRender(header.column.columnDef.header, header.getContext())}
											{header.column.getCanResize() && (
												<div
													onMouseDown={header.getResizeHandler()}
													onTouchStart={header.getResizeHandler()}
													className={`absolute right-0 top-0 h-full w-1.5 cursor-col-resize select-none touch-none hover:bg-custom-blue ${
														header.column.getIsResizing() ? "bg-custom-blue" : ""
													}`}
												/>
											)}
										</th>
									))}
								</tr>
							))}
						</thead>
						<tbody>
							{table.getRowModel().rows.map((row) => (
								<tr
									key={row.id}
									className={row.getIsSelected() ? "bg-custom-table-soft-blue" : "hover:bg-custom-table-soft-blue"}
								>
									{row.getVisibleCells().map((cell) => (
										<td
											key={cell.id}
											style={{ width: cell.column.getSize(), ...pinnedStyle(cell.column) }}
											className={`border-b border-r border-border-gray ${
												cell.column.getIsPinned() ? (row.getIsSelected() ? "bg-custom-table-soft-blue" : "bg-white") : ""
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

		<MassEditModal open={massEditOpen} onClose={() => setMassEditOpen(false)} />
		<BulkEditModal
			open={bulkEditOpen}
			onClose={() => setBulkEditOpen(false)}
			variantIds={selectedIds.map(Number)}
			onApplied={() => setRowSelection({})}
		/>
		<VariantHistoryModal
			open={Boolean(historyVariant)}
			onClose={() => setHistoryVariant(null)}
			variant={historyVariant}
		/>
		<NodeImagesModal
			open={Boolean(imagesVariant)}
			onClose={() => setImagesVariant(null)}
			target="variant"
			targetId={imagesVariant?.id}
			currentImages={imagesTargetImages}
		/>
	</>
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

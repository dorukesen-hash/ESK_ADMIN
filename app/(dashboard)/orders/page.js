"use client";

import { useState } from "react";
import { Eye, Download, Plus } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import SearchInput from "@/components/ui/SearchInput";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import Button from "@/components/ui/Button";
import { selectClass, inputClass } from "@/components/ui/FormField";
import OrderDetailModal from "@/components/orders/OrderDetailModal";
import ManualOrderFormModal from "@/components/orders/ManualOrderFormModal";
import { useOrders, PAGE_SIZE, useBulkUpdateOrderStatus, useExportOrders } from "@/hooks/orders/useOrders";
import { useOrderStatusList } from "@/hooks/orders/useOrderStatuses";
import { notifySuccess, notifyError } from "@/lib/toast";

// The only status values getOrders' `status` filter recognizes server-side -
// hardcoded to orderstatusId 1-6, independent of the real OrderStatus table.
// Labels must match the real orderstatus.name values exactly (id=1 is
// "Pending" in the DB, not "New" - this used to say "New" and only worked
// by accident since nothing else used that string).
const STATUS_OPTIONS = ["Pending", "In Progress", "Completed", "On Hold", "Cancelled", "Refunded"];

// Pure client-side flag - orders sitting in Pending/In Progress for more
// than a few days are easy to lose track of otherwise.
const STALE_DAYS = 3;
const STALE_STATUS_IDS = [1, 2];
const isStale = (row) =>
	STALE_STATUS_IDS.includes(row.orderstatusId) &&
	row.createdAt &&
	(Date.now() - new Date(row.createdAt).getTime()) / (1000 * 60 * 60 * 24) > STALE_DAYS;

export default function OrdersPage() {
	const [page, setPage] = useState(0);
	const [search, setSearch] = useState("");
	const [searchType, setSearchType] = useState("recipientname");
	const [status, setStatus] = useState("");
	const [dateFrom, setDateFrom] = useState("");
	const [dateTo, setDateTo] = useState("");
	const [sortState, setSortState] = useState(null);
	const [selectedOrderId, setSelectedOrderId] = useState(null);
	const [selectedIds, setSelectedIds] = useState([]);
	const [bulkStatusId, setBulkStatusId] = useState("");
	const [showManualOrder, setShowManualOrder] = useState(false);

	const { data, isLoading } = useOrders({
		page,
		search,
		searchType,
		status,
		dateFrom,
		dateTo,
		sorting: sortState ? [sortState] : [],
	});
	const { data: statuses = [] } = useOrderStatusList();
	const bulkUpdate = useBulkUpdateOrderStatus();
	const exportOrders = useExportOrders();

	const orders = data?.rows ?? [];
	const totalPages = data ? Math.max(1, Math.ceil(data.count / PAGE_SIZE)) : 1;

	const handleSearch = (value) => {
		setSearch(value);
		setPage(0);
	};

	const toggleSelect = (id) => {
		setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
	};

	const toggleSelectAll = () => {
		setSelectedIds(selectedIds.length === orders.length ? [] : orders.map((o) => o.id));
	};

	const handleBulkApply = async () => {
		if (!bulkStatusId || selectedIds.length === 0) return;
		try {
			const res = await bulkUpdate.mutateAsync({ orderIds: selectedIds, orderStatusId: Number(bulkStatusId) });
			const updatedCount = res.data?.updated?.length ?? 0;
			const skipped = res.data?.skipped ?? [];
			if (skipped.length > 0) {
				notifyError(`${updatedCount} sipariş güncellendi, ${skipped.length} sipariş atlandı: ${skipped[0].reason}`);
			} else {
				notifySuccess(`${updatedCount} sipariş güncellendi.`);
			}
			setSelectedIds([]);
			setBulkStatusId("");
		} catch (error) {
			notifyError(error?.response?.data?.message || "Toplu güncelleme başarısız.");
		}
	};

	const handleExport = async () => {
		try {
			const blob = await exportOrders.mutateAsync({ search, searchType, status, dateFrom, dateTo });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `orders-${new Date().toISOString().slice(0, 10)}.xlsx`;
			document.body.appendChild(a);
			a.click();
			a.remove();
			URL.revokeObjectURL(url);
		} catch (error) {
			notifyError("Dışa aktarma başarısız.");
		}
	};

	return (
		<div>
			<PageHeader
				title="Siparişler"
				action={
					<div className="flex gap-2">
						<Button variant="secondary" onClick={handleExport} isLoading={exportOrders.isPending}>
							<span className="flex items-center gap-1">
								<Download size={16} /> Dışa Aktar
							</span>
						</Button>
						<Button onClick={() => setShowManualOrder(true)}>
							<span className="flex items-center gap-1">
								<Plus size={16} /> Yeni Sipariş
							</span>
						</Button>
					</div>
				}
			/>

			<div className="mb-4 flex flex-wrap items-center gap-3">
				<SearchInput value={search} onChange={handleSearch} placeholder="Ara..." />
				<select
					value={searchType}
					onChange={(e) => {
						setSearchType(e.target.value);
						setPage(0);
					}}
					className={`${selectClass} max-w-[10rem]`}
				>
					<option value="recipientname">Alıcı Adı</option>
					<option value="ordernumber">Sipariş No</option>
					<option value="email">E-posta</option>
					<option value="phone">Telefon</option>
				</select>
				<select
					value={status}
					onChange={(e) => {
						setStatus(e.target.value);
						setPage(0);
					}}
					className={`${selectClass} max-w-[10rem]`}
				>
					<option value="">Tüm Durumlar</option>
					{STATUS_OPTIONS.map((s) => (
						<option key={s} value={s}>
							{s}
						</option>
					))}
				</select>
				<input
					type="date"
					value={dateFrom}
					onChange={(e) => {
						setDateFrom(e.target.value);
						setPage(0);
					}}
					className={`${inputClass} max-w-[9rem]`}
				/>
				<span className="text-text-light">–</span>
				<input
					type="date"
					value={dateTo}
					onChange={(e) => {
						setDateTo(e.target.value);
						setPage(0);
					}}
					className={`${inputClass} max-w-[9rem]`}
				/>
			</div>

			{selectedIds.length > 0 && (
				<div className="mb-4 flex items-center gap-3 bg-custom-table-soft-blue p-3">
					<span className="text-sm text-text-dark">{selectedIds.length} sipariş seçildi</span>
					<select value={bulkStatusId} onChange={(e) => setBulkStatusId(e.target.value)} className={`${selectClass} max-w-[10rem]`}>
						<option value="">Durum seçin</option>
						{statuses.map((s) => (
							<option key={s.id} value={s.id}>
								{s.name}
							</option>
						))}
					</select>
					<Button onClick={handleBulkApply} isLoading={bulkUpdate.isPending} disabled={!bulkStatusId}>
						Uygula
					</Button>
					<button type="button" onClick={() => setSelectedIds([])} className="text-sm text-text-light hover:underline">
						Seçimi Temizle
					</button>
				</div>
			)}

			<DataTable
				isLoading={isLoading}
				rows={orders}
				getRowId={(row) => row.id}
				emptyMessage="Sipariş bulunamadı"
				sortState={sortState}
				onSortChange={(next) => {
					setSortState(next);
					setPage(0);
				}}
				columns={[
					{
						key: "_select",
						header: (
							<input
								type="checkbox"
								checked={orders.length > 0 && selectedIds.length === orders.length}
								onChange={toggleSelectAll}
							/>
						),
						render: (row) => (
							<input
								type="checkbox"
								checked={selectedIds.includes(row.id)}
								onChange={() => toggleSelect(row.id)}
								onClick={(e) => e.stopPropagation()}
							/>
						),
					},
					{
						key: "orderNumber",
						header: "Sipariş No",
						sortable: true,
						render: (row) => (
							<span className="flex items-center gap-2">
								{isStale(row) && (
									<span
										title={`${STALE_DAYS} günden fazla süredir bekliyor`}
										className="inline-block h-2 w-2 rounded-full bg-red-500"
									/>
								)}
								{row.orderNumber}
							</span>
						),
					},
					{ key: "name", header: "Alıcı" },
					{ key: "status", header: "Durum", render: (row) => row.orderstatus?.name ?? "-" },
					{ key: "price", header: "Tutar", sortable: true, render: (row) => `$${row.price ?? "0"}` },
					{
						key: "createdAt",
						header: "Tarih",
						sortable: true,
						render: (row) => (row.createdAt ? new Date(row.createdAt).toLocaleDateString("tr-TR") : "-"),
					},
				]}
				actions={(row) => (
					<button
						type="button"
						onClick={() => setSelectedOrderId(row.id)}
						className="text-text-light hover:text-custom-blue"
					>
						<Eye size={16} />
					</button>
				)}
			/>

			<Pagination page={page + 1} totalPages={totalPages} onPageChange={(p) => setPage(p - 1)} />

			<OrderDetailModal orderId={selectedOrderId} onClose={() => setSelectedOrderId(null)} />
			<ManualOrderFormModal open={showManualOrder} onClose={() => setShowManualOrder(false)} />
		</div>
	);
}

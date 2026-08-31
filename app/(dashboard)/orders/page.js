"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import SearchInput from "@/components/ui/SearchInput";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import { selectClass } from "@/components/ui/FormField";
import OrderDetailModal from "@/components/orders/OrderDetailModal";
import { useOrders, PAGE_SIZE } from "@/hooks/orders/useOrders";

// The only status values getOrders' `status` filter recognizes server-side -
// hardcoded to orderstatusId 1-6, independent of the real OrderStatus table.
// Labels must match the real orderstatus.name values exactly (id=1 is
// "Pending" in the DB, not "New" - this used to say "New" and only worked
// by accident since nothing else used that string).
const STATUS_OPTIONS = ["Pending", "In Progress", "Completed", "On Hold", "Cancelled", "Refunded"];

export default function OrdersPage() {
	const [page, setPage] = useState(0);
	const [search, setSearch] = useState("");
	const [searchType, setSearchType] = useState("recipientname");
	const [status, setStatus] = useState("");
	const [selectedOrderId, setSelectedOrderId] = useState(null);

	const { data, isLoading } = useOrders({ page, search, searchType, status });
	const orders = data?.rows ?? [];
	const totalPages = data ? Math.max(1, Math.ceil(data.count / PAGE_SIZE)) : 1;

	const handleSearch = (value) => {
		setSearch(value);
		setPage(0);
	};

	return (
		<div>
			<PageHeader title="Siparişler" />

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
			</div>

			<DataTable
				isLoading={isLoading}
				rows={orders}
				getRowId={(row) => row.id}
				emptyMessage="Sipariş bulunamadı"
				columns={[
					{ key: "orderNumber", header: "Sipariş No" },
					{ key: "name", header: "Alıcı" },
					{ key: "status", header: "Durum", render: (row) => row.orderstatus?.name ?? "-" },
					{ key: "price", header: "Tutar", render: (row) => `$${row.price ?? "0"}` },
					{
						key: "createdAt",
						header: "Tarih",
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
		</div>
	);
}

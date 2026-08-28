"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import SearchInput from "@/components/ui/SearchInput";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import { selectClass } from "@/components/ui/FormField";
import ShipmentDetailModal from "@/components/fulfillment/ShipmentDetailModal";
import { useShipments, PAGE_SIZE } from "@/hooks/fulfillment/useShipments";

export default function ShipmentsPage() {
	const [page, setPage] = useState(0);
	const [search, setSearch] = useState("");
	const [searchType, setSearchType] = useState("name");
	const [selectedShipmentId, setSelectedShipmentId] = useState(null);

	const { data, isLoading } = useShipments({ page, search, searchType });
	const shipments = data?.rows ?? [];
	const totalPages = data ? Math.max(1, Math.ceil(data.count / PAGE_SIZE)) : 1;

	const handleSearch = (value) => {
		setSearch(value);
		setPage(0);
	};

	return (
		<div>
			<PageHeader title="Gönderiler" />

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
					<option value="name">İsim</option>
					<option value="trackingnumber">Takip No</option>
				</select>
			</div>

			<DataTable
				isLoading={isLoading}
				rows={shipments}
				getRowId={(row) => row.id}
				emptyMessage="Gönderi bulunamadı"
				columns={[
					{ key: "name", header: "Alıcı" },
					{ key: "carrier", header: "Kargo Firması", render: (row) => row.carrier?.name ?? "-" },
					{ key: "tracking", header: "Takip No", render: (row) => row.tracking ?? "-" },
					{
						key: "createdAt",
						header: "Tarih",
						render: (row) => (row.createdAt ? new Date(row.createdAt).toLocaleDateString("tr-TR") : "-"),
					},
				]}
				actions={(row) => (
					<button
						type="button"
						onClick={() => setSelectedShipmentId(row.id)}
						className="text-text-light hover:text-custom-blue"
					>
						<Eye size={16} />
					</button>
				)}
			/>

			<Pagination page={page + 1} totalPages={totalPages} onPageChange={(p) => setPage(p - 1)} />

			<ShipmentDetailModal shipmentId={selectedShipmentId} onClose={() => setSelectedShipmentId(null)} />
		</div>
	);
}

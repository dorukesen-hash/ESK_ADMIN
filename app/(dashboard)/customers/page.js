"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import SearchInput from "@/components/ui/SearchInput";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import CustomerShippingProfilesModal from "@/components/customers/CustomerShippingProfilesModal";
import { useCustomers, PAGE_SIZE } from "@/hooks/customers/useCustomers";

export default function CustomersPage() {
	const [page, setPage] = useState(0);
	const [search, setSearch] = useState("");
	const { data, isLoading } = useCustomers({ page, search });
	const [selectedCustomer, setSelectedCustomer] = useState(null);

	const customers = data?.rows ?? [];
	const totalPages = data ? Math.max(1, Math.ceil(data.count / PAGE_SIZE)) : 1;

	const handleSearch = (value) => {
		setSearch(value);
		setPage(0);
	};

	return (
		<div>
			<PageHeader title="Müşteriler" />

			<div className="mb-4">
				<SearchInput value={search} onChange={handleSearch} placeholder="İsim, e-posta veya telefon ara..." />
			</div>

			<DataTable
				isLoading={isLoading}
				rows={customers}
				getRowId={(row) => row.id}
				emptyMessage="Müşteri bulunamadı"
				columns={[
					{
						key: "name",
						header: "Ad Soyad",
						render: (row) => `${row.name ?? ""} ${row.surname ?? ""}`.trim() || "-",
					},
					{ key: "email", header: "E-posta", render: (row) => row.email ?? "-" },
					{ key: "phone", header: "Telefon", render: (row) => row.phone ?? "-" },
					{ key: "city", header: "Şehir", render: (row) => row.city ?? "-" },
				]}
				actions={(row) => (
					<button
						type="button"
						onClick={() => setSelectedCustomer(row)}
						className="text-text-light hover:text-custom-blue"
						title="Adresler"
					>
						<MapPin size={16} />
					</button>
				)}
			/>

			<Pagination page={page + 1} totalPages={totalPages} onPageChange={(p) => setPage(p - 1)} />

			<CustomerShippingProfilesModal customer={selectedCustomer} onClose={() => setSelectedCustomer(null)} />
		</div>
	);
}

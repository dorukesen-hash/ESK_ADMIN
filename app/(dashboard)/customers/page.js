"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import SearchInput from "@/components/ui/SearchInput";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import { useCustomers, PAGE_SIZE } from "@/hooks/customers/useCustomers";

export default function CustomersPage() {
	const router = useRouter();
	const [page, setPage] = useState(0);
	const [search, setSearch] = useState("");
	const { data, isLoading } = useCustomers({ page, search });

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
				onRowClick={(row) => router.push(`/customers/${row.id}`)}
				columns={[
					{
						key: "name",
						header: "Ad Soyad",
						render: (row) => `${row.name ?? ""} ${row.surname ?? ""}`.trim() || "-",
					},
					{ key: "email", header: "E-posta", render: (row) => row.email ?? "-" },
					{ key: "phone", header: "Telefon", render: (row) => row.phone ?? "-" },
					{ key: "city", header: "Şehir", render: (row) => row.city ?? "-" },
					{
						key: "isActive",
						header: "Durum",
						render: (row) => (
							<span className={row.isActive ? "text-custom-button-green" : "text-text-light"}>
								{row.isActive ? "Aktif" : "Pasif"}
							</span>
						),
					},
				]}
			/>

			<Pagination page={page + 1} totalPages={totalPages} onPageChange={(p) => setPage(p - 1)} />
		</div>
	);
}

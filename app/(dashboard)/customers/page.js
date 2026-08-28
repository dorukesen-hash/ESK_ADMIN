"use client";

import { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import { useCustomers, PAGE_SIZE } from "@/hooks/customers/useCustomers";

export default function CustomersPage() {
	const [page, setPage] = useState(0);
	const { data, isLoading } = useCustomers({ page });
	const customers = data?.rows ?? [];
	const totalPages = data ? Math.max(1, Math.ceil(data.count / PAGE_SIZE)) : 1;

	return (
		<div>
			<PageHeader title="Müşteriler" />
			<p className="mb-4 text-sm text-text-light">
				Arama şu anda backend&apos;deki bir hata nedeniyle devre dışı (getCustomers, boş olmayan bir
				filtre gönderildiğinde 500 hatası veriyor).
			</p>

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
			/>

			<Pagination page={page + 1} totalPages={totalPages} onPageChange={(p) => setPage(p - 1)} />
		</div>
	);
}

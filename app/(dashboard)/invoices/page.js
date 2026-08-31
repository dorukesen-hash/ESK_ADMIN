"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import { useInvoices, PAGE_SIZE } from "@/hooks/invoices/useInvoices";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function formatCustomer(user) {
	if (!user) return "-";
	const name = `${user.name ?? ""} ${user.surname ?? ""}`.trim();
	return name || user.email || "-";
}

export default function InvoicesPage() {
	const [page, setPage] = useState(0);
	const { data, isLoading } = useInvoices(page);

	const invoices = data?.rows ?? [];
	const totalPages = data ? Math.max(1, Math.ceil(data.count / PAGE_SIZE)) : 1;

	return (
		<div>
			<PageHeader title="Faturalar" />

			<DataTable
				isLoading={isLoading}
				rows={invoices}
				getRowId={(row) => row.id}
				emptyMessage="Fatura bulunamadı."
				columns={[
					{ key: "documentNumber", header: "Fatura No" },
					{ key: "customer", header: "Müşteri", render: (row) => formatCustomer(row.user) },
					{
						key: "order",
						header: "Sipariş",
						render: (row) => (row.orders?.[0] ? `#${row.orders[0].orderNumber}` : "-"),
					},
					{
						key: "grandTotal",
						header: "Tutar",
						render: (row) => `$${parseFloat(row.grandTotal ?? 0).toFixed(2)}`,
					},
					{
						key: "issueDate",
						header: "Tarih",
						render: (row) => (row.issueDate ? new Date(row.issueDate).toLocaleDateString("tr-TR") : "-"),
					},
				]}
				actions={(row) =>
					row.orders?.[0] ? (
						<a
							href={`${API_URL}/invoices/pdf/${row.orders[0].id}`}
							target="_blank"
							rel="noreferrer"
							className="text-text-light hover:text-custom-blue"
						>
							<FileText size={16} />
						</a>
					) : null
				}
			/>

			<Pagination page={page + 1} totalPages={totalPages} onPageChange={(p) => setPage(p - 1)} />
		</div>
	);
}

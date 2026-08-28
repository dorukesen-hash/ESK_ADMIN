"use client";

import { useState } from "react";
import { Eye, Trash2 } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import SearchInput from "@/components/ui/SearchInput";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ClaimDetailModal from "@/components/customers/ClaimDetailModal";
import { useClaims, useDeleteClaim, CLAIMS_PAGE_SIZE } from "@/hooks/customers/useClaims";
import { notifySuccess, notifyError } from "@/lib/toast";

export default function ClaimsPage() {
	const [page, setPage] = useState(0);
	const [search, setSearch] = useState("");
	const [selectedClaim, setSelectedClaim] = useState(null);
	const [deletingClaim, setDeletingClaim] = useState(null);

	const { data, isLoading } = useClaims({ page, search });
	const claims = data?.rows ?? [];
	const totalPages = data ? Math.max(1, Math.ceil(data.count / CLAIMS_PAGE_SIZE)) : 1;
	const deleteClaim = useDeleteClaim();

	const handleSearch = (value) => {
		setSearch(value);
		setPage(0);
	};

	const handleDelete = async () => {
		try {
			await deleteClaim.mutateAsync(deletingClaim.id);
			notifySuccess("Talep silindi.");
			setDeletingClaim(null);
		} catch (error) {
			notifyError(error?.response?.data?.message || "Silme başarısız.");
		}
	};

	return (
		<div>
			<PageHeader title="Müşteri Talepleri" />

			<div className="mb-4">
				<SearchInput value={search} onChange={handleSearch} placeholder="Talep ara..." />
			</div>

			<DataTable
				isLoading={isLoading}
				rows={claims}
				getRowId={(row) => row.id}
				emptyMessage="Talep bulunamadı"
				columns={[
					{
						key: "read",
						header: "",
						render: (row) => (
							<span
								className={`inline-block h-2 w-2 rounded-full ${row.read ? "bg-border-gray" : "bg-custom-blue"}`}
								title={row.read ? "Okundu" : "Okunmadı"}
							/>
						),
					},
					{ key: "contactName", header: "İletişim", render: (row) => row.contactName || "-" },
					{ key: "companyName", header: "Firma", render: (row) => row.companyName || "-" },
					{ key: "email", header: "E-posta" },
					{ key: "orderNo", header: "Sipariş No", render: (row) => row.orderNo || "-" },
					{
						key: "createdAt",
						header: "Tarih",
						render: (row) => (row.createdAt ? new Date(row.createdAt).toLocaleDateString("tr-TR") : "-"),
					},
				]}
				actions={(row) => (
					<div className="flex justify-end gap-3">
						<button
							type="button"
							onClick={() => setSelectedClaim(row)}
							className="text-text-light hover:text-custom-blue"
						>
							<Eye size={16} />
						</button>
						<button
							type="button"
							onClick={() => setDeletingClaim(row)}
							className="text-text-light hover:text-red-600"
						>
							<Trash2 size={16} />
						</button>
					</div>
				)}
			/>

			<Pagination page={page + 1} totalPages={totalPages} onPageChange={(p) => setPage(p - 1)} />

			<ClaimDetailModal claim={selectedClaim} onClose={() => setSelectedClaim(null)} />

			<ConfirmDialog
				open={Boolean(deletingClaim)}
				onClose={() => setDeletingClaim(null)}
				onConfirm={handleDelete}
				title="Talebi sil"
				description={`"${deletingClaim?.contactName || "Bu"}" talebini silmek istediğinize emin misiniz?`}
				isLoading={deleteClaim.isPending}
			/>
		</div>
	);
}

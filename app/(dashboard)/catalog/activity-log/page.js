"use client";

import { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import { useAllVariantAuditLog, AUDIT_LOG_PAGE_SIZE } from "@/hooks/catalog/useVariants";

const ACTION_LABELS = {
	create: "Created",
	update: "Updated",
	delete: "Deleted",
};

function formatUser(user) {
	if (!user) return "Unknown";
	const name = `${user.name ?? ""} ${user.surname ?? ""}`.trim();
	return name || user.email || "Unknown";
}

function formatDate(value) {
	return new Date(value).toLocaleString();
}

// Global, cross-variant activity feed - the per-variant "History" icon in
// the Variants grid shows the same data scoped to one row; this is
// everything, newest first.
export default function ActivityLogPage() {
	const [page, setPage] = useState(0);
	const { data, isLoading } = useAllVariantAuditLog(page);

	const logs = data?.rows ?? [];
	const totalPages = data ? Math.max(1, Math.ceil(data.count / AUDIT_LOG_PAGE_SIZE)) : 1;

	return (
		<div>
			<PageHeader title="Activity Log" />
			<p className="mb-4 text-sm text-text-light">
				Every create, update and delete made to a variant, across the whole catalog.
			</p>

			<DataTable
				isLoading={isLoading}
				rows={logs}
				getRowId={(row) => row.id}
				emptyMessage="No activity recorded yet."
				loadingMessage="Loading..."
				columns={[
					{ key: "date", header: "Date", render: (row) => formatDate(row.createdAt) },
					{ key: "user", header: "User", render: (row) => formatUser(row.user) },
					{
						key: "variant",
						header: "Variant",
						render: (row) =>
							row.variant ? (
								<>
									{row.variant.title} <span className="text-text-light">({row.variant.stock})</span>
								</>
							) : (
								<span className="italic text-text-light">(deleted variant)</span>
							),
					},
					{ key: "action", header: "Action", render: (row) => ACTION_LABELS[row.action] ?? row.action },
					{ key: "field", header: "Field", render: (row) => row.field ?? "-" },
					{
						key: "change",
						header: "Change",
						render: (row) =>
							row.action === "update" ? (
								<span>
									<span className="text-text-light line-through">{row.oldValue ?? "empty"}</span>
									{" -> "}
									<span>{row.newValue ?? "empty"}</span>
								</span>
							) : (
								<span className="text-text-light">-</span>
							),
					},
				]}
			/>

			<Pagination page={page + 1} totalPages={totalPages} onPageChange={(p) => setPage(p - 1)} />
		</div>
	);
}

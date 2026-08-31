"use client";

import { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import { checkboxClass } from "@/components/ui/FormField";
import { useAllVariantAuditLog, AUDIT_LOG_PAGE_SIZE } from "@/hooks/catalog/useVariants";
import { VARIANT_FIELD_GROUPS } from "@/components/catalog/variantFieldConfig";

// The "Pricing" field group's keys - variant_audit_log already captures
// changes to these as a side effect of any admin edit (nothing new to log),
// this just filters the existing feed down to price-relevant rows.
const PRICE_FIELD_KEYS = (VARIANT_FIELD_GROUPS.find((g) => g.id === "pricing")?.fields ?? []).map((f) => f.key);

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
	const [priceOnly, setPriceOnly] = useState(false);
	const { data, isLoading } = useAllVariantAuditLog(page, priceOnly ? PRICE_FIELD_KEYS : undefined);

	const logs = data?.rows ?? [];
	const totalPages = data ? Math.max(1, Math.ceil(data.count / AUDIT_LOG_PAGE_SIZE)) : 1;

	return (
		<div>
			<PageHeader title="Activity Log" />
			<p className="mb-4 text-sm text-text-light">
				Every create, update and delete made to a variant, across the whole catalog.
			</p>

			<label className="mb-4 flex items-center gap-2 text-sm text-text-dark">
				<input
					type="checkbox"
					checked={priceOnly}
					onChange={(e) => {
						setPriceOnly(e.target.checked);
						setPage(0);
					}}
					className={checkboxClass}
				/>
				Price History only (tier/pallet pricing fields)
			</label>

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

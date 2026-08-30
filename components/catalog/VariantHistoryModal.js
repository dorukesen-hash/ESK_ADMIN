"use client";

import Modal from "@/components/ui/Modal";
import { useVariantAuditLog } from "@/hooks/catalog/useVariants";

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

export default function VariantHistoryModal({ open, onClose, variant }) {
	const { data: logs = [], isLoading } = useVariantAuditLog(variant?.id);

	return (
		<Modal open={open} onClose={onClose} title={variant ? `History — ${variant.title}` : "History"} maxWidth="max-w-2xl">
			{isLoading && <div className="p-4 text-center text-sm text-text-light">Loading...</div>}
			{!isLoading && logs.length === 0 && (
				<div className="p-4 text-center text-sm text-text-light">No changes recorded yet.</div>
			)}
			{!isLoading && logs.length > 0 && (
				<div className="max-h-96 overflow-y-auto">
					<table className="w-full text-sm">
						<thead className="bg-custom-table-head">
							<tr>
								<th className="px-3 py-2 text-left font-semibold text-text-dark">Date</th>
								<th className="px-3 py-2 text-left font-semibold text-text-dark">User</th>
								<th className="px-3 py-2 text-left font-semibold text-text-dark">Action</th>
								<th className="px-3 py-2 text-left font-semibold text-text-dark">Field</th>
								<th className="px-3 py-2 text-left font-semibold text-text-dark">Change</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border-gray">
							{logs.map((log) => (
								<tr key={log.id}>
									<td className="whitespace-nowrap px-3 py-2 text-text-dark">{formatDate(log.createdAt)}</td>
									<td className="whitespace-nowrap px-3 py-2 text-text-dark">{formatUser(log.user)}</td>
									<td className="whitespace-nowrap px-3 py-2 text-text-dark">
										{ACTION_LABELS[log.action] ?? log.action}
									</td>
									<td className="whitespace-nowrap px-3 py-2 text-text-dark">{log.field ?? "-"}</td>
									<td className="px-3 py-2 text-text-dark">
										{log.action === "update" ? (
											<span>
												<span className="text-text-light line-through">{log.oldValue ?? "empty"}</span>
												{" -> "}
												<span>{log.newValue ?? "empty"}</span>
											</span>
										) : (
											<span className="text-text-light">-</span>
										)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</Modal>
	);
}

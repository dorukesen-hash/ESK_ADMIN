"use client";

import { usePricingAuditLog } from "@/hooks/customers/usePricingAuditLog";

const TYPE_LABELS = {
	special_price: "Özel Fiyat",
	discount_percent: "Genel İndirim",
};

const ACTION_LABELS = {
	create: "Eklendi",
	update: "Güncellendi",
	delete: "Kaldırıldı",
};

function formatUser(user) {
	if (!user) return "Bilinmiyor";
	const name = `${user.name ?? ""} ${user.surname ?? ""}`.trim();
	return name || user.email || "Bilinmiyor";
}

function formatValue(entry, value) {
	if (value === null || value === undefined) return "boş";
	return entry.type === "discount_percent" ? `%${value}` : `$${value}`;
}

export default function PricingHistorySection({ userId }) {
	const { data: entries = [], isLoading } = usePricingAuditLog(userId);

	return (
		<div>
			<h3 className="mb-2 font-medium text-text-dark">Fiyatlandırma Geçmişi</h3>
			{isLoading ? (
				<p className="text-sm text-text-light">Yükleniyor...</p>
			) : entries.length === 0 ? (
				<p className="text-sm text-text-light">Kayıt bulunamadı.</p>
			) : (
				<table className="w-full text-sm">
					<tbody>
						{entries.map((entry) => (
							<tr key={entry.id} className="border-b border-border-gray">
								<td className="py-2 text-text-light">
									{new Date(entry.createdAt).toLocaleString("tr-TR")}
								</td>
								<td className="py-2">
									{TYPE_LABELS[entry.type] ?? entry.type}
									{entry.variant && (
										<span className="text-text-light"> ({entry.variant.title})</span>
									)}
								</td>
								<td className="py-2 text-text-light">{ACTION_LABELS[entry.action] ?? entry.action}</td>
								<td className="py-2">
									<span className="text-text-light line-through">{formatValue(entry, entry.oldValue)}</span>
									{" -> "}
									<span>{formatValue(entry, entry.newValue)}</span>
								</td>
								<td className="py-2 text-right text-text-light">{formatUser(entry.actor)}</td>
							</tr>
						))}
					</tbody>
				</table>
			)}
		</div>
	);
}

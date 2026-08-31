"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import OrderDetailModal from "@/components/orders/OrderDetailModal";
import AccountSection from "@/components/customers/AccountSection";
import AddressBookSection from "@/components/customers/AddressBookSection";
import SpecialPricesSection from "@/components/customers/SpecialPricesSection";
import PricingHistorySection from "@/components/customers/PricingHistorySection";
import { useCustomerDetail } from "@/hooks/customers/useCustomerDetail";

const ORDER_STATUS_LABELS = {
	1: "Yeni",
	2: "İşlemde",
	3: "Tamamlandı",
	4: "Beklemede",
	5: "İptal",
	6: "İade",
};

export default function CustomerDetailPage({ params }) {
	const { id } = params;
	const { data, isLoading } = useCustomerDetail(id);
	const [selectedOrderId, setSelectedOrderId] = useState(null);

	if (isLoading) {
		return <p className="text-sm text-text-light">Yükleniyor...</p>;
	}

	if (!data) {
		return <p className="text-sm text-text-light">Müşteri bulunamadı.</p>;
	}

	const { customer, orders } = data;
	const user = customer.user;

	return (
		<div>
			<Link href="/customers" className="mb-4 flex items-center gap-1 text-sm text-text-light hover:text-text-dark">
				<ArrowLeft size={16} /> Müşterilere dön
			</Link>

			<PageHeader title={`${customer.name ?? ""} ${customer.surname ?? ""}`.trim() || "Müşteri"} />

			<div className="grid grid-cols-1 gap-6 tablet:grid-cols-2">
				<section className="border border-border-gray p-4">
					<AccountSection customerId={id} user={user} />
				</section>

				<section className="border border-border-gray p-4">
					<AddressBookSection userId={customer.userId} />
				</section>

				<section className="border border-border-gray p-4">
					<h3 className="mb-2 font-medium text-text-dark">Sipariş Geçmişi</h3>
					{orders.length === 0 ? (
						<p className="text-sm text-text-light">Sipariş bulunamadı.</p>
					) : (
						<table className="w-full text-sm">
							<tbody>
								{orders.map((order) => (
									<tr
										key={order.id}
										onClick={() => setSelectedOrderId(order.id)}
										className="cursor-pointer border-b border-border-gray hover:bg-custom-table-soft-blue"
									>
										<td className="py-2">#{order.orderNumber}</td>
										<td className="py-2 text-text-light">
											{new Date(order.createdAt).toLocaleDateString("tr-TR")}
										</td>
										<td className="py-2 text-text-light">
											{ORDER_STATUS_LABELS[order.orderstatusId] ?? "-"}
										</td>
										<td className="py-2 text-right font-medium">${parseFloat(order.price).toFixed(2)}</td>
									</tr>
								))}
							</tbody>
						</table>
					)}
				</section>

				<section className="border border-border-gray p-4">
					<SpecialPricesSection userId={customer.userId} />
				</section>

				<section className="border border-border-gray p-4 tablet:col-span-2">
					<PricingHistorySection userId={customer.userId} />
				</section>
			</div>

			<OrderDetailModal orderId={selectedOrderId} onClose={() => setSelectedOrderId(null)} />
		</div>
	);
}

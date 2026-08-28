"use client";

import AttributeCrudPage from "@/components/attributes/AttributeCrudPage";
import { usePricing, useCreatePrice, useUpdatePrice, useDeletePrice } from "@/hooks/attributes/usePricing";

const fields = [
	{ name: "single", label: "Tekli Fiyat", type: "number" },
	{ name: "five", label: "5+ Adet Fiyatı", type: "number" },
	{ name: "ten", label: "10+ Adet Fiyatı", type: "number" },
	{ name: "pallet", label: "Palet Fiyatı", type: "number" },
];

export default function PricingPage() {
	return (
		<AttributeCrudPage
			title="Fiyatlandırma"
			fields={fields}
			useList={usePricing}
			useCreate={useCreatePrice}
			useUpdate={useUpdatePrice}
			useDelete={useDeletePrice}
		/>
	);
}

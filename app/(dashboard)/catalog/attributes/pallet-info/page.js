"use client";

import AttributeCrudPage from "@/components/attributes/AttributeCrudPage";
import {
	usePalletInfo,
	useCreatePalletInfo,
	useUpdatePalletInfo,
	useDeletePalletInfo,
} from "@/hooks/attributes/usePalletInfo";

const fields = [
	{ name: "units", label: "Adet", type: "number" },
	{ name: "pallet_width", label: "Palet Genişlik", type: "number" },
	{ name: "pallet_length", label: "Palet Uzunluk", type: "number" },
	{ name: "pallet_height", label: "Palet Yükseklik", type: "number" },
	{ name: "pallet_weight", label: "Palet Ağırlık", type: "number" },
	{ name: "box_deci", label: "Kutu Desi", type: "number" },
];

export default function PalletInfoPage() {
	return (
		<AttributeCrudPage
			title="Palet Bilgileri"
			fields={fields}
			useList={usePalletInfo}
			useCreate={useCreatePalletInfo}
			useUpdate={useUpdatePalletInfo}
			useDelete={useDeletePalletInfo}
		/>
	);
}

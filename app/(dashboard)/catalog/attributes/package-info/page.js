"use client";

import AttributeCrudPage from "@/components/attributes/AttributeCrudPage";
import {
	usePackageInfo,
	useCreatePackageInfo,
	useUpdatePackageInfo,
	useDeletePackageInfo,
} from "@/hooks/attributes/usePackageInfo";

const fields = [
	{ name: "units", label: "Adet", type: "number" },
	{ name: "box_width", label: "Kutu Genişlik", type: "number" },
	{ name: "box_length", label: "Kutu Uzunluk", type: "number" },
	{ name: "box_height", label: "Kutu Yükseklik", type: "number" },
	{ name: "box_weight", label: "Kutu Ağırlık", type: "number" },
	{ name: "box_deci", label: "Kutu Desi", type: "number" },
];

export default function PackageInfoPage() {
	return (
		<AttributeCrudPage
			title="Paket Bilgileri"
			fields={fields}
			useList={usePackageInfo}
			useCreate={useCreatePackageInfo}
			useUpdate={useUpdatePackageInfo}
			useDelete={useDeletePackageInfo}
		/>
	);
}

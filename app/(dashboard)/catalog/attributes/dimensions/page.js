"use client";

import AttributeCrudPage from "@/components/attributes/AttributeCrudPage";
import {
	useDimensions,
	useCreateDimension,
	useUpdateDimension,
	useDeleteDimension,
} from "@/hooks/attributes/useDimensions";

const fields = [
	{ name: "weight", label: "Ağırlık", type: "number" },
	{ name: "width", label: "Genişlik", type: "number" },
	{ name: "length", label: "Uzunluk", type: "number" },
	{ name: "height", label: "Yükseklik", type: "number" },
	{ name: "deci", label: "Desi", type: "number" },
];

export default function DimensionsPage() {
	return (
		<AttributeCrudPage
			title="Boyutlar"
			fields={fields}
			useList={useDimensions}
			useCreate={useCreateDimension}
			useUpdate={useUpdateDimension}
			useDelete={useDeleteDimension}
		/>
	);
}

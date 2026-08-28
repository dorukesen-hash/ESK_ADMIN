"use client";

import AttributeCrudPage from "@/components/attributes/AttributeCrudPage";
import {
	useSpecifications,
	useCreateSpecification,
	useUpdateSpecification,
	useDeleteSpecification,
} from "@/hooks/attributes/useSpecifications";

const fields = [
	{ name: "text", label: "Metin", type: "textarea" },
	{ name: "line_items", label: "Madde Listesi", type: "list" },
];

export default function SpecificationsPage() {
	return (
		<AttributeCrudPage
			title="Spesifikasyonlar"
			fields={fields}
			useList={useSpecifications}
			useCreate={useCreateSpecification}
			useUpdate={useUpdateSpecification}
			useDelete={useDeleteSpecification}
		/>
	);
}

"use client";

import AttributeCrudPage from "@/components/attributes/AttributeCrudPage";
import {
	useDescriptions,
	useCreateDescription,
	useUpdateDescription,
	useDeleteDescription,
} from "@/hooks/attributes/useDescriptions";

const fields = [
	{ name: "text", label: "Metin", type: "textarea" },
	{ name: "list_items", label: "Madde Listesi", type: "list" },
];

export default function DescriptionsPage() {
	return (
		<AttributeCrudPage
			title="Açıklamalar"
			fields={fields}
			useList={useDescriptions}
			useCreate={useCreateDescription}
			useUpdate={useUpdateDescription}
			useDelete={useDeleteDescription}
		/>
	);
}

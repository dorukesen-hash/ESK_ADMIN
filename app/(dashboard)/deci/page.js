"use client";

import AttributeCrudPage from "@/components/attributes/AttributeCrudPage";
import { useDeciList, useCreateDeci, useUpdateDeci, useDeleteDeci } from "@/hooks/fulfillment/useDeci";

const fields = [
	{ name: "min", label: "Min", type: "number" },
	{ name: "max", label: "Max", type: "number" },
];

export default function DeciPage() {
	return (
		<AttributeCrudPage
			title="Desi Aralıkları"
			fields={fields}
			useList={useDeciList}
			useCreate={useCreateDeci}
			useUpdate={useUpdateDeci}
			useDelete={useDeleteDeci}
		/>
	);
}

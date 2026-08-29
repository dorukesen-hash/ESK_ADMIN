"use client";

import { useQueries } from "@tanstack/react-query";
import api from "@/lib/api";

// Same fixed status labels getOrders' status filter recognizes (see
// app/(dashboard)/orders/page.js) - one lightweight limit=1 request per status,
// reading only the `count` field, since there's no group-by-status endpoint.
const STATUSES = ["New", "In Progress", "Completed", "On Hold", "Cancelled", "Refunded"];

export function useOrderStatusCounts() {
	const results = useQueries({
		queries: STATUSES.map((status) => ({
			queryKey: ["dashboardOrderCount", status],
			queryFn: async () => {
				const { data } = await api.get("/admin/orders/", {
					params: { page: 0, limit: 1, searchValue: "", searchType: "recipientname", status },
				});
				return { status, count: data.count ?? 0 };
			},
		})),
	});

	return {
		isLoading: results.some((r) => r.isLoading),
		counts: results.map((r) => r.data).filter(Boolean),
	};
}

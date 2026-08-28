"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

// Real OrderStatus rows (built in Phase 0) - used for the status-change dropdown,
// distinct from the fixed English label set getOrders' own `status` filter expects.
export function useOrderStatusList() {
	return useQuery({
		queryKey: ["orderStatusList"],
		queryFn: async () => {
			const { data } = await api.get("/orderstatuses");
			return data ?? [];
		},
	});
}

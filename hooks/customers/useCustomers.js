"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

const PAGE_SIZE = 10;

export function useCustomers({ page = 0, search = "" } = {}) {
	return useQuery({
		queryKey: ["customers", page, search],
		queryFn: async () => {
			// getCustomers computes offset from the raw (pre-parseInt) limit param, so
			// page/limit are always sent explicitly - same NaN risk as other admin-router
			// endpoints. Search now works server-side (ESK_API#10 fixed the Op import +
			// searches on name/email/phone).
			const { data } = await api.get("/admin/customers/", {
				params: { page, limit: PAGE_SIZE, globalFilter: search },
			});
			return { rows: data.rows ?? [], count: data.count ?? 0 };
		},
	});
}

export { PAGE_SIZE };

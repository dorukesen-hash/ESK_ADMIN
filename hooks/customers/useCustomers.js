"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

const PAGE_SIZE = 10;

export function useCustomers({ page = 0 } = {}) {
	return useQuery({
		queryKey: ["customers", page],
		queryFn: async () => {
			// getCustomers references `Op` without importing it, and filters on `title`/
			// `sku` (fields Customer doesn't even have) - any non-empty globalFilter
			// throws a 500 (ReferenceError: Op is not defined). Never send a search term.
			const { data } = await api.get("/admin/customers/", {
				params: { page, limit: PAGE_SIZE },
			});
			return { rows: data.rows ?? [], count: data.count ?? 0 };
		},
	});
}

export { PAGE_SIZE };

"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

const PAGE_SIZE = 25;

export function useInvoices(page = 0) {
	return useQuery({
		queryKey: ["invoices", page],
		queryFn: async () => {
			const { data } = await api.get("/admin/invoices", { params: { page, limit: PAGE_SIZE } });
			return { rows: data.rows ?? [], count: data.count ?? 0 };
		},
	});
}

export { PAGE_SIZE };

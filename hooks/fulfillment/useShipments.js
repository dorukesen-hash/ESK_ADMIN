"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

const PAGE_SIZE = 10;

export function useShipments({ page = 0, search = "", searchType = "name" } = {}) {
	return useQuery({
		queryKey: ["shipments", page, search, searchType],
		queryFn: async () => {
			// Same offset-from-raw-limit quirk as orders/variants - always send both.
			const { data } = await api.get("/admin/shipment/", {
				params: { page, limit: PAGE_SIZE, searchValue: search, searchType },
			});
			return { rows: data.rows ?? [], count: data.count ?? 0 };
		},
	});
}

export function useShipment(id) {
	return useQuery({
		queryKey: ["shipment", id],
		queryFn: async () => {
			const { data } = await api.get(`/admin/shipment/${id}`);
			return data;
		},
		enabled: Boolean(id),
	});
}

export function useUpdateShipment() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, ...payload }) => api.put(`/admin/shipment/${id}`, payload),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: ["shipments"] });
			queryClient.invalidateQueries({ queryKey: ["shipment", variables.id] });
		},
	});
}

export { PAGE_SIZE };

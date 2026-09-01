"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export function useCarriers() {
	return useQuery({
		queryKey: ["carriers"],
		queryFn: async () => {
			const { data } = await api.get("/carriers/");
			return data ?? [];
		},
	});
}

export function useCreateCarrier() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload) => api.post("/carriers/", payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["carriers"] });
			queryClient.invalidateQueries({ queryKey: ["carrier-stats"] });
		},
	});
}

export function useUpdateCarrier() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload) => api.put("/carriers/", payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["carriers"] });
			queryClient.invalidateQueries({ queryKey: ["carrier-stats"] });
		},
	});
}

export function useDeleteCarrier() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id) => api.delete(`/carriers/${id}`),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["carriers"] });
			queryClient.invalidateQueries({ queryKey: ["carrier-stats"] });
		},
	});
}

// Real usage stats per provider (label/shipment count, total shipping cost
// paid) for the Carriers page - distinct from useCarriers above, which is
// just the bare name list used elsewhere (e.g. the order-complete carrier
// picker).
export function useCarrierStats() {
	return useQuery({
		queryKey: ["carrier-stats"],
		queryFn: async () => {
			const { data } = await api.get("/admin/carrier-stats");
			return data ?? [];
		},
	});
}

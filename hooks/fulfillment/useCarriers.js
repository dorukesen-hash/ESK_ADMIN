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
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["carriers"] }),
	});
}

export function useUpdateCarrier() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload) => api.put("/carriers/", payload),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["carriers"] }),
	});
}

export function useDeleteCarrier() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id) => api.delete(`/carriers/${id}`),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["carriers"] }),
	});
}

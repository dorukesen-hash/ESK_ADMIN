"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export function useCatalogTree() {
	return useQuery({
		queryKey: ["catalog-tree"],
		queryFn: async () => {
			const { data } = await api.get("/admin/catalog-node");
			return data ?? [];
		},
	});
}

export function useCreateCatalogNode() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload) => api.post("/admin/catalog-node", payload),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["catalog-tree"] }),
	});
}

export function useUpdateCatalogNode() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, ...payload }) => api.put(`/admin/catalog-node/${id}`, payload),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["catalog-tree"] }),
	});
}

export function useDeleteCatalogNode() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id) => api.delete(`/admin/catalog-node/${id}`),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["catalog-tree"] }),
	});
}

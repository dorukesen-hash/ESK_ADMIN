"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export function useProducts(search = "") {
	return useQuery({
		queryKey: ["products", search],
		queryFn: async () => {
			// Same decodeURIComponent(search) quirk as subcategories - always send a string.
			const { data } = await api.get("/admin/product", { params: { search } });
			return data.rows ?? [];
		},
	});
}

export function useCreateProduct() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload) => api.post("/admin/product/", payload),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
	});
}

export function useUpdateProduct() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload) => api.put("/admin/product/", payload),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
	});
}

export function useDeleteProduct() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id) => api.delete(`/admin/product/${id}`),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
	});
}

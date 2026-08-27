"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export function useCategories() {
	return useQuery({
		queryKey: ["categories"],
		queryFn: async () => {
			const { data } = await api.get("/admin/category/");
			return data.rows ?? [];
		},
	});
}

export function useCreateCategory() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload) => api.post("/admin/category/", payload),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
	});
}

export function useUpdateCategory() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload) => api.put("/admin/category/", payload),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
	});
}

export function useDeleteCategory() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id) => api.delete(`/admin/category/${id}`),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
	});
}

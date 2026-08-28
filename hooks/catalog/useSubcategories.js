"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export function useSubcategories(search = "") {
	return useQuery({
		queryKey: ["subcategories", search],
		queryFn: async () => {
			// ESK_API's getSubCategoriesforAdmin does decodeURIComponent(search) with no
			// fallback - an omitted param becomes the literal string "undefined" and the
			// list filters on it, returning nothing. Always send an explicit (possibly
			// empty) search string.
			const { data } = await api.get("/admin/subcategory", { params: { search } });
			return data.rows ?? [];
		},
	});
}

export function useCreateSubcategory() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload) => api.post("/admin/subcategory/", payload),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subcategories"] }),
	});
}

export function useUpdateSubcategory() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload) => api.put("/admin/subcategory/", payload),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subcategories"] }),
	});
}

export function useDeleteSubcategory() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id) => api.delete(`/admin/subcategory/${id}`),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subcategories"] }),
	});
}

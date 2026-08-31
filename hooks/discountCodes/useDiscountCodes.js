"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

const QUERY_KEY = ["discount-codes"];

export function useDiscountCodes() {
	return useQuery({
		queryKey: QUERY_KEY,
		queryFn: async () => {
			const { data } = await api.get("/admin/discount-codes");
			return data ?? [];
		},
	});
}

export function useCreateDiscountCode() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload) => api.post("/admin/discount-codes", payload),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
	});
}

export function useUpdateDiscountCode() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, ...payload }) => api.put(`/admin/discount-codes/${id}`, payload),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
	});
}

export function useDeleteDiscountCode() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id) => api.delete(`/admin/discount-codes/${id}`),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
	});
}

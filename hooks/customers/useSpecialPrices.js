"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export function useSpecialPrices(userId) {
	return useQuery({
		queryKey: ["special-prices", userId],
		queryFn: async () => {
			const { data } = await api.get(`/admin/customers/${userId}/special-prices`);
			return data ?? [];
		},
		enabled: Boolean(userId),
	});
}

// One row per (user, variant) - re-submitting an existing variantId updates
// its price in place server-side rather than creating a duplicate.
export function useUpsertSpecialPrice() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ userId, variantId, price }) =>
			api.post(`/admin/customers/${userId}/special-prices`, { variantId, price }),
		onSuccess: (_, variables) =>
			queryClient.invalidateQueries({ queryKey: ["special-prices", variables.userId] }),
	});
}

export function useDeleteSpecialPrice() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id }) => api.delete(`/admin/special-prices/${id}`),
		onSuccess: (_, variables) =>
			queryClient.invalidateQueries({ queryKey: ["special-prices", variables.userId] }),
	});
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export function useCustomerShippingProfiles(userId) {
	return useQuery({
		queryKey: ["shippingProfiles", userId],
		queryFn: async () => {
			const { data } = await api.get(`/admin/customers/${userId}/shipping-profiles`);
			return data ?? [];
		},
		enabled: Boolean(userId),
	});
}

export function useUpdateShippingProfile() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, userId, ...payload }) => api.put(`/shippingprofiles/${id}`, payload),
		onSuccess: (_, variables) =>
			queryClient.invalidateQueries({ queryKey: ["shippingProfiles", variables.userId] }),
	});
}

export function useDeleteShippingProfile() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id }) => api.delete(`/shippingprofiles/${id}`),
		onSuccess: (_, variables) =>
			queryClient.invalidateQueries({ queryKey: ["shippingProfiles", variables.userId] }),
	});
}

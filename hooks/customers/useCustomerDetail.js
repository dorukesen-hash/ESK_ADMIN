"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

// Full detail: Customer row + linked User + address book + order history +
// special prices - see ESK_API's getCustomerDetailForAdmin.
export function useCustomerDetail(customerId) {
	return useQuery({
		queryKey: ["customer-detail", customerId],
		queryFn: async () => {
			const { data } = await api.get(`/admin/customers/${customerId}`);
			return data;
		},
		enabled: Boolean(customerId),
	});
}

// Updates the User row (name/surname/email/phone/isActive/discountPercent) -
// whitelisted server-side, isAdmin/password can never be set through this.
export function useUpdateUserAccount(customerId) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ userId, ...payload }) => api.put(`/admin/users/${userId}`, payload),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customer-detail", customerId] }),
	});
}

export function useSendPasswordReset() {
	return useMutation({
		mutationFn: (userId) => api.post(`/admin/users/${userId}/send-reset`),
	});
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

const PAGE_SIZE = 10;

export function useOrders({ page = 0, search = "", searchType = "recipientname", status = "" } = {}) {
	return useQuery({
		queryKey: ["orders", page, search, searchType, status],
		queryFn: async () => {
			// getOrders computes offset = parseInt(page) * parseInt(limit) - always send
			// both explicitly or the math comes out NaN. status only recognizes a fixed
			// set of English labels hardcoded to orderstatusId 1-6 server-side, not the
			// actual OrderStatus table content.
			const { data } = await api.get("/admin/orders/", {
				params: { page, limit: PAGE_SIZE, searchValue: search, searchType, status },
			});
			return { rows: data.rows ?? [], count: data.count ?? 0 };
		},
	});
}

export function useOrder(id) {
	return useQuery({
		queryKey: ["order", id],
		queryFn: async () => {
			const { data } = await api.get(`/admin/orders/${id}`);
			return data;
		},
		enabled: Boolean(id),
	});
}

export function useUpdateOrder() {
	const queryClient = useQueryClient();
	return useMutation({
		// billingAddress is optional server-side - only send it when actually editing
		// billing, so an admin-note-only save doesn't touch/create a Billing row.
		mutationFn: ({ id, ...payload }) => api.put(`/admin/orders/${id}`, payload),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: ["orders"] });
			queryClient.invalidateQueries({ queryKey: ["order", variables.id] });
		},
	});
}

export function useUpdateOrderStatus() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ orderId, orderStatusId }) => api.post("/admin/orders/status/", { orderId, orderStatusId }),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: ["orders"] });
			queryClient.invalidateQueries({ queryKey: ["order", variables.orderId] });
			queryClient.invalidateQueries({ queryKey: ["order-audit-log", variables.orderId] });
		},
	});
}

export function useCompleteOrder() {
	const queryClient = useQueryClient();
	return useMutation({
		// completeOrder silently no-ops (still 200) if the order is already status 3 or
		// already has a shipment - there's no way to tell "completed now" from "already
		// was" apart from the response, so the UI just shows a generic success toast.
		mutationFn: ({ orderId, carrierId, trackingNumber }) =>
			api.post("/admin/orders/complete/", { orderId, carrierId, trackingNumber }),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: ["orders"] });
			queryClient.invalidateQueries({ queryKey: ["order", variables.orderId] });
			queryClient.invalidateQueries({ queryKey: ["order-audit-log", variables.orderId] });
		},
	});
}

export function useUpdateOrderItemTracking() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ orderItemId, note }) => api.post("/admin/orderitems/tracking", { orderItemId, note }),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["order"] }),
	});
}

// Refunds the order's payment via Stripe (using the linked Transaction's
// real PaymentIntent id) and flips status to Refunded server-side.
export function useRefundOrder() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (orderId) => api.post(`/admin/orders/${orderId}/refund`),
		onSuccess: (_, orderId) => {
			queryClient.invalidateQueries({ queryKey: ["orders"] });
			queryClient.invalidateQueries({ queryKey: ["order", orderId] });
			queryClient.invalidateQueries({ queryKey: ["order-audit-log", orderId] });
		},
	});
}

export function useOrderAuditLog(orderId) {
	return useQuery({
		queryKey: ["order-audit-log", orderId],
		queryFn: async () => {
			const { data } = await api.get(`/admin/orders/${orderId}/audit-log`);
			return data ?? [];
		},
		enabled: Boolean(orderId),
	});
}

export { PAGE_SIZE };

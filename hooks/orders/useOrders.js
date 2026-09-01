"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

const PAGE_SIZE = 10;

export function useOrders({ page = 0, search = "", searchType = "recipientname", status = "", dateFrom = "", dateTo = "", sorting = [] } = {}) {
	return useQuery({
		queryKey: ["orders", page, search, searchType, status, dateFrom, dateTo, sorting],
		queryFn: async () => {
			// getOrders computes offset = parseInt(page) * parseInt(limit) - always send
			// both explicitly or the math comes out NaN. status only recognizes a fixed
			// set of English labels hardcoded to orderstatusId 1-6 server-side, not the
			// actual OrderStatus table content.
			const { data } = await api.get("/admin/orders/", {
				params: { page, limit: PAGE_SIZE, searchValue: search, searchType, status, dateFrom, dateTo, sorting },
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
		mutationFn: ({ orderId, carrierId, trackingNumber, shipmentstatusId }) =>
			api.post("/admin/orders/complete/", { orderId, carrierId, trackingNumber, shipmentstatusId }),
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
// real PaymentIntent id). `amount` (dollars, optional) does a partial
// refund - only a refund that reaches the full charged amount flips status
// to Refunded server-side, so onSuccess always refetches to reflect that.
export function useRefundOrder() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ orderId, amount }) => api.post(`/admin/orders/${orderId}/refund`, { amount }),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: ["orders"] });
			queryClient.invalidateQueries({ queryKey: ["order", variables.orderId] });
			queryClient.invalidateQueries({ queryKey: ["order-audit-log", variables.orderId] });
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

// items is the full desired line-item list (not a delta) - see
// updateOrderItems in ESK_API.
export function useUpdateOrderItems() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ orderId, items }) => api.put(`/admin/orders/${orderId}/items`, { items }),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: ["orders"] });
			queryClient.invalidateQueries({ queryKey: ["order", variables.orderId] });
			queryClient.invalidateQueries({ queryKey: ["order-audit-log", variables.orderId] });
		},
	});
}

// Phone/email orders paid outside Stripe (wire, check, etc.) - see
// createManualOrder in ESK_API.
export function useCreateManualOrder() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload) => api.post("/admin/orders/manual", payload),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
	});
}

export function useResendOrderConfirmation() {
	return useMutation({
		mutationFn: (orderId) => api.post(`/admin/orders/${orderId}/resend-confirmation`),
	});
}

// Never aborts the whole batch over one ineligible order (e.g. paid +
// unrefunded, attempted Cancelled) - returns { updated: [], skipped: [] }.
export function useBulkUpdateOrderStatus() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ orderIds, orderStatusId }) => api.post("/admin/orders/bulk-status", { orderIds, orderStatusId }),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
	});
}

// Same blob-download pattern as useExportVariants (hooks/catalog/useVariants.js)
// - goes through the authenticated axios instance rather than a raw <a href>
// to the API host, since /admin routes require the auth cookie.
export function useExportOrders() {
	return useMutation({
		mutationFn: async ({ search, searchType, status, dateFrom, dateTo } = {}) => {
			const { data } = await api.get("/admin/orders/export", {
				params: { searchValue: search, searchType, status, dateFrom, dateTo },
				responseType: "blob",
			});
			return data;
		},
	});
}

export { PAGE_SIZE };

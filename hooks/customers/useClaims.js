"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

const PAGE_SIZE = 10;

export function useClaims({ page = 0, search = "" } = {}) {
	return useQuery({
		queryKey: ["claims", page, search],
		queryFn: async () => {
			const { data } = await api.get("/claims/", {
				params: { limit: PAGE_SIZE, offset: page * PAGE_SIZE, searchTerm: search },
			});
			return { rows: data.data ?? [], count: data.total ?? 0 };
		},
	});
}

export function useMarkClaimRead() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id) => api.put(`/claims/${id}/read`),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["claims"] }),
	});
}

export function useDeleteClaim() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id) => api.delete(`/claims/${id}`),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["claims"] }),
	});
}

export { PAGE_SIZE as CLAIMS_PAGE_SIZE };

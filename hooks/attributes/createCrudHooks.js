"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

// Description/Dimension/Package/Pallet/Specification/Price all share the exact
// same REST shape (GET /, GET /:id, POST /, PUT /, DELETE /:id, flat body) -
// verified by reading all five controllers, unlike Catalog's resources which
// each had their own real quirks. One factory instead of six near-duplicates.
export function createCrudHooks(resource, queryKey) {
	function useList() {
		return useQuery({
			queryKey: [queryKey],
			queryFn: async () => {
				const { data } = await api.get(`/${resource}/`);
				return data ?? [];
			},
		});
	}

	function useCreate() {
		const queryClient = useQueryClient();
		return useMutation({
			mutationFn: (payload) => api.post(`/${resource}/`, payload),
			onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryKey] }),
		});
	}

	function useUpdate() {
		const queryClient = useQueryClient();
		return useMutation({
			mutationFn: (payload) => api.put(`/${resource}/`, payload),
			onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryKey] }),
		});
	}

	function useDelete() {
		const queryClient = useQueryClient();
		return useMutation({
			mutationFn: (id) => api.delete(`/${resource}/${id}`),
			onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryKey] }),
		});
	}

	return { useList, useCreate, useUpdate, useDelete };
}

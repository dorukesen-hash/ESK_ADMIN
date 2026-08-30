"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

// Despite the name, GET /api/featured is a variant search (used to pick a
// source/target), not a list of existing featured relationships.
export function useVariantSearch(searchValue) {
	return useQuery({
		queryKey: ["variantSearch", searchValue],
		queryFn: async () => {
			const { data } = await api.get("/featured", { params: { searchValue } });
			return data.rows ?? [];
		},
		enabled: Boolean(searchValue) && searchValue.length > 1,
	});
}

export function useFeaturedFor(sourceId) {
	return useQuery({
		queryKey: ["featured", sourceId],
		queryFn: async () => {
			const { data } = await api.get(`/featured/${sourceId}`);
			return data ?? [];
		},
		enabled: Boolean(sourceId),
	});
}

// Source variants that already have at least one FBT target configured, so
// the page can open on "previously entered" sources instead of requiring a
// fresh search every time.
export function useFeaturedSources() {
	return useQuery({
		queryKey: ["featured-sources"],
		queryFn: async () => {
			const { data } = await api.get("/featured/sources");
			return data ?? [];
		},
	});
}

export function useAddFeatured() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload) => api.post("/featured", payload),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: ["featured", variables.source_id] });
			queryClient.invalidateQueries({ queryKey: ["featured-sources"] });
		},
	});
}

export function useRemoveFeatured() {
	const queryClient = useQueryClient();
	return useMutation({
		// The :id route param is actually target_id server-side (deleteFeaturedProducts
		// deletes by target_id, not the Featured row's own primary key).
		mutationFn: ({ targetId }) => api.delete(`/featured/${targetId}`),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: ["featured", variables.sourceId] });
			queryClient.invalidateQueries({ queryKey: ["featured-sources"] });
		},
	});
}

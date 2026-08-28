"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

const PAGE_SIZE = 10;

export function useVariants({ page = 0, search = "" } = {}) {
	return useQuery({
		queryKey: ["variants", page, search],
		queryFn: async () => {
			// getVariantsForAdmin builds offset = parseInt(page) * limit using the raw
			// (possibly undefined) limit, not the parsed one - always send both explicitly
			// or the offset comes out NaN.
			const { data } = await api.get("/admin/variant/", {
				params: { page, limit: PAGE_SIZE, globalFilter: search },
			});
			const rows = data.rows ?? [];
			// findAndCountAll includes a hasMany (VariantImages) without distinct: true,
			// which can inflate rows/count for variants with multiple images - dedupe defensively.
			const seen = new Set();
			const dedupedRows = rows.filter((row) => (seen.has(row.id) ? false : seen.add(row.id)));
			return { rows: dedupedRows, count: data.count ?? dedupedRows.length };
		},
	});
}

export function useUpdateVariant() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload) => api.put("/admin/variant/", payload),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["variants"] }),
	});
}

export function useDeleteVariant() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id) => api.delete(`/admin/variant/${id}`),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["variants"] }),
	});
}

export function useUploadVariantExcel() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({ file, hierarchyType, hierarchyId }) => {
			const formData = new FormData();
			formData.append("file", file);
			return api.post("/admin/variant-upload", formData, {
				headers: {
					hierarchy_type: hierarchyType,
					hierarchy_id: hierarchyId,
				},
			});
		},
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["variants"] }),
	});
}

export { PAGE_SIZE };

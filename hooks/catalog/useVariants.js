"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

const PAGE_SIZE = 10;

export function useVariants({ page = 0, search = "", categoryId, subcategoryId, productId, enabled = true } = {}) {
	return useQuery({
		queryKey: ["variants", page, search, categoryId, subcategoryId, productId],
		enabled,
		queryFn: async () => {
			// getVariantsForAdmin builds offset = parseInt(page) * limit using the raw
			// (possibly undefined) limit, not the parsed one - always send both explicitly
			// or the offset comes out NaN. categoryId/subcategoryId scope to variants
			// DIRECTLY attached at that level (the API excludes descendants server-side).
			const { data } = await api.get("/admin/variant/", {
				params: { page, limit: PAGE_SIZE, globalFilter: search, categoryId, subcategoryId, productId },
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

// Fetches every variant in one call (no pagination) for the spreadsheet-style
// grid, which needs the whole catalog to filter/sort client-side rather than
// page through it. The real catalog is ~185 variants total (2026-08), so this
// stays a small payload - if it ever grows enough to matter, this is the hook
// to revisit (e.g. server-side filtering) rather than the paginated one above.
const ALL_VARIANTS_LIMIT = 5000;

export function useAllVariants() {
	return useQuery({
		queryKey: ["variants-all"],
		queryFn: async () => {
			const { data } = await api.get("/admin/variant/", {
				params: { page: 0, limit: ALL_VARIANTS_LIMIT, globalFilter: "" },
			});
			const rows = data.rows ?? [];
			const seen = new Set();
			return rows.filter((row) => (seen.has(row.id) ? false : seen.add(row.id)));
		},
	});
}

// Autosave for a single grid cell: PUT just {id, [field]: value} (safe -
// updateVariantForAdmin does a plain Sequelize .update() with whatever keys
// are sent, no destructive full-array requirement like Subcategory/Product
// had) and patch the already-fetched "variants-all" cache in place instead of
// invalidating+refetching the whole grid on every keystroke's autosave.
export function useUpdateVariantField() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, field, value }) => api.put("/admin/variant/", { id, [field]: value }),
		onSuccess: (_data, { id, field, value }) => {
			queryClient.setQueryData(["variants-all"], (old) =>
				old ? old.map((row) => (row.id === id ? { ...row, [field]: value } : row)) : old
			);
			// Toggling featured status/position from the grid should also refresh
			// the dedicated Featured curation page if it's mounted.
			if (field === "featured" || field === "featured_position") {
				queryClient.invalidateQueries({ queryKey: ["featured-variants"] });
			}
		},
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

// Mass Edit: download the full catalog as Excel, edit offline, re-upload.
export function useExportVariants() {
	return useMutation({
		mutationFn: async () => {
			const { data } = await api.get("/admin/variant/export", { responseType: "blob" });
			return data;
		},
	});
}

export function useBulkImportVariants() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (file) => {
			const formData = new FormData();
			formData.append("file", file);
			return api.post("/admin/variant/bulk-import", formData);
		},
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["variants-all"] }),
	});
}

export function useVariantAuditLog(variantId) {
	return useQuery({
		queryKey: ["variant-audit-log", variantId],
		queryFn: async () => {
			const { data } = await api.get(`/admin/variant/${variantId}/audit-log`);
			return data;
		},
		enabled: Boolean(variantId),
	});
}

// Admin-curated Featured list (distinct from Frequently Bought Together /
// hooks/catalog/useFeatured.js's source-target model) - a variant is either
// featured or not, ordered by featured_position.
export function useFeaturedVariants() {
	return useQuery({
		queryKey: ["featured-variants"],
		queryFn: async () => {
			const { data } = await api.get("/admin/variant/featured");
			return data ?? [];
		},
	});
}

const AUDIT_LOG_PAGE_SIZE = 50;

// Global, cross-variant activity feed - distinct from useVariantAuditLog
// above, which is scoped to one variant.
export function useAllVariantAuditLog(page = 0) {
	return useQuery({
		queryKey: ["variant-audit-log-all", page],
		queryFn: async () => {
			const { data } = await api.get("/admin/variant-audit-log", {
				params: { page, limit: AUDIT_LOG_PAGE_SIZE },
			});
			return data;
		},
	});
}

export { PAGE_SIZE, AUDIT_LOG_PAGE_SIZE };

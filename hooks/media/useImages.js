"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export function useImages(search = "") {
	return useQuery({
		queryKey: ["images", search],
		queryFn: async () => {
			const { data } = await api.get("/images/all", { params: { search } });
			return data.data ?? [];
		},
	});
}

export function useUploadImage() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (file) => {
			const formData = new FormData();
			formData.append("file", file);
			return api.post("/images/upload", formData);
		},
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["images"] }),
	});
}

export function useDeleteImages() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (images) => api.post("/images/delete", { images }),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["images"] }),
	});
}

// deleteImageConnections runs first server-side, so attaching replaces a
// target's existing image set rather than appending to it. Subcategories/
// products/variants embed their own attached images in their list response
// (subcategory_images/product_images, variant images), so a successful
// attach must invalidate those lists too or a target's own detail view keeps
// showing the pre-attach image set until an unrelated refetch happens to run.
export function useAttachImages() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ ids, target, targetId }) => api.post("/images/attach", { ids, target, targetId }),
		onSuccess: (_data, { target }) => {
			if (target === "subcategory") queryClient.invalidateQueries({ queryKey: ["subcategories"] });
			else if (target === "product") queryClient.invalidateQueries({ queryKey: ["products"] });
			else if (target === "variant") {
				queryClient.invalidateQueries({ queryKey: ["variants"] });
				// The Variants grid fetches everything in one call under a
				// different key (useAllVariants) than the paginated list above.
				queryClient.invalidateQueries({ queryKey: ["variants-all"] });
			}
		},
	});
}

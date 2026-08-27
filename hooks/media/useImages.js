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
// target's existing image set rather than appending to it.
export function useAttachImages() {
	return useMutation({
		mutationFn: ({ ids, target, targetId }) => api.post("/images/attach", { ids, target, targetId }),
	});
}

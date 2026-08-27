"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export function useLogout() {
	const router = useRouter();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: () => api.post("/auth/logout"),
		onSettled: () => {
			queryClient.clear();
			router.push("/login");
			router.refresh();
		},
	});
}

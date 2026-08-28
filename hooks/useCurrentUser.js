"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export function useCurrentUser() {
	return useQuery({
		queryKey: ["currentUser"],
		queryFn: async () => {
			const { data } = await api.get("/user/user-details");
			return data.userObject;
		},
		retry: false,
	});
}

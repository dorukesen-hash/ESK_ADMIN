"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Providers({ children }) {
	const [queryClient] = useState(() => new QueryClient({
		defaultOptions: {
			queries: {
				refetchOnWindowFocus: false,
				retry: 1,
			},
		},
	}));

	return (
		<QueryClientProvider client={queryClient}>
			{children}
			<ToastContainer position="top-right" autoClose={3000} />
		</QueryClientProvider>
	);
}

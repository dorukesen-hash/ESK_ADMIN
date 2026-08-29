"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/useCurrentUser";

// ESK_ADMIN and ESK_API are on different domains (admin.eskpackaging.com vs
// eskapi-production.up.railway.app). auth/refresh cookies are set by the API's
// own Set-Cookie response, so they're scoped to the API's domain - the browser
// attaches them correctly on axios/fetch calls to that domain (withCredentials +
// CORS + SameSite=None), but a same-origin page request to admin.eskpackaging.com
// (which is what Next.js middleware sees) never carries them. Server-side
// middleware can't check auth here at all - the check has to happen client-side,
// where the browser can actually reach the API with the right cookies.
export default function AuthGuard({ children }) {
	const router = useRouter();
	const { data: user, isLoading, isError } = useCurrentUser();
	const isAuthorized = user?.isAdmin === "admin";

	useEffect(() => {
		if (!isLoading && !isAuthorized) {
			router.replace("/login");
		}
	}, [isLoading, isAuthorized, router]);

	if (isLoading || isError || !isAuthorized) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-button-gray">
				<p className="text-sm text-text-light">Yükleniyor...</p>
			</div>
		);
	}

	return children;
}

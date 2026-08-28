import { NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login"];

export async function middleware(request) {
	const { pathname } = request.nextUrl;
	const isPublicPath = PUBLIC_PATHS.includes(pathname);
	const hasAccessToken = request.cookies.has("accessToken");

	let isAdmin = false;

	if (hasAccessToken) {
		try {
			const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/user-details`, {
				headers: { cookie: request.headers.get("cookie") ?? "" },
			});
			if (res.ok) {
				const data = await res.json();
				isAdmin = data?.userObject?.isAdmin === "admin";
			}
		} catch {
			isAdmin = false;
		}
	}

	if (!isAdmin && !isPublicPath) {
		return NextResponse.redirect(new URL("/login", request.url));
	}

	if (isAdmin && isPublicPath) {
		return NextResponse.redirect(new URL("/", request.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

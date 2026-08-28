"use client";

import { LogOut, UserCircle } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useLogout } from "@/hooks/useLogout";

export default function Topbar() {
	const { data: user } = useCurrentUser();
	const logout = useLogout();

	return (
		<header className="flex h-16 items-center justify-end gap-4 border-b border-border-gray bg-white px-6">
			<div className="flex items-center gap-2 text-sm text-text-dark">
				<UserCircle size={20} />
				{user ? `${user.name} ${user.surname}` : "..."}
			</div>
			<button
				type="button"
				onClick={() => logout.mutate()}
				disabled={logout.isPending}
				className="flex items-center gap-1 text-sm text-text-light transition hover:text-custom-blue disabled:opacity-50"
			>
				<LogOut size={16} />
				Çıkış
			</button>
		</header>
	);
}

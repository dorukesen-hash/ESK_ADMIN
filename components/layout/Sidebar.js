"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { navSections } from "./navConfig";

function NavGroup({ section, pathname }) {
	const isChildActive = section.children.some((child) => pathname.startsWith(child.href));
	const [open, setOpen] = useState(isChildActive);
	const Icon = section.icon;

	return (
		<div>
			<button
				type="button"
				onClick={() => setOpen((o) => !o)}
				className={`flex w-full items-center justify-between px-4 py-2 text-sm font-medium transition ${
					isChildActive ? "text-custom-blue" : "text-text-dark hover:bg-button-gray"
				}`}
			>
				<span className="flex items-center gap-2">
					<Icon size={16} />
					{section.label}
				</span>
				<ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
			</button>
			{open && (
				<div className="ml-4 border-l border-border-gray">
					{section.children.map((child) => (
						<Link
							key={child.href}
							href={child.href}
							className={`block px-4 py-2 text-sm transition ${
								pathname === child.href
									? "bg-custom-blue text-white"
									: "text-text-dark hover:bg-button-gray"
							}`}
						>
							{child.label}
						</Link>
					))}
				</div>
			)}
		</div>
	);
}

export default function Sidebar() {
	const pathname = usePathname();

	return (
		<aside className="flex w-64 shrink-0 flex-col border-r border-border-gray bg-white">
			<div className="px-4 py-5">
				<span className="font-montserrat text-lg font-semibold text-text-dark">ESK Admin</span>
			</div>
			<nav className="flex-1 overflow-y-auto pb-4">
				{navSections.map((section) =>
					section.children ? (
						<NavGroup key={section.label} section={section} pathname={pathname} />
					) : (
						<Link
							key={section.href}
							href={section.href}
							className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition ${
								pathname === section.href
									? "bg-custom-blue text-white"
									: "text-text-dark hover:bg-button-gray"
							}`}
						>
							<section.icon size={16} />
							{section.label}
						</Link>
					)
				)}
			</nav>
		</aside>
	);
}

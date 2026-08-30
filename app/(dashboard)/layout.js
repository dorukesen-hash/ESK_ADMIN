import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import AuthGuard from "@/components/auth/AuthGuard";

export default function DashboardLayout({ children }) {
	return (
		<AuthGuard>
			<div className="flex min-h-screen bg-button-gray">
				<Sidebar />
				{/* min-w-0 lets a page with genuinely wide content (the Variants grid)
				    scroll within itself instead of forcing this whole column - and the
				    fixed Topbar/toolbar above it - wider than the viewport. A no-op for
				    every other page, which never has content wider than its own box. */}
				<div className="flex min-w-0 flex-1 flex-col">
					<Topbar />
					<main className="min-w-0 flex-1 p-6">{children}</main>
				</div>
			</div>
		</AuthGuard>
	);
}

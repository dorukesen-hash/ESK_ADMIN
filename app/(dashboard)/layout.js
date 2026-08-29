import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import AuthGuard from "@/components/auth/AuthGuard";

export default function DashboardLayout({ children }) {
	return (
		<AuthGuard>
			<div className="flex min-h-screen bg-button-gray">
				<Sidebar />
				<div className="flex flex-1 flex-col">
					<Topbar />
					<main className="flex-1 p-6">{children}</main>
				</div>
			</div>
		</AuthGuard>
	);
}

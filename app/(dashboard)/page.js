"use client";

import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import { useOrderStatusCounts } from "@/hooks/dashboard/useDashboardStats";
import { useClaims } from "@/hooks/customers/useClaims";

export default function DashboardPage() {
	const { counts, isLoading: statsLoading } = useOrderStatusCounts();
	const { data: claimsData, isLoading: claimsLoading } = useClaims({ page: 0 });
	const recentClaims = (claimsData?.rows ?? []).slice(0, 5);

	return (
		<div>
			<PageHeader title="Dashboard" />

			<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
				{statsLoading
					? Array.from({ length: 6 }).map((_, i) => (
							<div key={i} className="bg-white p-4 shadow-custom">
								<p className="text-sm text-text-light">Yükleniyor...</p>
							</div>
						))
					: counts.map((c) => (
							<Link
								key={c.status}
								href="/orders"
								className="block bg-white p-4 shadow-custom transition hover:bg-custom-table-soft-blue"
							>
								<p className="text-2xl font-semibold text-text-dark">{c.count}</p>
								<p className="text-sm text-text-light">{c.status}</p>
							</Link>
						))}
			</div>

			<div className="mt-8 bg-white p-6 shadow-custom">
				<div className="mb-4 flex items-center justify-between">
					<p className="font-montserrat text-base font-semibold text-text-dark">Son Talepler</p>
					<Link href="/customers/claims" className="text-sm text-custom-blue hover:underline">
						Tümünü Gör
					</Link>
				</div>

				{claimsLoading ? (
					<p className="text-sm text-text-light">Yükleniyor...</p>
				) : recentClaims.length === 0 ? (
					<p className="text-sm text-text-light">Henüz talep yok.</p>
				) : (
					<div className="divide-y divide-border-gray">
						{recentClaims.map((claim) => (
							<div key={claim.id} className="flex items-center justify-between py-3 text-sm">
								<div>
									<p className="text-text-dark">{claim.contactName || "-"}</p>
									<p className="text-text-light">{claim.email}</p>
								</div>
								<span
									className={`inline-block h-2 w-2 rounded-full ${
										claim.read ? "bg-border-gray" : "bg-custom-blue"
									}`}
									title={claim.read ? "Okundu" : "Okunmadı"}
								/>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

"use client";

import { useState } from "react";
import { Trash2, ArrowLeft } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import VariantPicker from "@/components/catalog/VariantPicker";
import {
	useFeaturedFor,
	useFeaturedSources,
	useAddFeatured,
	useRemoveFeatured,
} from "@/hooks/catalog/useFeatured";
import { notifySuccess, notifyError } from "@/lib/toast";

// Moved from /catalog/featured (route reclaimed for the real, admin-curated
// Featured list - see app/(dashboard)/catalog/featured/page.js). This page's
// own logic is unchanged - it already was "frequently bought together" under
// the wrong name (the Featured/source_id/target_id model, consumed by
// ESK_FE's PDP "Frequently Purchased Together" tab), just relabeled here.
export default function FrequentlyBoughtTogetherPage() {
	const [source, setSource] = useState(null);

	const { data: sources = [], isLoading: sourcesLoading } = useFeaturedSources();
	const { data: featured = [], isLoading } = useFeaturedFor(source?.id);
	const addFeatured = useAddFeatured();
	const removeFeatured = useRemoveFeatured();

	const handleAdd = async (target) => {
		try {
			await addFeatured.mutateAsync({ source_id: source.id, target_id: target.id });
			notifySuccess("Eklendi.");
		} catch (error) {
			notifyError(error?.response?.data?.message || "Eklenemedi.");
		}
	};

	const handleRemove = async (targetId) => {
		try {
			await removeFeatured.mutateAsync({ targetId, sourceId: source.id });
			notifySuccess("Kaldırıldı.");
		} catch (error) {
			notifyError(error?.response?.data?.message || "Kaldırılamadı.");
		}
	};

	return (
		<div>
			<PageHeader title="Sıkça Birlikte Alınanlar" />
			<p className="mb-4 text-sm text-text-light">
				Bir varyant için &quot;sıkça birlikte alınan&quot; en fazla 3 varyant belirleyebilirsiniz. Bu
				liste, ürün sayfasındaki &quot;Frequently Purchased Together&quot; sekmesinde gösterilir.
			</p>

			{!source && (
				<>
					<div className="bg-white shadow-custom">
						<div className="border-b border-border-gray px-4 py-3">
							<span className="text-sm font-semibold text-text-dark">
								Daha önce eklenenler <span className="font-normal text-text-light">({sources.length})</span>
							</span>
						</div>
						{sourcesLoading && <div className="p-4 text-center text-sm text-text-light">Yükleniyor...</div>}
						{!sourcesLoading && sources.length === 0 && (
							<div className="p-4 text-center text-sm text-text-light">
								Henüz hiçbir varyant için ilişki eklenmedi.
							</div>
						)}
						{!sourcesLoading && sources.length > 0 && (
							<ul className="divide-y divide-border-gray">
								{sources.map((v) => (
									<li key={v.id}>
										<button
											type="button"
											onClick={() => setSource(v)}
											className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-custom-table-soft-blue"
										>
											<span className="text-sm text-text-dark">
												{v.title} <span className="text-text-light">({v.stock})</span>
											</span>
											<span className="text-sm text-text-light">{v.targetCount} varyant</span>
										</button>
									</li>
								))}
							</ul>
						)}
					</div>

					<div className="mt-6 max-w-md">
						<p className="mb-2 text-sm font-medium text-text-dark">Ya da yeni bir kaynak varyant seçin</p>
						<VariantPicker onSelect={setSource} placeholder="Kaynak varyant ara..." />
					</div>
				</>
			)}

			{source && (
				<div className="bg-white p-6 shadow-custom">
					<button
						type="button"
						onClick={() => setSource(null)}
						className="mb-4 flex items-center gap-1 text-sm text-text-light hover:text-custom-blue"
					>
						<ArrowLeft size={14} /> Listeye dön
					</button>

					<h2 className="font-montserrat text-base font-semibold text-text-dark">
						{source.title} <span className="text-text-light">({source.stock})</span>
					</h2>

					<ul className="mt-4 divide-y divide-border-gray">
						{isLoading && <li className="py-2 text-sm text-text-light">Yükleniyor...</li>}
						{!isLoading && featured.length === 0 && (
							<li className="py-2 text-sm text-text-light">Henüz öne çıkan ürün eklenmedi.</li>
						)}
						{featured.map((item) => (
							<li key={item.target_id} className="flex items-center justify-between py-2">
								<span className="text-sm text-text-dark">
									{item.target?.title} <span className="text-text-light">({item.target?.stock})</span>
								</span>
								<button
									type="button"
									onClick={() => handleRemove(item.target_id)}
									className="text-text-light hover:text-red-600"
								>
									<Trash2 size={16} />
								</button>
							</li>
						))}
					</ul>

					{featured.length < 3 && (
						<div className="mt-4 max-w-md border-t border-border-gray pt-4">
							<VariantPicker
								onSelect={handleAdd}
								excludeIds={[source.id, ...featured.map((f) => f.target_id)]}
								placeholder="Eklenecek varyant ara..."
							/>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

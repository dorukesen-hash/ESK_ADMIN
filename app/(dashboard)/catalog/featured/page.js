"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import VariantPicker from "@/components/catalog/VariantPicker";
import { useFeaturedFor, useAddFeatured, useRemoveFeatured } from "@/hooks/catalog/useFeatured";
import { notifySuccess, notifyError } from "@/lib/toast";

export default function FeaturedPage() {
	const [source, setSource] = useState(null);

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
			<PageHeader title="Öne Çıkan Ürünler" />
			<p className="mb-4 text-sm text-text-light">
				Bir varyant için &quot;sıkça birlikte alınan&quot; en fazla 3 varyant belirleyebilirsiniz.
			</p>

			<div className="max-w-md">
				<VariantPicker onSelect={setSource} placeholder="Kaynak varyant ara..." />
			</div>

			{source && (
				<div className="mt-6 bg-white p-6 shadow-custom">
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

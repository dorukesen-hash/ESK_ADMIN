"use client";

import { ArrowUp, ArrowDown, Trash2 } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import VariantPicker from "@/components/catalog/VariantPicker";
import { useFeaturedVariants, useUpdateVariantField } from "@/hooks/catalog/useVariants";
import { notifySuccess, notifyError } from "@/lib/toast";

// Real, admin-curated "Featured" list - distinct from Frequently Bought
// Together (moved to /catalog/frequently-bought-together, the old
// source/target model this route used to host). A variant is either featured
// or not (`featured` boolean) with a `featured_position` for ordering;
// ESK_FE's homepage grid (components/home/FeaturedGrid.js) reads this list
// instead of just showing the first 8 variants that happen to exist.
export default function FeaturedPage() {
	const { data: featured = [], isLoading } = useFeaturedVariants();
	const updateField = useUpdateVariantField();

	const handleAdd = async (variant) => {
		try {
			const nextPosition = featured.length
				? Math.max(...featured.map((f) => f.featured_position ?? 0)) + 1
				: 0;
			await updateField.mutateAsync({ id: variant.id, field: "featured", value: true });
			await updateField.mutateAsync({ id: variant.id, field: "featured_position", value: nextPosition });
			notifySuccess("Öne çıkanlara eklendi.");
		} catch (error) {
			notifyError(error?.response?.data?.message || "Eklenemedi.");
		}
	};

	const handleRemove = async (variant) => {
		try {
			await updateField.mutateAsync({ id: variant.id, field: "featured", value: false });
			await updateField.mutateAsync({ id: variant.id, field: "featured_position", value: null });
			notifySuccess("Öne çıkanlardan kaldırıldı.");
		} catch (error) {
			notifyError(error?.response?.data?.message || "Kaldırılamadı.");
		}
	};

	const handleMove = async (index, direction) => {
		const otherIndex = index + direction;
		if (otherIndex < 0 || otherIndex >= featured.length) return;
		const current = featured[index];
		const other = featured[otherIndex];
		try {
			await Promise.all([
				updateField.mutateAsync({
					id: current.id,
					field: "featured_position",
					value: other.featured_position,
				}),
				updateField.mutateAsync({
					id: other.id,
					field: "featured_position",
					value: current.featured_position,
				}),
			]);
		} catch (error) {
			notifyError("Sıralama güncellenemedi.");
		}
	};

	return (
		<div>
			<PageHeader title="Öne Çıkanlar" />
			<p className="mb-4 text-sm text-text-light">
				Burada seçtiğiniz varyantlar ana sayfadaki &quot;Featured Products&quot; bölümünde, aşağıdaki
				sırayla gösterilir.
			</p>

			<div className="max-w-md">
				<VariantPicker
					onSelect={handleAdd}
					excludeIds={featured.map((f) => f.id)}
					placeholder="Öne çıkarılacak varyant ara..."
				/>
			</div>

			<div className="mt-6 bg-white shadow-custom">
				{isLoading && <div className="p-6 text-center text-sm text-text-light">Yükleniyor...</div>}
				{!isLoading && featured.length === 0 && (
					<div className="p-6 text-center text-sm text-text-light">Henüz öne çıkan varyant yok.</div>
				)}
				{!isLoading && featured.length > 0 && (
					<ul className="divide-y divide-border-gray">
						{featured.map((variant, index) => (
							<li key={variant.id} className="flex items-center justify-between px-4 py-3">
								<div className="flex items-center gap-3">
									<span className="w-6 text-center text-sm text-text-light">{index + 1}</span>
									<span className="text-sm text-text-dark">
										{variant.title} <span className="text-text-light">({variant.stock})</span>
									</span>
								</div>
								<div className="flex items-center gap-2">
									<button
										type="button"
										onClick={() => handleMove(index, -1)}
										disabled={index === 0}
										className="text-text-light hover:text-custom-blue disabled:opacity-30"
									>
										<ArrowUp size={16} />
									</button>
									<button
										type="button"
										onClick={() => handleMove(index, 1)}
										disabled={index === featured.length - 1}
										className="text-text-light hover:text-custom-blue disabled:opacity-30"
									>
										<ArrowDown size={16} />
									</button>
									<button
										type="button"
										onClick={() => handleRemove(variant)}
										className="text-text-light hover:text-red-600"
									>
										<Trash2 size={16} />
									</button>
								</div>
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	);
}

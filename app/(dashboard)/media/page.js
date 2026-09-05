"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Upload, Trash2, Link2 } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import SearchInput from "@/components/ui/SearchInput";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import AttachImagesModal from "@/components/media/AttachImagesModal";
import { useImages, useUploadImage, useDeleteImages } from "@/hooks/media/useImages";
import { notifySuccess, notifyError } from "@/lib/toast";
import { cdnUrl } from "@/lib/cdn";

export default function MediaPage() {
	const [search, setSearch] = useState("");
	const [selectedIds, setSelectedIds] = useState([]);
	const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
	const [attachOpen, setAttachOpen] = useState(false);
	const fileInputRef = useRef(null);

	const { data: images = [], isLoading } = useImages(search);
	const uploadImage = useUploadImage();
	const deleteImages = useDeleteImages();

	const toggleSelect = (id) => {
		setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
	};

	const handleFilesSelected = async (e) => {
		const files = Array.from(e.target.files ?? []);
		e.target.value = "";
		if (files.length === 0) return;

		let successCount = 0;
		for (const file of files) {
			try {
				await uploadImage.mutateAsync(file);
				successCount += 1;
			} catch (error) {
				notifyError(`"${file.name}" yüklenemedi.`);
			}
		}
		if (successCount > 0) notifySuccess(`${successCount} resim yüklendi.`);
	};

	const handleDelete = async () => {
		try {
			const targets = images
				.filter((img) => selectedIds.includes(img.id))
				.map((img) => ({ id: img.id, url: img.url }));
			await deleteImages.mutateAsync(targets);
			notifySuccess("Resimler silindi.");
			setSelectedIds([]);
			setConfirmDeleteOpen(false);
		} catch (error) {
			notifyError(error?.response?.data?.message || "Silme başarısız.");
		}
	};

	return (
		<div>
			<PageHeader
				title="Görseller"
				action={
					<>
						<input
							ref={fileInputRef}
							type="file"
							accept="image/*"
							multiple
							hidden
							onChange={handleFilesSelected}
						/>
						<Button onClick={() => fileInputRef.current?.click()} isLoading={uploadImage.isPending}>
							<span className="flex items-center gap-1">
								<Upload size={16} /> Resim Yükle
							</span>
						</Button>
					</>
				}
			/>

			<div className="mb-4 flex flex-wrap items-center justify-between gap-4">
				<SearchInput value={search} onChange={setSearch} placeholder="Görsel ara..." />
				{selectedIds.length > 0 && (
					<div className="flex items-center gap-2">
						<span className="text-sm text-text-light">{selectedIds.length} seçili</span>
						<Button variant="secondary" onClick={() => setAttachOpen(true)}>
							<span className="flex items-center gap-1">
								<Link2 size={16} /> Ata
							</span>
						</Button>
						<Button variant="danger" onClick={() => setConfirmDeleteOpen(true)}>
							<span className="flex items-center gap-1">
								<Trash2 size={16} /> Sil
							</span>
						</Button>
					</div>
				)}
			</div>

			{isLoading && (
				<div className="bg-white p-8 text-center text-sm text-text-light shadow-custom">Yükleniyor...</div>
			)}

			{!isLoading && images.length === 0 && (
				<div className="bg-white p-8 text-center text-sm text-text-light shadow-custom">Görsel bulunamadı</div>
			)}

			{!isLoading && images.length > 0 && (
				<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
					{images.map((img) => {
						const selected = selectedIds.includes(img.id);
						return (
							<button
								key={img.id}
								type="button"
								onClick={() => toggleSelect(img.id)}
								className={`relative aspect-square overflow-hidden border-2 bg-white ${
									selected ? "border-custom-blue" : "border-transparent"
								}`}
							>
								<Image
									src={cdnUrl(img.url)}
									alt=""
									fill
									sizes="(max-width: 768px) 33vw, 200px"
									className="object-cover"
								/>
								{selected && <div className="absolute inset-0 bg-custom-blue/20" />}
							</button>
						);
					})}
				</div>
			)}

			<AttachImagesModal
				open={attachOpen}
				onClose={() => setAttachOpen(false)}
				imageIds={selectedIds}
				onDone={() => {
					setAttachOpen(false);
					setSelectedIds([]);
				}}
			/>

			<ConfirmDialog
				open={confirmDeleteOpen}
				onClose={() => setConfirmDeleteOpen(false)}
				onConfirm={handleDelete}
				title="Görselleri sil"
				description={`${selectedIds.length} görseli silmek istediğinize emin misiniz?`}
				isLoading={deleteImages.isPending}
			/>
		</div>
	);
}

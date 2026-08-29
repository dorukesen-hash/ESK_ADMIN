"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Upload } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import SearchInput from "@/components/ui/SearchInput";
import { useImages, useUploadImage, useAttachImages } from "@/hooks/media/useImages";
import { notifySuccess, notifyError } from "@/lib/toast";

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL;

// Manage a category/subcategory/product's images inline, without leaving the
// Catalog browser. /admin/images/attach REPLACES a target's entire image set
// on every call, so this is a full selection editor (pre-checked = currently
// attached), not an incremental add/remove - Save sends the final id list.
export default function NodeImagesModal({ open, onClose, target, targetId, currentImages = [] }) {
	const [search, setSearch] = useState("");
	const [selectedIds, setSelectedIds] = useState([]);
	const fileInputRef = useRef(null);

	const { data: images = [], isLoading } = useImages(search);
	const uploadImage = useUploadImage();
	const attachImages = useAttachImages();

	useEffect(() => {
		if (open) setSelectedIds(currentImages.map((img) => img.id));
	}, [open, currentImages]);

	const toggleSelect = (id) => {
		setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
	};

	const handleFilesSelected = async (e) => {
		const files = Array.from(e.target.files ?? []);
		e.target.value = "";
		if (files.length === 0) return;

		for (const file of files) {
			try {
				const response = await uploadImage.mutateAsync(file);
				const newImage = response?.data?.data;
				if (newImage?.id) {
					setSelectedIds((prev) => [...prev, newImage.id]);
				}
			} catch (error) {
				notifyError(`"${file.name}" could not be uploaded.`);
			}
		}
	};

	const handleSave = async () => {
		try {
			await attachImages.mutateAsync({ ids: selectedIds, target, targetId });
			notifySuccess("Images updated.");
			onClose();
		} catch (error) {
			notifyError(error?.response?.data?.message || "Update failed.");
		}
	};

	return (
		<Modal open={open} onClose={onClose} title="Manage Images" maxWidth="max-w-2xl">
			<div className="space-y-4">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<SearchInput value={search} onChange={setSearch} placeholder="Search images..." />
					<div>
						<input
							ref={fileInputRef}
							type="file"
							accept="image/*"
							multiple
							hidden
							onChange={handleFilesSelected}
						/>
						<Button
							type="button"
							variant="secondary"
							onClick={() => fileInputRef.current?.click()}
							isLoading={uploadImage.isPending}
						>
							<span className="flex items-center gap-1">
								<Upload size={16} /> Upload
							</span>
						</Button>
					</div>
				</div>

				{isLoading && <div className="bg-button-gray p-8 text-center text-sm text-text-light">Loading...</div>}
				{!isLoading && images.length === 0 && (
					<div className="bg-button-gray p-8 text-center text-sm text-text-light">No images found</div>
				)}
				{!isLoading && images.length > 0 && (
					<div className="grid max-h-96 grid-cols-4 gap-3 overflow-y-auto sm:grid-cols-5">
						{images.map((img) => {
							const selected = selectedIds.includes(img.id);
							return (
								<button
									key={img.id}
									type="button"
									onClick={() => toggleSelect(img.id)}
									className={`relative aspect-square overflow-hidden border-2 bg-button-gray ${
										selected ? "border-custom-blue" : "border-transparent"
									}`}
								>
									<Image
										src={`${CDN_URL}/${img.url}`}
										alt=""
										fill
										sizes="120px"
										className="object-cover"
									/>
									{selected && <div className="absolute inset-0 bg-custom-blue/20" />}
								</button>
							);
						})}
					</div>
				)}

				<div className="flex items-center justify-between pt-2">
					<span className="text-sm text-text-light">{selectedIds.length} selected</span>
					<div className="flex gap-2">
						<Button type="button" variant="secondary" onClick={onClose}>
							Cancel
						</Button>
						<Button type="button" onClick={handleSave} isLoading={attachImages.isPending}>
							Save
						</Button>
					</div>
				</div>
			</div>
		</Modal>
	);
}

"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Upload, X } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import SearchInput from "@/components/ui/SearchInput";
import { useImages, useUploadImage, useAttachImages } from "@/hooks/media/useImages";
import { notifySuccess, notifyError } from "@/lib/toast";

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL;

// Manage a category/subcategory/product's images inline, without leaving the
// Catalog browser. /admin/images/attach REPLACES a target's entire image set
// on every call, so this is a full selection editor (pre-checked = currently
// attached), not an incremental add/remove - Save sends the final id list,
// in order, which the API persists as each row's `position`.
export default function NodeImagesModal({ open, onClose, target, targetId, currentImages = [] }) {
	const [search, setSearch] = useState("");
	const [selectedIds, setSelectedIds] = useState([]);
	const [imageMeta, setImageMeta] = useState({});
	const [dragIndex, setDragIndex] = useState(null);
	const fileInputRef = useRef(null);

	const { data: images = [], isLoading } = useImages(search);
	const uploadImage = useUploadImage();
	const attachImages = useAttachImages();

	useEffect(() => {
		if (open) {
			setSelectedIds(currentImages.map((img) => img.id));
			setImageMeta((prev) => ({
				...prev,
				...Object.fromEntries(currentImages.map((img) => [img.id, img])),
			}));
		}
	}, [open, currentImages]);

	// The browsable grid below is filtered by `search`, so an already-selected
	// image can scroll out of it - imageMeta is a standing id->{id,url} cache
	// (seeded above from currentImages) so the top "Selected" strip can still
	// render a thumbnail for it regardless of the current search term.
	useEffect(() => {
		if (images.length > 0) {
			setImageMeta((prev) => ({
				...prev,
				...Object.fromEntries(images.map((img) => [img.id, img])),
			}));
		}
	}, [images]);

	const toggleSelect = (id) => {
		setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
	};

	const handleDragStart = (index) => (e) => {
		setDragIndex(index);
		e.dataTransfer.effectAllowed = "move";
	};

	const handleDragOver = (index) => (e) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = "move";
	};

	const handleDrop = (index) => (e) => {
		e.preventDefault();
		setDragIndex((currentDragIndex) => {
			if (currentDragIndex === null || currentDragIndex === index) return null;
			setSelectedIds((prev) => {
				const next = [...prev];
				const [moved] = next.splice(currentDragIndex, 1);
				next.splice(index, 0, moved);
				return next;
			});
			return null;
		});
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
					setImageMeta((prev) => ({ ...prev, [newImage.id]: newImage }));
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
				<div>
					<div className="mb-2 text-sm font-medium">Selected ({selectedIds.length})</div>
					{selectedIds.length === 0 ? (
						<div className="bg-button-gray p-4 text-center text-sm text-text-light">No images selected yet</div>
					) : (
						<div className="grid max-h-48 grid-cols-4 gap-3 overflow-y-auto sm:grid-cols-6">
							{selectedIds.map((id, index) => {
								const img = imageMeta[id];
								if (!img) return null;
								return (
									<div
										key={id}
										draggable
										onDragStart={handleDragStart(index)}
										onDragOver={handleDragOver(index)}
										onDrop={handleDrop(index)}
										className={`relative aspect-square cursor-move overflow-hidden border-2 border-custom-blue bg-button-gray ${
											dragIndex === index ? "opacity-40" : ""
										}`}
									>
										<Image
											src={`${CDN_URL}/${img.url}`}
											alt=""
											fill
											sizes="120px"
											className="pointer-events-none object-cover"
										/>
										<button
											type="button"
											onClick={() => toggleSelect(id)}
											className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
											aria-label="Remove"
										>
											<X size={12} />
										</button>
									</div>
								);
							})}
						</div>
					)}
				</div>

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

				<div className="text-sm font-medium">Add images</div>
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

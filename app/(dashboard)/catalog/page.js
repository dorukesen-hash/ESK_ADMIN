"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import NextImage from "next/image";
import { Pencil, Trash2, Plus, Search, X } from "lucide-react";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { textareaClass } from "@/components/ui/FormField";
import CatalogBreadcrumb from "@/components/catalog/CatalogBreadcrumb";
import CatalogNodeChildrenSection from "@/components/catalog/CatalogNodeChildrenSection";
import CatalogNodeFormModal from "@/components/catalog/CatalogNodeFormModal";
import VariantsSection from "@/components/catalog/VariantsSection";
import VariantQuickEditModal from "@/components/catalog/VariantQuickEditModal";
import VariantExcelUploadModal from "@/components/catalog/VariantExcelUploadModal";
import NodeImagesModal from "@/components/catalog/NodeImagesModal";
import {
	useCatalogTree,
	useCreateCatalogNode,
	useUpdateCatalogNode,
	useDeleteCatalogNode,
} from "@/hooks/catalog/useCatalogNodes";
import {
	useVariants,
	useUpdateVariant,
	useDeleteVariant,
	useUploadVariantExcel,
	PAGE_SIZE,
} from "@/hooks/catalog/useVariants";
import { findNode, findAncestors } from "@/lib/catalogNodeTree";
import { notifySuccess, notifyError } from "@/lib/toast";
import { cdnUrl } from "@/lib/cdn";

export default function CatalogPage() {
	const router = useRouter();
	const searchParams = useSearchParams();

	const nodeId = searchParams.get("node") ? Number(searchParams.get("node")) : null;

	const [searchQuery, setSearchQuery] = useState("");
	const [searchPage, setSearchPage] = useState(0);
	const [variantsPage, setVariantsPage] = useState(0);

	const [nodeFormOpen, setNodeFormOpen] = useState(false);
	const [editingNode, setEditingNode] = useState(null);
	const [deletingNode, setDeletingNode] = useState(null);

	const [editingVariant, setEditingVariant] = useState(null);
	const [deletingVariant, setDeletingVariant] = useState(null);
	const [excelUploadOpen, setExcelUploadOpen] = useState(false);
	const [imagesModalOpen, setImagesModalOpen] = useState(false);

	const [isEditingDesc, setIsEditingDesc] = useState(false);
	const [descDraft, setDescDraft] = useState("");

	const { data: tree = [], isLoading: treeLoading } = useCatalogTree();

	const createNode = useCreateCatalogNode();
	const updateNode = useUpdateCatalogNode();
	const deleteNode = useDeleteCatalogNode();
	const updateVariant = useUpdateVariant();
	const deleteVariant = useDeleteVariant();
	const uploadExcel = useUploadVariantExcel();

	// Self-healing: a stale ?node=<id> (deleted elsewhere, bad link) just
	// falls back to the root view instead of crashing - findNode returns
	// null and currentNode stays null, same as never having a node param.
	const currentNode = useMemo(() => (nodeId ? findNode(tree, nodeId) : null), [tree, nodeId]);
	const ancestors = useMemo(() => (currentNode ? findAncestors(tree, currentNode.id) : []), [tree, currentNode]);

	const isSearching = searchQuery.trim().length > 0;
	const showNode = !isSearching && Boolean(currentNode);

	useEffect(() => {
		setVariantsPage(0);
		setIsEditingDesc(false);
	}, [nodeId]);

	useEffect(() => {
		setSearchPage(0);
	}, [searchQuery]);

	const goToNode = (id) => router.push(id ? `/catalog?node=${id}` : "/catalog");

	const handleSearchChange = (value) => setSearchQuery(value);

	const childrenOfCurrent = currentNode ? currentNode.children ?? [] : tree;

	const variantsFilter = currentNode ? { nodeId: currentNode.id } : null;

	const { data: hierarchyVariantsData, isLoading: hierarchyVariantsLoading } = useVariants({
		page: variantsPage,
		...variantsFilter,
		enabled: Boolean(variantsFilter),
	});
	const { data: searchData, isLoading: searchLoading } = useVariants({
		page: searchPage,
		search: searchQuery,
		enabled: isSearching,
	});

	const descText = currentNode?.description ?? "";

	const startEditDesc = () => {
		setDescDraft(descText);
		setIsEditingDesc(true);
	};

	const saveDesc = async () => {
		try {
			await updateNode.mutateAsync({ id: currentNode.id, description: descDraft });
			notifySuccess("Açıklama güncellendi.");
			setIsEditingDesc(false);
		} catch (error) {
			notifyError(error?.response?.data?.message || "Güncelleme başarısız.");
		}
	};

	const detailImages = useMemo(() => currentNode?.images ?? [], [currentNode]);

	// NodeImagesModal's contract is [{ id: <image id>, url }] (it seeds
	// selectedIds from img.id and re-POSTs those ids verbatim to
	// /images/attach) - detailImages above is catalog_node_images JOIN rows
	// ({ id: <join-row id>, imageId, image: { url } }), a different shape
	// with its own, unrelated id sequence. Feeding join rows to the modal
	// would both toggle/save the wrong image ids and fail to render
	// thumbnails in the modal's own "Selected" strip. Memoized so the modal's
	// own open-effect (which depends on this array) doesn't re-fire every
	// render on a fresh array reference.
	const nodeImagesForModal = useMemo(
		() => detailImages.map((img) => ({ id: img.imageId, url: img.image?.url })),
		[detailImages]
	);

	const breadcrumbItems = isSearching
		? [
				{ label: "Katalog", onClick: () => goToNode(null) },
				{ label: "Arama Sonuçları", onClick: () => setSearchQuery("") },
		  ]
		: [
				{ label: "Katalog", onClick: () => goToNode(null) },
				...ancestors.map((n) => ({ label: n.name, onClick: () => goToNode(n.id) })),
				...(currentNode ? [{ label: currentNode.name }] : []),
		  ];

	const openNodeEdit = () => {
		if (currentNode) {
			setEditingNode(currentNode);
			setNodeFormOpen(true);
		}
	};

	const openNodeDelete = () => {
		if (currentNode) setDeletingNode(currentNode);
	};

	// --- Node handlers ---
	const handleNodeSubmit = async (values) => {
		try {
			if (editingNode) {
				await updateNode.mutateAsync({ id: editingNode.id, ...values });
				notifySuccess("Node güncellendi.");
			} else {
				await createNode.mutateAsync(values);
				notifySuccess("Node oluşturuldu.");
			}
			setNodeFormOpen(false);
			setEditingNode(null);
		} catch (error) {
			notifyError(error?.response?.data?.message || "İşlem başarısız.");
		}
	};

	const handleNodeDelete = async () => {
		try {
			const wasCurrent = deletingNode.id === nodeId;
			const parentId = deletingNode.parentId;
			await deleteNode.mutateAsync(deletingNode.id);
			notifySuccess("Node silindi.");
			setDeletingNode(null);
			if (wasCurrent) goToNode(parentId ?? null);
		} catch (error) {
			notifyError(error?.response?.data?.message || "Silme başarısız.");
		}
	};

	// --- Variant handlers ---
	const handleVariantUpdate = async (values) => {
		try {
			await updateVariant.mutateAsync(values);
			notifySuccess("Varyant güncellendi.");
			setEditingVariant(null);
		} catch (error) {
			notifyError(error?.response?.data?.message || "Güncelleme başarısız.");
		}
	};

	const handleVariantDelete = async () => {
		try {
			await deleteVariant.mutateAsync(deletingVariant.id);
			notifySuccess("Varyant silindi.");
			setDeletingVariant(null);
		} catch (error) {
			notifyError(error?.response?.data?.message || "Silme başarısız.");
		}
	};

	const handleExcelUpload = async (payload) => {
		try {
			await uploadExcel.mutateAsync(payload);
			notifySuccess("Excel yüklendi.");
			setExcelUploadOpen(false);
		} catch (error) {
			notifyError(error?.response?.data?.message || "Yükleme başarısız.");
		}
	};

	const visibleVariants = isSearching ? searchData : hierarchyVariantsData;
	const visibleVariantsLoading = isSearching ? searchLoading : hierarchyVariantsLoading;
	const visiblePage = isSearching ? searchPage : variantsPage;
	const setVisiblePage = isSearching ? setSearchPage : setVariantsPage;
	const visibleTotalPages = Math.max(1, Math.ceil((visibleVariants?.count ?? 0) / PAGE_SIZE));

	return (
		<div>
			<div className="mb-5 flex flex-wrap items-center justify-between gap-4">
				<div className="flex items-center gap-2">
					<CatalogBreadcrumb items={breadcrumbItems} />
					{showNode && (
						<div className="ml-2 flex items-center gap-1">
							<button type="button" onClick={openNodeEdit} className="text-text-light hover:text-custom-blue">
								<Pencil size={15} />
							</button>
							<button type="button" onClick={openNodeDelete} className="text-text-light hover:text-red-600">
								<Trash2 size={15} />
							</button>
						</div>
					)}
				</div>

				<div className="relative w-full max-w-sm">
					<Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-light" />
					<input
						type="text"
						value={searchQuery}
						onChange={(e) => handleSearchChange(e.target.value)}
						placeholder="Varyant adı veya SKU ile ara..."
						className="w-full border border-border-gray py-2 pl-9 pr-9 text-sm text-text-dark focus:border-custom-blue focus:outline-none"
					/>
					{isSearching && (
						<button
							type="button"
							onClick={() => setSearchQuery("")}
							className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light hover:text-text-dark"
						>
							<X size={14} />
						</button>
					)}
				</div>
			</div>

			{showNode && (
				<div className="mb-6 bg-white p-5 shadow-custom">
					<div className="mb-5">
						<div className="mb-2 flex items-center justify-between">
							<span className="text-xs font-semibold uppercase tracking-wide text-text-light">Açıklama</span>
							{!isEditingDesc && (
								<button
									type="button"
									onClick={startEditDesc}
									className="flex items-center gap-1 text-xs font-medium text-text-light hover:text-custom-blue"
								>
									<Pencil size={13} /> Düzenle
								</button>
							)}
						</div>
						{isEditingDesc ? (
							<div>
								<textarea
									value={descDraft}
									onChange={(e) => setDescDraft(e.target.value)}
									rows={3}
									placeholder="Açıklama yazın..."
									className={textareaClass}
								/>
								<div className="mt-2 flex gap-2">
									<Button onClick={saveDesc} isLoading={updateNode.isPending}>
										Kaydet
									</Button>
									<Button variant="secondary" onClick={() => setIsEditingDesc(false)}>
										Vazgeç
									</Button>
								</div>
							</div>
						) : descText ? (
							<p className="whitespace-pre-line text-sm text-text-dark">{descText}</p>
						) : (
							<p className="text-sm italic text-text-light">Henüz açıklama yok.</p>
						)}
					</div>

					<div>
						<span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-text-light">Görseller</span>
						<div className="flex flex-wrap gap-3">
							{detailImages.map((img) => (
								<div key={img.id} className="relative h-20 w-20 overflow-hidden border border-border-gray bg-button-gray">
									{img.image?.url && (
										<NextImage src={cdnUrl(img.image.url)} alt="" fill sizes="80px" className="object-cover" />
									)}
								</div>
							))}
							<button
								type="button"
								onClick={() => setImagesModalOpen(true)}
								className="flex h-20 w-20 items-center justify-center border border-dashed border-border-gray text-text-light hover:border-custom-blue hover:text-custom-blue"
							>
								<Plus size={18} />
							</button>
						</div>
					</div>
				</div>
			)}

			{isSearching && (
				<VariantsSection
					variants={visibleVariants?.rows ?? []}
					count={visibleVariants?.count ?? 0}
					page={visiblePage}
					totalPages={visibleTotalPages}
					isLoading={visibleVariantsLoading}
					onPageChange={setVisiblePage}
					onEdit={setEditingVariant}
					onDelete={setDeletingVariant}
				/>
			)}

			{!isSearching && (
				<>
					<CatalogNodeChildrenSection
						nodes={childrenOfCurrent}
						isLoading={treeLoading}
						onSelect={(row) => goToNode(row.id)}
						onAdd={() => {
							setEditingNode(null);
							setNodeFormOpen(true);
						}}
						onEdit={(row) => {
							setEditingNode(row);
							setNodeFormOpen(true);
						}}
						onDelete={setDeletingNode}
					/>

					{showNode && (
						<VariantsSection
							variants={hierarchyVariantsData?.rows ?? []}
							count={hierarchyVariantsData?.count ?? 0}
							page={variantsPage}
							totalPages={visibleTotalPages}
							isLoading={hierarchyVariantsLoading}
							onPageChange={setVariantsPage}
							onEdit={setEditingVariant}
							onDelete={setDeletingVariant}
							onUploadExcel={() => setExcelUploadOpen(true)}
						/>
					)}
				</>
			)}

			<CatalogNodeFormModal
				open={nodeFormOpen}
				onClose={() => setNodeFormOpen(false)}
				tree={tree}
				initialValues={editingNode}
				defaultParentId={currentNode?.id}
				onSubmit={handleNodeSubmit}
				isLoading={createNode.isPending || updateNode.isPending}
			/>

			<VariantQuickEditModal
				open={Boolean(editingVariant)}
				onClose={() => setEditingVariant(null)}
				variant={editingVariant}
				onSubmit={handleVariantUpdate}
				isLoading={updateVariant.isPending}
			/>

			<VariantExcelUploadModal
				open={excelUploadOpen}
				onClose={() => setExcelUploadOpen(false)}
				tree={tree}
				initialNode={currentNode ? { id: currentNode.id, label: currentNode.name } : null}
				onSubmit={handleExcelUpload}
				isLoading={uploadExcel.isPending}
			/>

			<NodeImagesModal
				open={imagesModalOpen}
				onClose={() => setImagesModalOpen(false)}
				target="node"
				targetId={currentNode?.id}
				currentImages={nodeImagesForModal}
			/>

			<ConfirmDialog
				open={Boolean(deletingNode)}
				onClose={() => setDeletingNode(null)}
				onConfirm={handleNodeDelete}
				title="Node'u sil"
				description={`"${deletingNode?.name}" silinsin mi? Bu, altındaki her şeyi (alt node'lar ve varyantlar) da kaldırır.`}
				isLoading={deleteNode.isPending}
			/>

			<ConfirmDialog
				open={Boolean(deletingVariant)}
				onClose={() => setDeletingVariant(null)}
				onConfirm={handleVariantDelete}
				title="Varyantı sil"
				description={`"${deletingVariant?.title}" silinsin mi?`}
				isLoading={deleteVariant.isPending}
			/>
		</div>
	);
}

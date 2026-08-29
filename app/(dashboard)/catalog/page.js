"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import NextImage from "next/image";
import { Pencil, Trash2, Plus, Search, X } from "lucide-react";
import api from "@/lib/api";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { textareaClass } from "@/components/ui/FormField";
import CatalogBreadcrumb from "@/components/catalog/CatalogBreadcrumb";
import CategoriesSection from "@/components/catalog/CategoriesSection";
import SubcategoriesSection from "@/components/catalog/SubcategoriesSection";
import ProductsSection from "@/components/catalog/ProductsSection";
import VariantsSection from "@/components/catalog/VariantsSection";
import CategoryFormModal from "@/components/catalog/CategoryFormModal";
import SubcategoryFormModal from "@/components/catalog/SubcategoryFormModal";
import ProductFormModal from "@/components/catalog/ProductFormModal";
import VariantQuickEditModal from "@/components/catalog/VariantQuickEditModal";
import VariantExcelUploadModal from "@/components/catalog/VariantExcelUploadModal";
import NodeImagesModal from "@/components/catalog/NodeImagesModal";
import {
	useCategories,
	useCreateCategory,
	useUpdateCategory,
	useDeleteCategory,
} from "@/hooks/catalog/useCategories";
import {
	useSubcategories,
	useCreateSubcategory,
	useUpdateSubcategory,
	useDeleteSubcategory,
} from "@/hooks/catalog/useSubcategories";
import {
	useProducts,
	useCreateProduct,
	useUpdateProduct,
	useDeleteProduct,
} from "@/hooks/catalog/useProducts";
import {
	useVariants,
	useUpdateVariant,
	useDeleteVariant,
	useUploadVariantExcel,
	PAGE_SIZE,
} from "@/hooks/catalog/useVariants";
import { notifySuccess, notifyError } from "@/lib/toast";

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL;

export default function CatalogPage() {
	const router = useRouter();
	const searchParams = useSearchParams();

	const categoryId = searchParams.get("category") ? Number(searchParams.get("category")) : null;
	const subcategoryId = searchParams.get("subcategory") ? Number(searchParams.get("subcategory")) : null;
	const productId = searchParams.get("product") ? Number(searchParams.get("product")) : null;

	const [searchQuery, setSearchQuery] = useState("");
	const [searchPage, setSearchPage] = useState(0);
	const [variantsPage, setVariantsPage] = useState(0);

	const [categoryFormOpen, setCategoryFormOpen] = useState(false);
	const [editingCategory, setEditingCategory] = useState(null);
	const [deletingCategory, setDeletingCategory] = useState(null);

	const [subcategoryFormOpen, setSubcategoryFormOpen] = useState(false);
	const [editingSubcategory, setEditingSubcategory] = useState(null);
	const [deletingSubcategory, setDeletingSubcategory] = useState(null);

	const [productFormOpen, setProductFormOpen] = useState(false);
	const [editingProduct, setEditingProduct] = useState(null);
	const [deletingProduct, setDeletingProduct] = useState(null);

	const [editingVariant, setEditingVariant] = useState(null);
	const [deletingVariant, setDeletingVariant] = useState(null);
	const [excelUploadOpen, setExcelUploadOpen] = useState(false);
	const [imagesModalOpen, setImagesModalOpen] = useState(false);

	const [isEditingDesc, setIsEditingDesc] = useState(false);
	const [descDraft, setDescDraft] = useState("");

	const { data: categories = [], isLoading: categoriesLoading } = useCategories();
	const { data: subcategories = [], isLoading: subcategoriesLoading } = useSubcategories();
	const { data: products = [], isLoading: productsLoading } = useProducts();

	const createCategory = useCreateCategory();
	const updateCategory = useUpdateCategory();
	const deleteCategory = useDeleteCategory();
	const createSubcategory = useCreateSubcategory();
	const updateSubcategory = useUpdateSubcategory();
	const deleteSubcategory = useDeleteSubcategory();
	const createProduct = useCreateProduct();
	const updateProduct = useUpdateProduct();
	const deleteProduct = useDeleteProduct();
	const updateVariant = useUpdateVariant();
	const deleteVariant = useDeleteVariant();
	const uploadExcel = useUploadVariantExcel();

	const category = useMemo(() => categories.find((c) => c.id === categoryId) ?? null, [categories, categoryId]);
	const subcategory = useMemo(
		() => subcategories.find((s) => s.id === subcategoryId) ?? null,
		[subcategories, subcategoryId]
	);
	const product = useMemo(() => products.find((p) => p.id === productId) ?? null, [products, productId]);

	const isSearching = searchQuery.trim().length > 0;
	const showRoot = !isSearching && !category;
	const showCategoryLevel = !isSearching && !!category && !subcategory && !product;
	const showSubcategoryLevel = !isSearching && !!subcategory && !product;
	const showProductLevel = !isSearching && !!product;
	const showNodeActions = !isSearching && !!category;
	const hasDetailPanel = showSubcategoryLevel || showProductLevel;

	// Reset pagination when the browsed node changes, so a deep link never
	// opens on a stale page number from a previous node.
	useEffect(() => {
		setVariantsPage(0);
		setIsEditingDesc(false);
	}, [categoryId, subcategoryId, productId]);

	useEffect(() => {
		setSearchPage(0);
	}, [searchQuery]);

	const buildUrl = (params) => {
		const sp = new URLSearchParams();
		if (params.category) sp.set("category", params.category);
		if (params.subcategory) sp.set("subcategory", params.subcategory);
		if (params.product) sp.set("product", params.product);
		const qs = sp.toString();
		return `/catalog${qs ? `?${qs}` : ""}`;
	};

	const goRoot = () => router.push("/catalog");
	const goCategory = (catId) => router.push(buildUrl({ category: catId }));
	const goSubcategory = (catId, subId) => router.push(buildUrl({ category: catId, subcategory: subId }));
	const goProduct = (catId, subId, prodId) =>
		router.push(buildUrl({ category: catId, subcategory: subId, product: prodId }));

	const handleSearchChange = (value) => {
		setSearchQuery(value);
	};

	// Direct children/counts for the currently browsed level. categoryId/subcategoryId
	// are denormalized ancestor pointers on Subcategory/Product too (mirroring the
	// Variant behavior confirmed live against the real DB), so "direct" always means
	// excluding rows that actually belong to a deeper level.
	const subcategoriesOfCategory = useMemo(
		() => (category ? subcategories.filter((s) => s.categoryId === category.id) : []),
		[subcategories, category]
	);
	const directProductsOfCategory = useMemo(
		() => (category ? products.filter((p) => p.categoryId === category.id && !p.subcategoryId) : []),
		[products, category]
	);
	const productsOfSubcategory = useMemo(
		() => (subcategory ? products.filter((p) => p.subcategoryId === subcategory.id) : []),
		[products, subcategory]
	);

	// Variants section - one context at a time (search overrides the hierarchy view).
	const variantsFilter = showProductLevel
		? { productId: product.id }
		: showSubcategoryLevel
		? { subcategoryId: subcategory.id }
		: showCategoryLevel
		? { categoryId: category.id }
		: null;

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

	// Subcategory description lives in a separate Description row (description_id FK);
	// Product's description is inline on the product row already.
	const { data: existingDescription } = useQuery({
		queryKey: ["description", subcategory?.description_id],
		queryFn: async () => {
			const { data } = await api.get(`/description/${subcategory.description_id}`);
			return data;
		},
		enabled: showSubcategoryLevel && Boolean(subcategory?.description_id),
	});

	const descText = showProductLevel ? product?.description ?? "" : showSubcategoryLevel ? existingDescription?.text ?? "" : "";

	const startEditDesc = () => {
		setDescDraft(descText);
		setIsEditingDesc(true);
	};

	const saveDesc = async () => {
		try {
			if (showProductLevel) {
				await updateProduct.mutateAsync({
					id: product.id,
					title: product.title,
					sku: product.sku,
					available: product.available,
					description: descDraft,
					list_items: product.extradata ?? [],
				});
			} else if (showSubcategoryLevel) {
				await updateSubcategory.mutateAsync({
					id: subcategory.id,
					name: subcategory.name,
					available: subcategory.available,
					description_id: subcategory.description_id,
					description: descDraft,
					desc2: { list_items: existingDescription?.list_items ?? [] },
				});
			}
			notifySuccess("Description updated.");
			setIsEditingDesc(false);
		} catch (error) {
			notifyError(error?.response?.data?.message || "Update failed.");
		}
	};

	const detailImages = showProductLevel
		? (product?.product_images ?? []).map((pi) => ({ id: pi.imageId, url: pi.image?.url }))
		: showSubcategoryLevel
		? (subcategory?.subcategory_images ?? []).map((si) => ({ id: si.imageId, url: si.image?.url }))
		: [];
	const imagesTarget = showProductLevel ? "product" : "subcategory";
	const imagesTargetId = showProductLevel ? product?.id : subcategory?.id;

	const currentHierarchy = showProductLevel
		? { type: "product", id: product.id, label: product.title }
		: showSubcategoryLevel
		? { type: "subcategory", id: subcategory.id, label: subcategory.name }
		: showCategoryLevel
		? { type: "category", id: category.id, label: category.name }
		: null;

	// Breadcrumb + edit/delete near it always target the deepest currently browsed node.
	const breadcrumbItems = isSearching
		? [
				{ label: "Catalog", onClick: goRoot },
				{ label: "Search Results", onClick: () => setSearchQuery("") },
		  ]
		: [
				{ label: "Catalog", onClick: goRoot },
				...(category ? [{ label: category.name, onClick: () => goCategory(category.id) }] : []),
				...(subcategory ? [{ label: subcategory.name, onClick: () => goSubcategory(category.id, subcategory.id) }] : []),
				...(product ? [{ label: product.title, onClick: () => {} }] : []),
		  ];

	const openNodeEdit = () => {
		if (product) {
			setEditingProduct(product);
			setProductFormOpen(true);
		} else if (subcategory) {
			setEditingSubcategory(subcategory);
			setSubcategoryFormOpen(true);
		} else if (category) {
			setEditingCategory(category);
			setCategoryFormOpen(true);
		}
	};

	const openNodeDelete = () => {
		if (product) setDeletingProduct(product);
		else if (subcategory) setDeletingSubcategory(subcategory);
		else if (category) setDeletingCategory(category);
	};

	// --- Category handlers ---
	const handleCategorySubmit = async (values) => {
		try {
			if (editingCategory) {
				await updateCategory.mutateAsync({ id: editingCategory.id, name: values.name });
				notifySuccess("Category updated.");
			} else {
				await createCategory.mutateAsync(values);
				notifySuccess("Category created.");
			}
			setCategoryFormOpen(false);
			setEditingCategory(null);
		} catch (error) {
			notifyError(error?.response?.data?.message || "Action failed.");
		}
	};

	const handleCategoryDelete = async () => {
		try {
			await deleteCategory.mutateAsync(deletingCategory.id);
			notifySuccess("Category deleted.");
			const wasCurrent = deletingCategory.id === categoryId;
			setDeletingCategory(null);
			if (wasCurrent) goRoot();
		} catch (error) {
			notifyError(error?.response?.data?.message || "Delete failed.");
		}
	};

	// --- Subcategory handlers ---
	const handleSubcategorySubmit = async (values) => {
		try {
			if (editingSubcategory) {
				await updateSubcategory.mutateAsync({
					id: editingSubcategory.id,
					name: values.name,
					available: values.available,
					description_id: values.description_id,
					description: values.description,
					desc2: { list_items: values.list_items },
					// No `variants` key - the API leaves attached variants untouched.
				});
				notifySuccess("Subcategory updated.");
			} else {
				await createSubcategory.mutateAsync({
					name: values.name,
					categoryId: values.categoryId,
					description: values.description,
					list_items: values.list_items,
					available: values.available,
				});
				notifySuccess("Subcategory created.");
			}
			setSubcategoryFormOpen(false);
			setEditingSubcategory(null);
		} catch (error) {
			notifyError(error?.response?.data?.message || "Action failed.");
		}
	};

	const handleSubcategoryDelete = async () => {
		try {
			await deleteSubcategory.mutateAsync(deletingSubcategory.id);
			notifySuccess("Subcategory deleted.");
			const wasCurrent = deletingSubcategory.id === subcategoryId;
			setDeletingSubcategory(null);
			if (wasCurrent) goCategory(deletingSubcategory.categoryId);
		} catch (error) {
			notifyError(error?.response?.data?.message || "Delete failed.");
		}
	};

	// --- Product handlers ---
	const handleProductSubmit = async (values) => {
		try {
			if (editingProduct) {
				// No `variants` key - the API leaves attached variants untouched.
				await updateProduct.mutateAsync({ id: editingProduct.id, ...values });
				notifySuccess("Product updated.");
			} else {
				await createProduct.mutateAsync(values);
				notifySuccess("Product created.");
			}
			setProductFormOpen(false);
			setEditingProduct(null);
		} catch (error) {
			notifyError(error?.response?.data?.message || "Action failed.");
		}
	};

	const handleProductDelete = async () => {
		try {
			await deleteProduct.mutateAsync(deletingProduct.id);
			notifySuccess("Product deleted.");
			const wasCurrent = deletingProduct.id === productId;
			setDeletingProduct(null);
			if (wasCurrent) {
				if (deletingProduct.subcategoryId) goSubcategory(deletingProduct.categoryId, deletingProduct.subcategoryId);
				else goCategory(deletingProduct.categoryId);
			}
		} catch (error) {
			notifyError(error?.response?.data?.message || "Delete failed.");
		}
	};

	// --- Variant handlers ---
	const handleVariantUpdate = async (values) => {
		try {
			await updateVariant.mutateAsync(values);
			notifySuccess("Variant updated.");
			setEditingVariant(null);
		} catch (error) {
			notifyError(error?.response?.data?.message || "Update failed.");
		}
	};

	const handleVariantDelete = async () => {
		try {
			await deleteVariant.mutateAsync(deletingVariant.id);
			notifySuccess("Variant deleted.");
			setDeletingVariant(null);
		} catch (error) {
			notifyError(error?.response?.data?.message || "Delete failed.");
		}
	};

	const handleExcelUpload = async (payload) => {
		try {
			await uploadExcel.mutateAsync(payload);
			notifySuccess("Excel uploaded.");
			setExcelUploadOpen(false);
		} catch (error) {
			notifyError(error?.response?.data?.message || "Upload failed.");
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
					{showNodeActions && (
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
						placeholder="Search by variant name or SKU..."
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

			{hasDetailPanel && (
				<div className="mb-6 bg-white p-5 shadow-custom">
					<div className="mb-5">
						<div className="mb-2 flex items-center justify-between">
							<span className="text-xs font-semibold uppercase tracking-wide text-text-light">Description</span>
							{!isEditingDesc && (
								<button
									type="button"
									onClick={startEditDesc}
									className="flex items-center gap-1 text-xs font-medium text-text-light hover:text-custom-blue"
								>
									<Pencil size={13} /> Edit
								</button>
							)}
						</div>
						{isEditingDesc ? (
							<div>
								<textarea
									value={descDraft}
									onChange={(e) => setDescDraft(e.target.value)}
									rows={3}
									placeholder="Write a description..."
									className={textareaClass}
								/>
								<div className="mt-2 flex gap-2">
									<Button onClick={saveDesc} isLoading={updateProduct.isPending || updateSubcategory.isPending}>
										Save
									</Button>
									<Button variant="secondary" onClick={() => setIsEditingDesc(false)}>
										Cancel
									</Button>
								</div>
							</div>
						) : descText ? (
							<p className="whitespace-pre-line text-sm text-text-dark">{descText}</p>
						) : (
							<p className="text-sm italic text-text-light">No description yet.</p>
						)}
					</div>

					<div>
						<span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-text-light">Images</span>
						<div className="flex flex-wrap gap-3">
							{detailImages.map((img) => (
								<div key={img.id} className="relative h-20 w-20 overflow-hidden border border-border-gray bg-button-gray">
									{img.url && <NextImage src={`${CDN_URL}/${img.url}`} alt="" fill sizes="80px" className="object-cover" />}
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

			{showRoot && (
				<CategoriesSection
					categories={categories}
					subcategories={subcategories}
					products={products}
					isLoading={categoriesLoading}
					onSelect={(row) => goCategory(row.id)}
					onAdd={() => {
						setEditingCategory(null);
						setCategoryFormOpen(true);
					}}
					onEdit={(row) => {
						setEditingCategory(row);
						setCategoryFormOpen(true);
					}}
					onDelete={setDeletingCategory}
				/>
			)}

			{showCategoryLevel && (
				<>
					<SubcategoriesSection
						subcategories={subcategoriesOfCategory}
						isLoading={subcategoriesLoading}
						onSelect={(row) => goSubcategory(category.id, row.id)}
						onAdd={() => {
							setEditingSubcategory(null);
							setSubcategoryFormOpen(true);
						}}
						onEdit={(row) => {
							setEditingSubcategory(row);
							setSubcategoryFormOpen(true);
						}}
						onDelete={setDeletingSubcategory}
					/>
					<ProductsSection
						products={directProductsOfCategory}
						isLoading={productsLoading}
						onSelect={(row) => goProduct(category.id, null, row.id)}
						onAdd={() => {
							setEditingProduct(null);
							setProductFormOpen(true);
						}}
						onEdit={(row) => {
							setEditingProduct(row);
							setProductFormOpen(true);
						}}
						onDelete={setDeletingProduct}
					/>
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
				</>
			)}

			{showSubcategoryLevel && (
				<>
					<ProductsSection
						products={productsOfSubcategory}
						isLoading={productsLoading}
						onSelect={(row) => goProduct(category.id, subcategory.id, row.id)}
						onAdd={() => {
							setEditingProduct(null);
							setProductFormOpen(true);
						}}
						onEdit={(row) => {
							setEditingProduct(row);
							setProductFormOpen(true);
						}}
						onDelete={setDeletingProduct}
					/>
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
				</>
			)}

			{showProductLevel && (
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

			<CategoryFormModal
				open={categoryFormOpen}
				onClose={() => setCategoryFormOpen(false)}
				initialValues={editingCategory}
				onSubmit={handleCategorySubmit}
				isLoading={createCategory.isPending || updateCategory.isPending}
			/>

			<SubcategoryFormModal
				open={subcategoryFormOpen}
				onClose={() => setSubcategoryFormOpen(false)}
				categories={categories}
				initialValues={editingSubcategory}
				defaultCategoryId={category?.id}
				onSubmit={handleSubcategorySubmit}
				isLoading={createSubcategory.isPending || updateSubcategory.isPending}
			/>

			<ProductFormModal
				open={productFormOpen}
				onClose={() => setProductFormOpen(false)}
				categories={categories}
				subcategories={subcategories}
				initialValues={editingProduct}
				defaultCategoryId={category?.id}
				defaultSubcategoryId={subcategory?.id}
				onSubmit={handleProductSubmit}
				isLoading={createProduct.isPending || updateProduct.isPending}
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
				categories={categories}
				subcategories={subcategories}
				products={products}
				initialHierarchy={currentHierarchy}
				onSubmit={handleExcelUpload}
				isLoading={uploadExcel.isPending}
			/>

			<NodeImagesModal
				open={imagesModalOpen}
				onClose={() => setImagesModalOpen(false)}
				target={imagesTarget}
				targetId={imagesTargetId}
				currentImages={detailImages}
			/>

			<ConfirmDialog
				open={Boolean(deletingCategory)}
				onClose={() => setDeletingCategory(null)}
				onConfirm={handleCategoryDelete}
				title="Delete category"
				description={`Delete "${deletingCategory?.name}"? This also removes everything nested under it.`}
				isLoading={deleteCategory.isPending}
			/>

			<ConfirmDialog
				open={Boolean(deletingSubcategory)}
				onClose={() => setDeletingSubcategory(null)}
				onConfirm={handleSubcategoryDelete}
				title="Delete subcategory"
				description={`Delete "${deletingSubcategory?.name}"? This also removes everything nested under it.`}
				isLoading={deleteSubcategory.isPending}
			/>

			<ConfirmDialog
				open={Boolean(deletingProduct)}
				onClose={() => setDeletingProduct(null)}
				onConfirm={handleProductDelete}
				title="Delete product"
				description={`Delete "${deletingProduct?.title}"? This also removes its variants.`}
				isLoading={deleteProduct.isPending}
			/>

			<ConfirmDialog
				open={Boolean(deletingVariant)}
				onClose={() => setDeletingVariant(null)}
				onConfirm={handleVariantDelete}
				title="Delete variant"
				description={`Delete "${deletingVariant?.title}"?`}
				isLoading={deleteVariant.isPending}
			/>
		</div>
	);
}

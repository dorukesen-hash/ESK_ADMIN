"use client";

import { useState } from "react";
import { Download, Upload } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { useExportVariants, useBulkImportVariants } from "@/hooks/catalog/useVariants";
import { notifySuccess, notifyError } from "@/lib/toast";

// One round-trip Excel format: rows with an ID update that variant (only
// cells that actually differ from the current value are written - a blank
// cell means "leave unchanged", not "clear it"); rows without an ID create a
// new variant, resolving Category/Subcategory/Product by name.
export default function MassEditModal({ open, onClose }) {
	const [file, setFile] = useState(null);
	const [result, setResult] = useState(null);
	const exportVariants = useExportVariants();
	const bulkImport = useBulkImportVariants();

	const handleDownload = async () => {
		try {
			const blob = await exportVariants.mutateAsync();
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `variants-${new Date().toISOString().slice(0, 10)}.xlsx`;
			document.body.appendChild(a);
			a.click();
			a.remove();
			URL.revokeObjectURL(url);
		} catch (error) {
			notifyError("Could not download the catalog.");
		}
	};

	const handleUpload = async (e) => {
		e.preventDefault();
		if (!file) return;
		try {
			const response = await bulkImport.mutateAsync(file);
			const summary = response.data;
			setResult(summary);
			if (summary.failed.length === 0) {
				notifySuccess(`${summary.created} created, ${summary.updated} updated.`);
			} else {
				notifyError(`${summary.failed.length} row(s) failed - see details below.`);
			}
			setFile(null);
		} catch (error) {
			notifyError(error?.response?.data?.message || "Import failed.");
		}
	};

	const handleClose = () => {
		setResult(null);
		setFile(null);
		onClose();
	};

	return (
		<Modal open={open} onClose={handleClose} title="Mass Edit" maxWidth="max-w-lg">
			<div className="space-y-6">
				<div>
					<p className="mb-3 text-sm text-text-dark">
						Download the full catalog as Excel, edit it, then upload it back. Rows with an ID
						update that variant (only changed cells are written); rows without one create a new
						variant (needs a Category, Subcategory, or Product name).
					</p>
					<Button variant="secondary" onClick={handleDownload} isLoading={exportVariants.isPending}>
						<span className="flex items-center gap-1">
							<Download size={16} /> Download current catalog
						</span>
					</Button>
				</div>

				<form onSubmit={handleUpload} className="border-t border-border-gray pt-4">
					<label className="mb-2 block text-sm font-medium text-text-dark">Upload edited Excel</label>
					<input
						type="file"
						accept=".xlsx,.xls"
						onChange={(e) => setFile(e.target.files?.[0] ?? null)}
						className="mb-3 w-full text-sm text-text-dark"
					/>
					<Button type="submit" isLoading={bulkImport.isPending} disabled={!file}>
						<span className="flex items-center gap-1">
							<Upload size={16} /> Upload
						</span>
					</Button>
				</form>

				{result && (
					<div className="border-t border-border-gray pt-4">
						<p className="mb-2 text-sm font-medium text-text-dark">
							{result.created} created, {result.updated} updated, {result.failed.length} failed.
						</p>
						{result.failed.length > 0 && (
							<div className="max-h-48 overflow-y-auto border border-border-gray">
								<table className="w-full text-xs">
									<thead className="bg-custom-table-head">
										<tr>
											<th className="px-2 py-1 text-left">Row</th>
											<th className="px-2 py-1 text-left">Stock #</th>
											<th className="px-2 py-1 text-left">Reason</th>
										</tr>
									</thead>
									<tbody>
										{result.failed.map((f, i) => (
											<tr key={i} className="border-t border-border-gray">
												<td className="px-2 py-1 align-top">{f.row}</td>
												<td className="px-2 py-1 align-top">{f.stock}</td>
												<td className="px-2 py-1 align-top">{f.reason}</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</div>
				)}
			</div>
		</Modal>
	);
}

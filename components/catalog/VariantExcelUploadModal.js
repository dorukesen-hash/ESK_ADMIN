"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import CatalogNodePicker from "./CatalogNodePicker";

// initialNode: { id, label } - when set (opened from within a node's own
// page), the target is pre-filled and locked instead of requiring the
// manual picker below.
export default function VariantExcelUploadModal({ open, onClose, tree, initialNode, onSubmit, isLoading }) {
	const [nodeId, setNodeId] = useState("");
	const [file, setFile] = useState(null);

	const locked = Boolean(initialNode);

	useEffect(() => {
		if (!open) return;
		setNodeId(initialNode ? String(initialNode.id) : "");
		setFile(null);
	}, [open, initialNode]);

	const handleSubmit = (e) => {
		e.preventDefault();
		if (!file || !nodeId) return;
		onSubmit({ file, hierarchyType: "node", hierarchyId: nodeId });
	};

	return (
		<Modal open={open} onClose={onClose} title="Excel ile Varyant Yükle">
			<form onSubmit={handleSubmit} className="space-y-4">
				{locked ? (
					<FormField label="Hedef">
						<div className="border border-border-gray bg-button-gray px-3 py-2 text-sm text-text-dark">
							{initialNode.label}
						</div>
					</FormField>
				) : (
					<FormField label="Hedef Node">
						<CatalogNodePicker tree={tree} value={nodeId} onChange={setNodeId} />
					</FormField>
				)}

				<FormField label="Excel Dosyası (.xlsx)">
					<input
						type="file"
						accept=".xlsx,.xls"
						onChange={(e) => setFile(e.target.files?.[0] ?? null)}
						className="w-full text-sm text-text-dark"
					/>
				</FormField>

				<div className="flex justify-end gap-2 pt-2">
					<Button type="button" variant="secondary" onClick={onClose}>
						Vazgeç
					</Button>
					<Button type="submit" isLoading={isLoading} disabled={!file || !nodeId}>
						Yükle
					</Button>
				</div>
			</form>
		</Modal>
	);
}

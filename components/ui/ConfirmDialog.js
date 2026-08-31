"use client";

import Modal from "./Modal";
import Button from "./Button";

export default function ConfirmDialog({
	open,
	onClose,
	onConfirm,
	title = "Emin misiniz?",
	description,
	isLoading = false,
	confirmLabel = "Sil",
	confirmVariant = "danger",
}) {
	return (
		<Modal open={open} onClose={onClose} title={title} maxWidth="max-w-sm">
			{description && <p className="text-sm text-text-light">{description}</p>}
			<div className="mt-6 flex justify-end gap-2">
				<Button variant="secondary" onClick={onClose} disabled={isLoading}>
					Vazgeç
				</Button>
				<Button variant={confirmVariant} onClick={onConfirm} isLoading={isLoading}>
					{confirmLabel}
				</Button>
			</div>
		</Modal>
	);
}

"use client";

import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { useMarkClaimRead } from "@/hooks/customers/useClaims";
import { notifySuccess, notifyError } from "@/lib/toast";

export default function ClaimDetailModal({ claim, onClose }) {
	const markRead = useMarkClaimRead();

	if (!claim) return null;

	const handleMarkRead = async () => {
		try {
			await markRead.mutateAsync(claim.id);
			notifySuccess("Okundu olarak işaretlendi.");
		} catch (error) {
			notifyError(error?.response?.data?.message || "İşlem başarısız.");
		}
	};

	return (
		<Modal open={Boolean(claim)} onClose={onClose} title="Talep Detayı">
			<div className="space-y-3 text-sm">
				<div>
					<p className="text-text-light">İletişim</p>
					<p className="text-text-dark">
						{claim.contactName} — {claim.email}
					</p>
				</div>
				<div>
					<p className="text-text-light">Firma</p>
					<p className="text-text-dark">{claim.companyName || "-"}</p>
				</div>
				<div>
					<p className="text-text-light">Sipariş No</p>
					<p className="text-text-dark">{claim.orderNo || "-"}</p>
				</div>
				<div>
					<p className="text-text-light">Açıklama</p>
					<p className="whitespace-pre-wrap text-text-dark">{claim.description || "-"}</p>
				</div>
				<div>
					<p className="text-text-light">Gönderen Kullanıcı</p>
					<p className="text-text-dark">
						{claim.user?.name} {claim.user?.email ? `(${claim.user.email})` : ""}
					</p>
				</div>
			</div>

			<div className="mt-6 flex justify-end gap-2">
				<Button type="button" variant="secondary" onClick={onClose}>
					Kapat
				</Button>
				{!claim.read && (
					<Button onClick={handleMarkRead} isLoading={markRead.isPending}>
						Okundu İşaretle
					</Button>
				)}
			</div>
		</Modal>
	);
}

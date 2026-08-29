"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2, X, Check } from "lucide-react";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { inputClass } from "@/components/ui/FormField";
import {
	useCustomerShippingProfiles,
	useUpdateShippingProfile,
	useDeleteShippingProfile,
} from "@/hooks/customers/useShippingProfiles";
import { notifySuccess, notifyError } from "@/lib/toast";

const FIELDS = [
	{ name: "title", label: "Başlık" },
	{ name: "firstline", label: "Adres Satırı 1" },
	{ name: "secondline", label: "Adres Satırı 2" },
	{ name: "city", label: "Şehir" },
	{ name: "state", label: "Eyalet" },
	{ name: "zip", label: "Posta Kodu" },
	{ name: "phone", label: "Telefon" },
];

function ProfileRow({ profile, userId }) {
	const [editing, setEditing] = useState(false);
	const [form, setForm] = useState({});
	const [deleting, setDeleting] = useState(false);
	const updateProfile = useUpdateShippingProfile();
	const deleteProfile = useDeleteShippingProfile();

	useEffect(() => {
		if (editing) {
			const initial = {};
			FIELDS.forEach((f) => (initial[f.name] = profile[f.name] ?? ""));
			setForm(initial);
		}
	}, [editing, profile]);

	const handleSave = async () => {
		try {
			await updateProfile.mutateAsync({ id: profile.id, userId, ...form });
			notifySuccess("Adres güncellendi.");
			setEditing(false);
		} catch (error) {
			notifyError(error?.response?.data?.message || "Güncellenemedi.");
		}
	};

	const handleDelete = async () => {
		try {
			await deleteProfile.mutateAsync({ id: profile.id, userId });
			notifySuccess("Adres silindi.");
			setDeleting(false);
		} catch (error) {
			notifyError(error?.response?.data?.message || "Silme başarısız.");
		}
	};

	if (editing) {
		return (
			<div className="space-y-2 border-b border-border-gray py-3">
				<div className="grid grid-cols-2 gap-2">
					{FIELDS.map((f) => (
						<input
							key={f.name}
							value={form[f.name] ?? ""}
							onChange={(e) => setForm((prev) => ({ ...prev, [f.name]: e.target.value }))}
							placeholder={f.label}
							className={`${inputClass} text-xs`}
						/>
					))}
				</div>
				<div className="flex justify-end gap-3">
					<button type="button" onClick={() => setEditing(false)} className="text-text-light hover:text-text-dark">
						<X size={16} />
					</button>
					<button
						type="button"
						onClick={handleSave}
						disabled={updateProfile.isPending}
						className="text-text-light hover:text-custom-blue"
					>
						<Check size={16} />
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="flex items-start justify-between gap-4 border-b border-border-gray py-3 text-sm">
			<div>
				<p className="font-medium text-text-dark">{profile.title || "-"}</p>
				<p className="text-text-light">
					{profile.firstline} {profile.secondline}
				</p>
				<p className="text-text-light">
					{profile.city}, {profile.state} {profile.zip}
				</p>
				{profile.phone && <p className="text-text-light">{profile.phone}</p>}
			</div>
			<div className="flex shrink-0 gap-3">
				<button type="button" onClick={() => setEditing(true)} className="text-text-light hover:text-custom-blue">
					<Pencil size={16} />
				</button>
				<button type="button" onClick={() => setDeleting(true)} className="text-text-light hover:text-red-600">
					<Trash2 size={16} />
				</button>
			</div>

			<ConfirmDialog
				open={deleting}
				onClose={() => setDeleting(false)}
				onConfirm={handleDelete}
				title="Adresi sil"
				description="Bu adresi silmek istediğinize emin misiniz?"
				isLoading={deleteProfile.isPending}
			/>
		</div>
	);
}

export default function CustomerShippingProfilesModal({ customer, onClose }) {
	const userId = customer?.userId;
	const { data: profiles = [], isLoading } = useCustomerShippingProfiles(userId);

	return (
		<Modal open={Boolean(customer)} onClose={onClose} title={customer ? `${customer.name} - Adresler` : "Adresler"}>
			{isLoading ? (
				<p className="text-sm text-text-light">Yükleniyor...</p>
			) : profiles.length === 0 ? (
				<p className="text-sm text-text-light">Kayıtlı adres bulunamadı.</p>
			) : (
				<div>
					{profiles.map((profile) => (
						<ProfileRow key={profile.id} profile={profile} userId={userId} />
					))}
				</div>
			)}
		</Modal>
	);
}

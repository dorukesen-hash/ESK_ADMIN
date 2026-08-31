"use client";

import { useEffect, useState } from "react";
import { Send } from "lucide-react";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import FormField, { inputClass, checkboxClass } from "@/components/ui/FormField";
import { useUpdateUserAccount, useSendPasswordReset } from "@/hooks/customers/useCustomerDetail";
import { notifySuccess, notifyError } from "@/lib/toast";

const FIELDS = [
	{ name: "name", label: "İsim" },
	{ name: "surname", label: "Soyisim" },
	{ name: "email", label: "E-posta" },
	{ name: "phone", label: "Telefon" },
];

export default function AccountSection({ customerId, user }) {
	const [form, setForm] = useState({});
	const [confirmingGrant, setConfirmingGrant] = useState(false);
	const updateAccount = useUpdateUserAccount(customerId);
	const sendReset = useSendPasswordReset();

	const initialIsAdmin = user?.isAdmin === "admin";

	useEffect(() => {
		if (user) {
			setForm({
				name: user.name ?? "",
				surname: user.surname ?? "",
				email: user.email ?? "",
				phone: user.phone ?? "",
				isActive: Boolean(user.isActive),
				isAdmin: user.isAdmin === "admin",
				discountPercent: user.discountPercent ?? "",
			});
		}
	}, [user]);

	if (!user) return null;

	const doSave = async () => {
		try {
			await updateAccount.mutateAsync({
				userId: user.id,
				name: form.name,
				surname: form.surname,
				email: form.email,
				phone: form.phone,
				isActive: form.isActive,
				isAdmin: form.isAdmin,
				discountPercent: form.discountPercent === "" ? null : parseFloat(form.discountPercent),
			});
			notifySuccess("Hesap güncellendi.");
			setConfirmingGrant(false);
		} catch (error) {
			notifyError(error?.response?.data?.message || "Güncellenemedi.");
		}
	};

	// Revoking admin (or leaving it unchanged) saves directly - only newly
	// GRANTING it pauses for an explicit confirmation, since it's the
	// higher-consequence direction.
	const handleSave = () => {
		if (form.isAdmin && !initialIsAdmin) {
			setConfirmingGrant(true);
			return;
		}
		doSave();
	};

	const handleSendReset = async () => {
		try {
			await sendReset.mutateAsync(user.id);
			notifySuccess("Şifre sıfırlama linki gönderildi.");
		} catch (error) {
			notifyError(error?.response?.data?.message || "Gönderilemedi.");
		}
	};

	return (
		<div>
			<h3 className="mb-2 font-medium text-text-dark">Hesap</h3>
			<div className="grid grid-cols-2 gap-3">
				{FIELDS.map((f) => (
					<FormField key={f.name} label={f.label}>
						<input
							value={form[f.name] ?? ""}
							onChange={(e) => setForm((prev) => ({ ...prev, [f.name]: e.target.value }))}
							className={inputClass}
						/>
					</FormField>
				))}
				<FormField label="Genel İndirim (%)">
					<input
						type="number"
						step="0.01"
						min="0"
						max="100"
						value={form.discountPercent ?? ""}
						onChange={(e) => setForm((prev) => ({ ...prev, discountPercent: e.target.value }))}
						className={inputClass}
					/>
				</FormField>
				<label className="mt-6 flex items-center gap-2 text-sm text-text-dark">
					<input
						type="checkbox"
						checked={Boolean(form.isActive)}
						onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
						className={checkboxClass}
					/>
					Hesap aktif
				</label>
				<label className="mt-6 flex items-center gap-2 text-sm text-text-dark">
					<input
						type="checkbox"
						checked={Boolean(form.isAdmin)}
						onChange={(e) => setForm((prev) => ({ ...prev, isAdmin: e.target.checked }))}
						className={checkboxClass}
					/>
					Yönetici (Admin) yetkisi
				</label>
			</div>

			<div className="mt-4 flex items-center justify-between">
				<Button type="button" variant="secondary" onClick={handleSendReset} isLoading={sendReset.isPending}>
					<span className="flex items-center gap-1">
						<Send size={16} /> Şifre Sıfırlama Linki Gönder
					</span>
				</Button>
				<Button type="button" onClick={handleSave} isLoading={updateAccount.isPending}>
					Kaydet
				</Button>
			</div>

			<ConfirmDialog
				open={confirmingGrant}
				onClose={() => setConfirmingGrant(false)}
				onConfirm={doSave}
				title="Yönetici yetkisi ver"
				description="Bu kullanıcıya tam yönetici (admin) yetkisi vermek üzeresiniz. Bu, panele tam erişim anlamına gelir. Devam etmek istediğinize emin misiniz?"
				confirmLabel="Yetki Ver"
				confirmVariant="primary"
				isLoading={updateAccount.isPending}
			/>
		</div>
	);
}

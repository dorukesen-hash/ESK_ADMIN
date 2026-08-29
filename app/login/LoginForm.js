"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const schema = yup.object({
	email: yup.string().email("Geçerli bir e-posta girin").required("E-posta zorunlu"),
	password: yup.string().required("Şifre zorunlu"),
});

export default function LoginForm() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [serverError, setServerError] = useState("");
	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm({ resolver: yupResolver(schema) });

	// Already logged in (e.g. navigated back to /login manually) - bounce to the dashboard.
	const { data: currentUser } = useCurrentUser();
	useEffect(() => {
		if (currentUser?.isAdmin === "admin") {
			router.replace("/");
		}
	}, [currentUser, router]);

	const onSubmit = async (values) => {
		setServerError("");
		try {
			const { data } = await api.post("/auth/login", values);
			if (data?.data?.isAdmin !== "admin") {
				setServerError("Bu hesabın admin paneline erişim yetkisi yok.");
				return;
			}
			// Clear the (likely cached-as-unauthenticated) currentUser query so
			// AuthGuard on the dashboard doesn't briefly bounce back to /login
			// on a stale cached result.
			await queryClient.resetQueries({ queryKey: ["currentUser"] });
			router.push("/");
		} catch (error) {
			setServerError(error?.response?.data?.message || "Giriş başarısız.");
		}
	};

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			className="w-full max-w-sm bg-white p-8 shadow-custom"
		>
			<h1 className="font-montserrat text-2xl font-semibold text-text-dark">ESK Admin</h1>
			<p className="mt-1 text-sm text-text-light">Yönetici girişi</p>

			<div className="mt-6">
				<label className="block text-sm font-medium text-text-dark">E-posta</label>
				<input
					type="email"
					{...register("email")}
					className="mt-1 w-full border border-border-gray px-3 py-2 text-text-dark focus:border-custom-blue focus:outline-none"
				/>
				{errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
			</div>

			<div className="mt-4">
				<label className="block text-sm font-medium text-text-dark">Şifre</label>
				<input
					type="password"
					{...register("password")}
					className="mt-1 w-full border border-border-gray px-3 py-2 text-text-dark focus:border-custom-blue focus:outline-none"
				/>
				{errors.password && (
					<p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
				)}
			</div>

			{serverError && <p className="mt-4 text-sm text-red-600">{serverError}</p>}

			<button
				type="submit"
				disabled={isSubmitting}
				className="mt-6 w-full bg-custom-blue py-2 font-medium text-white transition hover:bg-custom-button-green disabled:opacity-50"
			>
				{isSubmitting ? "Giriş yapılıyor..." : "Giriş Yap"}
			</button>
		</form>
	);
}

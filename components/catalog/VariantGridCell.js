"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2 } from "lucide-react";

const DEBOUNCE_MS = 700;

// Autosave, no Save button: text/number debounce after typing stops (and
// flush immediately on blur), boolean saves the instant it's toggled. Each
// cell owns its own draft/status state so typing in one cell never re-renders
// the other ~thousands of cells in the grid.
export default function VariantGridCell({ value, type, decimal, onSave }) {
	const [draft, setDraft] = useState(value ?? (type === "boolean" ? false : ""));
	const [status, setStatus] = useState("idle"); // idle | saving | saved | error
	const timerRef = useRef(null);
	const lastSavedRef = useRef(value);
	const savedResetRef = useRef(null);

	useEffect(() => {
		setDraft(value ?? (type === "boolean" ? false : ""));
		lastSavedRef.current = value;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [value]);

	useEffect(
		() => () => {
			if (timerRef.current) clearTimeout(timerRef.current);
			if (savedResetRef.current) clearTimeout(savedResetRef.current);
		},
		[]
	);

	const commit = async (rawValue) => {
		let nextValue = rawValue;
		if (type === "number") {
			nextValue = rawValue === "" || rawValue === null || rawValue === undefined ? null : Number(rawValue);
			if (nextValue !== null && Number.isNaN(nextValue)) return;
			if (nextValue !== null && !decimal) nextValue = Math.round(nextValue);
		}
		if (nextValue === (lastSavedRef.current ?? (type === "boolean" ? false : ""))) return;

		setStatus("saving");
		try {
			await onSave(nextValue);
			lastSavedRef.current = nextValue;
			setStatus("saved");
			savedResetRef.current = setTimeout(() => setStatus((s) => (s === "saved" ? "idle" : s)), 1200);
		} catch (error) {
			setStatus("error");
		}
	};

	const scheduleCommit = (nextValue) => {
		if (timerRef.current) clearTimeout(timerRef.current);
		timerRef.current = setTimeout(() => commit(nextValue), DEBOUNCE_MS);
	};

	if (type === "readonly") {
		return <span className="block truncate px-2 py-1.5 text-text-light">{value ?? "-"}</span>;
	}

	if (type === "boolean") {
		return (
			<div className="flex items-center justify-center gap-1.5 px-2 py-1">
				<input
					type="checkbox"
					checked={Boolean(draft)}
					onChange={(e) => {
						const next = e.target.checked;
						setDraft(next);
						commit(next);
					}}
					className="h-4 w-4 border-border-gray text-custom-blue focus:ring-custom-blue"
				/>
				<StatusIcon status={status} />
			</div>
		);
	}

	return (
		<div className="relative flex items-center">
			<input
				type={type === "number" ? "number" : "text"}
				value={draft ?? ""}
				onChange={(e) => {
					const next = e.target.value;
					setDraft(next);
					scheduleCommit(next);
				}}
				onBlur={() => {
					if (timerRef.current) clearTimeout(timerRef.current);
					commit(draft);
				}}
				className="w-full min-w-[110px] border-0 bg-transparent px-2 py-1.5 pr-6 text-sm text-text-dark focus:bg-custom-table-soft-blue focus:outline-none"
			/>
			<span className="pointer-events-none absolute right-1.5">
				<StatusIcon status={status} />
			</span>
		</div>
	);
}

function StatusIcon({ status }) {
	if (status === "saving") return <Loader2 size={12} className="animate-spin text-text-light" />;
	if (status === "saved") return <Check size={12} className="text-green-600" />;
	if (status === "error") return <span className="text-[10px] font-semibold text-red-600">!</span>;
	return null;
}

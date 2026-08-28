export const inputClass =
	"w-full border border-border-gray px-3 py-2 text-sm text-text-dark focus:border-custom-blue focus:outline-none";
export const selectClass = inputClass;
export const textareaClass = `${inputClass} resize-none`;
export const checkboxClass = "h-4 w-4 border-border-gray text-custom-blue focus:ring-custom-blue";

export default function FormField({ label, error, children }) {
	return (
		<div>
			{label && <label className="block text-sm font-medium text-text-dark">{label}</label>}
			<div className="mt-1">{children}</div>
			{error && <p className="mt-1 text-sm text-red-600">{error.message}</p>}
		</div>
	);
}

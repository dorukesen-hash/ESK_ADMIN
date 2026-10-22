"use client";

import { flattenTreeForPicker } from "@/lib/catalogNodeTree";
import { selectClass } from "@/components/ui/FormField";

// A flattened, indented <select> instead of a collapsible tree widget - the
// real catalog is ~50 nodes total (see the ESK_API backfill's own dry-run
// counts), which fits comfortably in one dropdown without needing to
// expand/collapse anything.
export default function CatalogNodePicker({
	tree,
	value,
	onChange,
	excludeIds = [],
	includeRootOption = false,
	placeholder = "Seçiniz",
}) {
	const options = flattenTreeForPicker(tree, { excludeIds });

	return (
		<select value={value} onChange={(e) => onChange(e.target.value)} className={selectClass}>
			<option value="">{placeholder}</option>
			{includeRootOption && <option value="__root__">— Üst seviye (kök) —</option>}
			{options.map((opt) => (
				<option key={opt.id} value={opt.id}>
					{"— ".repeat(opt.depth)}
					{opt.name}
				</option>
			))}
		</select>
	);
}

// Every editable Variant column (db/models/variant.js), grouped for the column
// picker. Types drive both the cell editor and the header filter: "text" is a
// plain input, "number" is a numeric input, "boolean" is a select (Yes/No/All
// for filtering), "readonly" never gets an editor (system/derived columns).
//
// Most "number" columns are Postgres INTEGER - a non-integer value crashes
// the PUT with a raw "invalid input syntax for type integer" error, so the
// grid cell rounds before saving unless `decimal: true`. The Sequelize model
// (db/models/variant.js in ESK_API) declares most price/pack/pallet fields
// INTEGER, but the REAL production schema disagrees for several - confirmed
// live via information_schema.columns, not assumed: one_four_units,
// five_nine_units, ten_plus_units, pallet_pricing, pack_weight/width/length/
// height, and pallet_weight/width/length/height are all real NUMERIC(10,2)
// columns. Rounding these would silently truncate real cents-precision data -
// same class of model/DB drift already documented for the Claim model's
// timestamp columns; mirrored in ESK_API's controller/variantExcelColumns.js.
export const VARIANT_FIELD_GROUPS = [
	{
		id: "basic",
		label: "Basic",
		fields: [
			{ key: "title", label: "Title", type: "text" },
			{ key: "stock", label: "SKU", type: "text" },
			{ key: "status", label: "Status", type: "text" },
			{ key: "available", label: "Available", type: "boolean" },
			{ key: "description", label: "Description", type: "text" },
			{ key: "unit", label: "Unit", type: "text" },
			{ key: "featured", label: "Featured", type: "boolean" },
			{ key: "featured_position", label: "Featured Position", type: "number" },
		],
	},
	{
		id: "pricing",
		label: "Pricing",
		fields: [
			{ key: "one_four_units", label: "1-4 Units", type: "number", decimal: true },
			{ key: "five_nine_units", label: "5-9 Units", type: "number", decimal: true },
			{ key: "ten_plus_units", label: "10+ Units", type: "number", decimal: true },
			{ key: "pallet_pricing", label: "Pallet Price", type: "number", decimal: true },
			{ key: "distributor_pallet_FOB", label: "Distributor Pallet FOB", type: "number", decimal: true },
			{ key: "end_user_pallet", label: "End User Pallet", type: "number" },
		],
	},
	{
		id: "bullets",
		label: "Marketing Bullets",
		fields: [
			{ key: "bullet_1", label: "Bullet 1", type: "text" },
			{ key: "bullet_2", label: "Bullet 2", type: "text" },
			{ key: "bullet_3", label: "Bullet 3", type: "text" },
			{ key: "bullet_4", label: "Bullet 4", type: "text" },
			{ key: "bullet_5", label: "Bullet 5", type: "text" },
			{ key: "bullet_6", label: "Bullet 6", type: "text" },
		],
	},
	{
		id: "item",
		label: "Item",
		fields: [
			{ key: "size", label: "Size", type: "text" },
			{ key: "style", label: "Style", type: "text" },
			{ key: "color", label: "Color", type: "text" },
			{ key: "material_type", label: "Material Type", type: "text" },
			{ key: "thickness", label: "Thickness", type: "text" },
			{ key: "item_thickness", label: "Item Thickness", type: "text" },
			{ key: "product_finish", label: "Product Finish", type: "text" },
			{ key: "product_grade", label: "Product Grade", type: "text" },
			{ key: "outside_w_l", label: "Outside W/L", type: "text" },
			{ key: "usable_w_l", label: "Usable W/L", type: "text" },
			{ key: "inside_dimensions", label: "Inside Dimensions", type: "text" },
			{ key: "item_gross_weight", label: "Item Gross Weight", type: "number" },
			{ key: "item_gross_weight_unit_of_measure", label: "Gross Weight UOM", type: "text" },
			{ key: "item_net_weight", label: "Item Net Weight", type: "number" },
			{ key: "item_net_weight_unit_of_measure", label: "Net Weight UOM", type: "text" },
			{ key: "item_width_unit_of_measure", label: "Width UOM", type: "text" },
			{ key: "item_length_unit_of_measure", label: "Length UOM", type: "text" },
			{ key: "item_height_unit_of_measure", label: "Height UOM", type: "text" },
		],
	},
	{
		id: "packaging",
		label: "Packaging",
		fields: [
			{ key: "pack_weight", label: "Pack Weight", type: "number", decimal: true },
			{ key: "pack_width", label: "Pack Width", type: "number", decimal: true },
			{ key: "pack_length", label: "Pack Length", type: "number", decimal: true },
			{ key: "pack_height", label: "Pack Height", type: "number", decimal: true },
			{ key: "quantity_case", label: "Qty per Case", type: "number" },
			{ key: "package_weight_unit_of_measure", label: "Pack Weight UOM", type: "text" },
			{ key: "package_height_unit_of_measure", label: "Pack Height UOM", type: "text" },
			{ key: "package_width_unit_of_measure", label: "Pack Width UOM", type: "text" },
			{ key: "package_length_unit_of_measure", label: "Pack Length UOM", type: "text" },
			{ key: "shipping_weight", label: "Shipping Weight", type: "number" },
			{ key: "shipping_weight_unit_of_measure", label: "Shipping Weight UOM", type: "text" },
			{ key: "dimensional_weight", label: "Dimensional Weight", type: "number" },
			{ key: "dimensional_weight_unit_of_measure", label: "Dim. Weight UOM", type: "text" },
			{ key: "min_order_quantity_unit", label: "Min Order Qty", type: "number" },
			{ key: "bundle_bale_qty", label: "Bundle/Bale Qty", type: "text" },
		],
	},
	{
		id: "pallet",
		label: "Pallet",
		fields: [
			{ key: "units_per_pallet", label: "Units per Pallet", type: "number" },
			{ key: "pallet_width", label: "Pallet Width", type: "number", decimal: true },
			{ key: "pallet_length", label: "Pallet Length", type: "number", decimal: true },
			{ key: "pallet_height", label: "Pallet Height", type: "number", decimal: true },
			{ key: "pallet_weight", label: "Pallet Weight", type: "number", decimal: true },
			{ key: "pallet_width_unit_of_measure", label: "Pallet Width UOM", type: "text" },
			{ key: "pallet_length_unit_of_measure", label: "Pallet Length UOM", type: "text" },
			{ key: "pallet_height_unit_of_measure", label: "Pallet Height UOM", type: "text" },
			{ key: "pallet_weight_unit_of_measure", label: "Pallet Weight UOM", type: "text" },
			{ key: "pallet_contains_quantity_box", label: "Boxes per Pallet", type: "number" },
		],
	},
	{
		id: "specifications",
		label: "Specifications",
		fields: [
			{ key: "footage", label: "Footage", type: "number" },
			{ key: "footage_unit_of_measure", label: "Footage UOM", type: "text" },
			{ key: "break_strength", label: "Break Strength", type: "number" },
			{ key: "break_strength_unit_of_measure", label: "Break Strength UOM", type: "text" },
			{ key: "system_strength", label: "System Strength", type: "number" },
			{ key: "system_strength_unit_of_measure", label: "System Strength UOM", type: "text" },
			{ key: "core_diameter", label: "Core Diameter", type: "number" },
			{ key: "core_diameter_unit_of_measure", label: "Core Diameter UOM", type: "text" },
			{ key: "core_weight", label: "Core Weight", type: "number" },
			{ key: "core_weight_unit_of_measure", label: "Core Weight UOM", type: "text" },
			{ key: "outside_diameter", label: "Outside Diameter", type: "number" },
			{ key: "outside_diameter_unit_of_measure", label: "Outside Diameter UOM", type: "text" },
			{ key: "wire_diameter", label: "Wire Diameter", type: "number" },
			{ key: "wire_diameter_unit_of_measure", label: "Wire Diameter UOM", type: "text" },
			{ key: "elongation", label: "Elongation", type: "number" },
			{ key: "elongation_unit_of_measure", label: "Elongation UOM", type: "text" },
			{ key: "inside_diameter", label: "Inside Diameter", type: "number" },
			{ key: "inside_diameter_unit_of_measure", label: "Inside Diameter UOM", type: "text" },
		],
	},
	{
		id: "system",
		label: "System",
		fields: [
			{ key: "categoryName", label: "Category", type: "readonly" },
			{ key: "subcategoryName", label: "Subcategory", type: "readonly" },
			{ key: "productName", label: "Product", type: "readonly" },
			{ key: "id", label: "ID", type: "readonly" },
			{ key: "createdAt", label: "Created At", type: "readonly" },
			{ key: "updatedAt", label: "Updated At", type: "readonly" },
		],
	},
];

export const ALL_VARIANT_FIELDS = VARIANT_FIELD_GROUPS.flatMap((g) => g.fields);

export const DEFAULT_VISIBLE_KEYS = [
	"title",
	"stock",
	"status",
	"available",
	"one_four_units",
	"five_nine_units",
	"ten_plus_units",
];

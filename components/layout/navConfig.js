import {
	LayoutDashboard,
	Boxes,
	Table,
	Star,
	SlidersHorizontal,
	ClipboardList,
	Truck,
	Users,
	Image as ImageIcon,
} from "lucide-react";

// Fresh IA, grouped by business function - not a port of ESK_FE's old
// flat "Products / Shipping / Order / Images / Customers" admin sidebar.
export const navSections = [
	{ label: "Dashboard", href: "/", icon: LayoutDashboard },
	// Catalog: a single hierarchy-aware browser (breadcrumb drill-down through
	// Category -> Subcategory/Product/Variant) replacing the four old flat
	// list pages (Categories/Subcategories/Products/Variants), per the
	// Catalog Hierarchy Redesign plan. Featured stays separate - it's a
	// variant<->variant cross-link, unrelated to the tree.
	{ label: "Catalog", href: "/catalog", icon: Boxes },
	// Variants: a spreadsheet-style grid over the full ~90-field attribute
	// sheet (title/pricing/packaging/pallet/specs/...), with column show/hide,
	// saved layouts and per-column filtering - a different tool than Catalog's
	// hierarchy browser, which only quick-edits a handful of fields per variant.
	{ label: "Variants", href: "/catalog/variants", icon: Table },
	{ label: "Featured", href: "/catalog/featured", icon: Star },
	{
		label: "Catalog Attributes",
		icon: SlidersHorizontal,
		children: [
			{ label: "Descriptions", href: "/catalog/attributes/descriptions" },
			{ label: "Dimensions", href: "/catalog/attributes/dimensions" },
			{ label: "Package Info", href: "/catalog/attributes/package-info" },
			{ label: "Pallet Info", href: "/catalog/attributes/pallet-info" },
			{ label: "Specifications", href: "/catalog/attributes/specifications" },
			{ label: "Pricing", href: "/catalog/attributes/pricing" },
		],
	},
	{ label: "Orders", href: "/orders", icon: ClipboardList },
	{
		label: "Fulfillment",
		icon: Truck,
		children: [
			{ label: "Shipments", href: "/shipments" },
			{ label: "Carriers", href: "/carriers" },
			{ label: "Carrier Prices", href: "/carrier-prices" },
			{ label: "Deci Ranges", href: "/deci" },
			// Shipping Profiles still dropped from this section - see Phase 3
			// Orders+Fulfillment PR notes (customer-owned data, not admin-managed
			// in bulk). Phase 5.5 adds a per-customer view under Customers instead.
		],
	},
	{
		label: "Customers",
		icon: Users,
		children: [
			{ label: "Customers", href: "/customers" },
			{ label: "Claims", href: "/customers/claims" },
		],
	},
	{ label: "Media", href: "/media", icon: ImageIcon },
];

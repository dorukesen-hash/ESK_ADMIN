import {
	LayoutDashboard,
	Boxes,
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
	{
		label: "Catalog",
		icon: Boxes,
		children: [
			// New hierarchy-aware browser (breadcrumb drill-down through
			// Category -> Subcategory/Product/Variant). The flat list pages below
			// stay linked until this has been verified end-to-end, then this
			// group collapses to just this entry + Featured (cutover step).
			{ label: "Browse (New)", href: "/catalog" },
			{ label: "Categories", href: "/catalog/categories" },
			{ label: "Subcategories", href: "/catalog/subcategories" },
			{ label: "Products", href: "/catalog/products" },
			{ label: "Variants", href: "/catalog/variants" },
			{ label: "Featured", href: "/catalog/featured" },
		],
	},
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

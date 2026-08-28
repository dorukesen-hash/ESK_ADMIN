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
			// Carrier Prices and Shipping Profiles dropped from this section - see
			// Phase 3 Orders+Fulfillment PR notes for why (broken/incomplete backend
			// for the former, customer-owned data for the latter, not admin-managed).
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

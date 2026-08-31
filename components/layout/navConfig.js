import {
	LayoutDashboard,
	Boxes,
	Table,
	Star,
	Users2,
	History,
	ClipboardList,
	Truck,
	Users,
	Image as ImageIcon,
	Tag,
	FileText,
} from "lucide-react";

// Fresh IA, grouped by business function - not a port of ESK_FE's old
// flat "Products / Shipping / Order / Images / Customers" admin sidebar.
export const navSections = [
	{ label: "Dashboard", href: "/", icon: LayoutDashboard },
	// Catalog: a single hierarchy-aware browser (breadcrumb drill-down through
	// Category -> Subcategory/Product/Variant) replacing the four old flat
	// list pages (Categories/Subcategories/Products/Variants), per the
	// Catalog Hierarchy Redesign plan.
	{ label: "Catalog", href: "/catalog", icon: Boxes },
	// Variants: a spreadsheet-style grid over the full ~90-field attribute
	// sheet (title/pricing/packaging/pallet/specs/...), with column show/hide,
	// saved layouts and per-column filtering - a different tool than Catalog's
	// hierarchy browser, which only quick-edits a handful of fields per variant.
	{ label: "Variants", href: "/catalog/variants", icon: Table },
	// Featured: real, admin-curated homepage highlights (Variant.featured/
	// featured_position) - distinct from Frequently Bought Together below,
	// which is a per-variant cross-sell list, not a homepage curation list.
	{ label: "Featured", href: "/catalog/featured", icon: Star },
	{
		label: "Frequently Bought Together",
		href: "/catalog/frequently-bought-together",
		icon: Users2,
	},
	// Global, cross-variant activity feed (per-variant view is the History
	// icon inside the Variants grid itself).
	{ label: "Activity Log", href: "/catalog/activity-log", icon: History },
	// Catalog Attributes (Descriptions/Dimensions/Package Info/Pallet Info/
	// Specifications/Pricing) removed - those five resources beyond
	// Descriptions (Dimension/PackageInfo/PalletInfo/Spesification/Price) were
	// never associated with Variant/Product/Subcategory in ESK_API (confirmed
	// via db/models/index.js - no hasOne/belongsTo anywhere), so the pages
	// managed data nothing in the real catalog ever read. Description itself
	// stays wired (Subcategory's own description field uses it directly, not
	// through this removed UI).
	{ label: "Orders", href: "/orders", icon: ClipboardList },
	{ label: "Discount Codes", href: "/discount-codes", icon: Tag },
	{ label: "Invoices", href: "/invoices", icon: FileText },
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

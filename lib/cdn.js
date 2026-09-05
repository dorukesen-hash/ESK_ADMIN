// Builds a full CDN URL from a DB-stored relative path (e.g. "images/foo.jpg").
// NEXT_PUBLIC_CDN_URL sometimes carries a trailing slash depending on how
// it's set per-environment (it does in production, doesn't locally) - a
// naive `${CDN_URL}/${path}` then produces a double slash
// ("https://cdn.example.com//images/foo.jpg"), which Cloudflare/R2 treats
// as a different, nonexistent path and 404s. This normalizes regardless.
export const cdnUrl = (path) => {
	if (!path) return null;
	if (path.startsWith("http")) return path;
	const base = (process.env.NEXT_PUBLIC_CDN_URL || "").replace(/\/+$/, "");
	const rest = path.replace(/^\/+/, "");
	return `${base}/${rest}`;
};

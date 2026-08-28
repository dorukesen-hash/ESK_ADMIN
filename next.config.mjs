/** @type {import('next').NextConfig} */
const nextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "cdn.enesdorukesen.com.tr"
			}
		],
	}
};

export default nextConfig;

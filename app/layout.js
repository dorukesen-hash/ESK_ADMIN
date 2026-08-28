import { Montserrat } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const montserrat = Montserrat({
	subsets: ["latin"],
	variable: "--font-montserrat",
});

export const metadata = {
	title: "ESK Admin",
	description: "ESK Packaging admin panel",
};

export default function RootLayout({ children }) {
	return (
		<html lang="en" className={montserrat.variable}>
			<body>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}

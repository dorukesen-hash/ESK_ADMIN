import LoginForm from "./LoginForm";

export const metadata = {
	title: "Login — ESK Admin",
};

export default function LoginPage() {
	return (
		<main className="flex min-h-screen items-center justify-center bg-button-gray px-4">
			<LoginForm />
		</main>
	);
}

export default function PageHeader({ title, action }) {
	return (
		<div className="mb-4 flex items-center justify-between">
			<h1 className="font-montserrat text-xl font-semibold text-text-dark">{title}</h1>
			{action}
		</div>
	);
}

"use client";

export default function DataTable({
	columns,
	rows,
	getRowId,
	isLoading = false,
	emptyMessage = "Kayıt bulunamadı",
	actions,
}) {
	if (isLoading) {
		return (
			<div className="bg-white p-8 text-center text-sm text-text-light shadow-custom">
				Yükleniyor...
			</div>
		);
	}

	if (!rows || rows.length === 0) {
		return (
			<div className="bg-white p-8 text-center text-sm text-text-light shadow-custom">
				{emptyMessage}
			</div>
		);
	}

	return (
		<div className="overflow-x-auto bg-white shadow-custom">
			<table className="min-w-full divide-y divide-border-gray text-sm">
				<thead className="bg-custom-table-head">
					<tr>
						{columns.map((col) => (
							<th key={col.key} className="whitespace-nowrap px-4 py-3 text-left font-semibold text-text-dark">
								{col.header}
							</th>
						))}
						{actions && (
							<th className="whitespace-nowrap px-4 py-3 text-right font-semibold text-text-dark">
								İşlemler
							</th>
						)}
					</tr>
				</thead>
				<tbody className="divide-y divide-border-gray">
					{rows.map((row) => (
						<tr key={getRowId(row)} className="hover:bg-custom-table-soft-blue">
							{columns.map((col) => (
								<td key={col.key} className="whitespace-nowrap px-4 py-3 text-text-dark">
									{col.render ? col.render(row) : row[col.key]}
								</td>
							))}
							{actions && <td className="whitespace-nowrap px-4 py-3 text-right">{actions(row)}</td>}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

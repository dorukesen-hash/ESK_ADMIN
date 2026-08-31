"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

// SpecialPrices overrides + discountPercent changes for one customer -
// neither was tracked before Phase 2 (unlike Variant field edits, which
// variant_audit_log already captured as a side effect of any admin edit).
export function usePricingAuditLog(userId) {
	return useQuery({
		queryKey: ["pricing-audit-log", userId],
		queryFn: async () => {
			const { data } = await api.get(`/admin/customers/${userId}/pricing-audit-log`);
			return data ?? [];
		},
		enabled: Boolean(userId),
	});
}

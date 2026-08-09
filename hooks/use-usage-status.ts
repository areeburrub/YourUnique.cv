"use client";

import { useQuery } from "@tanstack/react-query";

import {
	fetchUsageStatus,
	usageStatusKey,
	type UsageStatusResponse,
} from "@/lib/usage-status";

export function useUsageStatus() {
	return useQuery<UsageStatusResponse>({
		queryKey: usageStatusKey,
		queryFn: fetchUsageStatus,
		staleTime: 30_000,
		refetchOnWindowFocus: true,
	});
}

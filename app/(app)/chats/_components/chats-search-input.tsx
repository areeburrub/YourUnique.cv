"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDeferredValue, useEffect, useState } from "react";

import { Input } from "@/components/ui/input";

export function ChatsSearchInput() {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const urlQuery = searchParams.get("q") ?? "";
	const [query, setQuery] = useState(urlQuery);
	const deferredQuery = useDeferredValue(query);

	useEffect(() => {
		const next = deferredQuery.trim();
		if (next === urlQuery) {
			return;
		}
		const params = new URLSearchParams(searchParams.toString());
		if (next) {
			params.set("q", next);
		} else {
			params.delete("q");
		}
		const qs = params.toString();
		router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
	}, [deferredQuery, pathname, router, searchParams, urlQuery]);

	return (
		<div className="relative">
			<Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-soft" />
			<Input
				value={query}
				onChange={(event) => setQuery(event.currentTarget.value)}
				placeholder="Search chats"
				className="h-9 pl-9"
				aria-label="Search chats"
			/>
		</div>
	);
}

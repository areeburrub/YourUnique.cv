"use client";

import { createContext, useContext, type ReactNode } from "react";

const HasReadyResumeContext = createContext(false);

export function HasReadyResumeProvider({
	hasReadyResume,
	children,
}: {
	hasReadyResume: boolean;
	children: ReactNode;
}) {
	return (
		<HasReadyResumeContext.Provider value={hasReadyResume}>
			{children}
		</HasReadyResumeContext.Provider>
	);
}

export function useHasReadyResume() {
	return useContext(HasReadyResumeContext);
}

"use client";

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "nextjs-toploader/app";

type SoftNavContextValue = {
	pathname: string;
	softReplace: (href: string) => void;
	newChatKey: number;
	openNewChat: () => void;
};

const SoftNavContext = createContext<SoftNavContextValue | null>(null);

export function SoftNavProvider({ children }: { children: React.ReactNode }) {
	const router = useRouter();
	const nextPathname = usePathname();
	const [softPathname, setSoftPathname] = useState<string | null>(null);
	const [newChatKey, setNewChatKey] = useState(0);

	useEffect(() => {
		setSoftPathname(null);
	}, [nextPathname]);

	const softReplace = useCallback((href: string) => {
		window.history.replaceState(null, "", href);
		setSoftPathname(href);
	}, []);

	const openNewChat = useCallback(() => {
		setSoftPathname(null);

		if (nextPathname === "/new-chat") {
			window.history.replaceState(null, "", "/new-chat");
			setNewChatKey((key) => key + 1);
			return;
		}

		router.push("/new-chat");
	}, [nextPathname, router]);

	return (
		<SoftNavContext.Provider
			value={{
				pathname: softPathname ?? nextPathname,
				softReplace,
				newChatKey,
				openNewChat,
			}}
		>
			{children}
		</SoftNavContext.Provider>
	);
}

export function useSoftNav() {
	const value = useContext(SoftNavContext);
	if (!value) {
		throw new Error("useSoftNav must be used within SoftNavProvider");
	}
	return value;
}

export function useSoftPathname() {
	const nextPathname = usePathname();
	const value = useContext(SoftNavContext);
	return value?.pathname ?? nextPathname;
}

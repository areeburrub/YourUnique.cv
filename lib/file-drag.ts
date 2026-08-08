export function dataTransferHasFiles(dataTransfer: DataTransfer | null) {
	if (!dataTransfer) {
		return false;
	}

	if (dataTransfer.files && dataTransfer.files.length > 0) {
		return true;
	}

	const types = dataTransfer.types;
	if (types) {
		const list = types as ArrayLike<string> & {
			includes?: (value: string) => boolean;
			contains?: (value: string) => boolean;
		};

		if (typeof list.includes === "function" && list.includes("Files")) {
			return true;
		}
		if (typeof list.contains === "function" && list.contains("Files")) {
			return true;
		}
		for (let index = 0; index < list.length; index += 1) {
			const type = list[index];
			if (type === "Files" || type === "application/x-moz-file") {
				return true;
			}
		}
	}

	if (dataTransfer.items) {
		for (const item of dataTransfer.items) {
			if (item.kind === "file") {
				return true;
			}
		}
	}

	return false;
}

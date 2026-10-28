export type PaginationModel = {
	currentPage: number;
	totalPages: number;
	pages: number[];
	hasPrevious: boolean;
	hasNext: boolean;
};

/** Port of templUI's CreatePagination: a window of at most `maxVisible` page numbers around `currentPage`. */
export function createPagination(currentPage: number, totalPages: number, maxVisible = 5): PaginationModel {
	if (totalPages < 1) totalPages = 1;
	if (currentPage < 1) currentPage = 1;
	if (currentPage > totalPages) currentPage = totalPages;
	if (maxVisible < 1) maxVisible = 5;

	let start = 1;
	let end = totalPages;
	if (totalPages > maxVisible) {
		const half = Math.floor(maxVisible / 2);
		start = currentPage - half;
		end = currentPage + half;
		if (start < 1) {
			end += 1 - start;
			start = 1;
		}
		if (end > totalPages) {
			start = Math.max(1, start - (end - totalPages));
			end = totalPages;
		}
	}

	const pages: number[] = [];
	for (let i = start; i <= end; i++) pages.push(i);

	return {
		currentPage,
		totalPages,
		pages,
		hasPrevious: currentPage > 1,
		hasNext: currentPage < totalPages,
	};
}

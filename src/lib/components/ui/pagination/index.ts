import Root from "./pagination.svelte";
import Content from "./pagination-content.svelte";
import Item from "./pagination-item.svelte";
import Link from "./pagination-link.svelte";
import Previous from "./pagination-previous.svelte";
import Next from "./pagination-next.svelte";
import Ellipsis from "./pagination-ellipsis.svelte";
export { createPagination, type PaginationModel } from "./create-pagination.js";

export {
	Root,
	Content,
	Item,
	Link,
	Previous,
	Next,
	Ellipsis,
	//
	Root as Pagination,
	Content as PaginationContent,
	Item as PaginationItem,
	Link as PaginationLink,
	Previous as PaginationPrevious,
	Next as PaginationNext,
	Ellipsis as PaginationEllipsis,
};

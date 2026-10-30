import * as React from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export function PaginationDemo() {
  const [currentPage, setCurrentPage] = React.useState(2);

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink
            isActive={currentPage === 1}
            onClick={() => setCurrentPage(1)}
          >
            1
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink
            isActive={currentPage === 2}
            onClick={() => setCurrentPage(2)}
          >
            2
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink
            isActive={currentPage === 3}
            onClick={() => setCurrentPage(3)}
          >
            3
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext
            onClick={() => setCurrentPage((p) => Math.min(10, p + 1))}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

export default PaginationDemo;

import { FilterSidebar, FilterOptions } from "../FilterSidebar";
import { useState } from "react";

export default function FilterSidebarExample() {
  const [filters, setFilters] = useState<FilterOptions>({
    roles: [],
    skills: [],
    availability: []
  });

  return (
    <div className="p-6 max-w-xs">
      <FilterSidebar filters={filters} onChange={setFilters} />
    </div>
  );
}

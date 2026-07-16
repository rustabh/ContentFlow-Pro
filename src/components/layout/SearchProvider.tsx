"use client";

import { createContext, ReactNode, useContext, useState } from "react";

/** Global top-bar search query, consumed by list pages to filter results. */
const SearchContext = createContext<{
  query: string;
  setQuery: (q: string) => void;
}>({ query: "", setQuery: () => {} });

export function SearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("");
  return (
    <SearchContext.Provider value={{ query, setQuery }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  return useContext(SearchContext);
}

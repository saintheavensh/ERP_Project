import { z } from 'zod';

export const searchQuerySchema = z.object({
  q: z.string().trim().min(1),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;

export type SearchResultType = 'customer' | 'ticket' | 'inventory' | 'supplier';

export interface SearchResultItem {
  type: SearchResultType;
  id: string;
  title: string;
  subtitle: string | null;
  href: string;
}

export interface SearchResults {
  query: string;
  results: SearchResultItem[];
}

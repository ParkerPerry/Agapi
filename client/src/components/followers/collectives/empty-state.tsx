import { Users } from 'lucide-react';

interface EmptyStateProps {
  searchApplied?: boolean;
}

export function CollectiveEmptyState({ searchApplied = false }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Users className="w-16 h-16 text-muted-foreground mb-4" />
      <h3 className="text-xl font-semibold mb-2">
        {searchApplied 
          ? "No AI Collectives Found For Your Search" 
          : "No AI Collectives Found"}
      </h3>
      <p className="text-muted-foreground max-w-md">
        {searchApplied 
          ? "Try changing your search terms or clearing filters to see more results." 
          : "You haven't created any AI collectives yet. Use the Create AI Collective tab or the Clone Factory to create a group of AI followers."}
      </p>
    </div>
  );
}
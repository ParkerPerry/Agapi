import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { CollectiveCard } from './collective-card';
import { CollectiveHeader } from './collective-header';
import { CollectiveSearch } from './collective-search';
import { CollectiveEmptyState } from './empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import type { AiFollowerCollective, AiFollower } from '@shared/schema';

// Define a type for follower with collective member ID
interface FollowerWithCollectiveMemberId extends AiFollower {
  collectiveMemberId: number;
}

// Define a type for collective with member count
interface CollectiveWithMemberCount extends AiFollowerCollective {
  memberCount?: number;
}

export function CollectivesList() {
  const [expandedCollectiveId, setExpandedCollectiveId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [creationTimeFilter, setCreationTimeFilter] = useState('all');
  const [collectivesWithCounts, setCollectivesWithCounts] = useState<CollectiveWithMemberCount[]>([]);

  // Fetch AI collectives
  const {
    data: collectives = [],
    isLoading: isLoadingCollectives,
    isError: isCollectivesError,
    refetch: refetchCollectives
  } = useQuery({
    queryKey: ['ai-follower-collectives'],
    queryFn: async () => {
      const response = await apiRequest('/api/followers/collectives', {
        method: 'GET'
      });
      return response;
    }
  });

  // Fetch collective members when a collective is expanded
  const {
    data: collectiveMembers = [],
    isLoading: isLoadingMembers,
    isError: isMembersError
  } = useQuery({
    queryKey: ['collective-members', expandedCollectiveId],
    queryFn: async () => {
      if (!expandedCollectiveId) return [];
      const response = await apiRequest(
        `/api/followers/collectives/${expandedCollectiveId}/members`,
        { method: 'GET' }
      );
      return response;
    },
    enabled: !!expandedCollectiveId
  });

  // When collectives data is loaded, fetch member counts for each
  useEffect(() => {
    if (collectives && collectives.length > 0) {
      const enrichedCollectives: CollectiveWithMemberCount[] = collectives.map((collective) => {
        if (expandedCollectiveId === collective.id) {
          return {
            ...collective,
            memberCount: collectiveMembers.length
          };
        }
        return collective;
      });
      setCollectivesWithCounts(enrichedCollectives);
    }
  }, [collectives, collectiveMembers, expandedCollectiveId]);

  const handleViewMembers = (collectiveId: number) => {
    setExpandedCollectiveId(expandedCollectiveId === collectiveId ? null : collectiveId);
  };

  // Filter collectives based on search and time
  const filteredCollectives = collectivesWithCounts.filter((collective) => {
    // Search filter
    const matchesSearch = searchQuery === '' 
      || collective.name.toLowerCase().includes(searchQuery.toLowerCase())
      || (collective.description && collective.description.toLowerCase().includes(searchQuery.toLowerCase()))
      || (collective.personality && collective.personality.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Creation time filter
    if (creationTimeFilter === 'all') return matchesSearch;
    
    const creationDate = new Date(collective.createdAt || new Date());
    const now = new Date();
    
    if (creationTimeFilter === 'today') {
      return matchesSearch && 
        creationDate.getDate() === now.getDate() &&
        creationDate.getMonth() === now.getMonth() &&
        creationDate.getFullYear() === now.getFullYear();
    }
    
    if (creationTimeFilter === 'week') {
      const oneWeekAgo = new Date(now);
      oneWeekAgo.setDate(now.getDate() - 7);
      return matchesSearch && creationDate >= oneWeekAgo;
    }
    
    if (creationTimeFilter === 'month') {
      return matchesSearch && 
        creationDate.getMonth() === now.getMonth() &&
        creationDate.getFullYear() === now.getFullYear();
    }
    
    if (creationTimeFilter === 'year') {
      return matchesSearch && creationDate.getFullYear() === now.getFullYear();
    }
    
    return matchesSearch;
  });

  // Display loading state
  if (isLoadingCollectives) {
    return (
      <div className="space-y-4">
        <CollectiveHeader collectiveCount={0} />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-lg p-6 space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-4 w-1/4" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-10 w-32" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Display error state
  if (isCollectivesError) {
    return (
      <div className="space-y-4">
        <CollectiveHeader collectiveCount={0} />
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">
            Failed to load your AI collectives.
          </p>
          <Button onClick={() => refetchCollectives()} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <CollectiveHeader collectiveCount={collectives.length} />
        
        {collectives.length > 0 && (
          <CollectiveSearch
            searchQuery={searchQuery}
            onSearch={setSearchQuery}
            creationTimeFilter={creationTimeFilter}
            onFilterChange={setCreationTimeFilter}
          />
        )}
      </div>
      
      {collectives.length === 0 ? (
        <CollectiveEmptyState />
      ) : filteredCollectives.length === 0 ? (
        <CollectiveEmptyState searchApplied={true} />
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredCollectives.map(collective => (
            <CollectiveCard
              key={collective.id}
              collective={collective}
              expanded={expandedCollectiveId === collective.id}
              members={expandedCollectiveId === collective.id ? collectiveMembers : []}
              onViewMembers={handleViewMembers}
              isLoadingMembers={isLoadingMembers && expandedCollectiveId === collective.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
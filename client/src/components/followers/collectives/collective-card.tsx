import { useState } from 'react';
import { formatRelativeTime } from '@/utils/date';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, ChevronRight, Activity } from 'lucide-react';
import type { AiFollower, AiFollowerCollective } from '@shared/schema';

// Define a type for follower with collective member ID
interface FollowerWithCollectiveMemberId extends AiFollower {
  collectiveMemberId: number;
}

// Define a type for collective with member count
interface CollectiveWithMemberCount extends AiFollowerCollective {
  memberCount?: number;
}

interface CollectiveCardProps {
  collective: CollectiveWithMemberCount;
  expanded: boolean;
  members: FollowerWithCollectiveMemberId[];
  onViewMembers: (id: number) => void;
  isLoadingMembers: boolean;
}

export function CollectiveCard({
  collective,
  expanded,
  members,
  onViewMembers,
  isLoadingMembers
}: CollectiveCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{collective.name}</CardTitle>
            <CardDescription>
              Created {formatRelativeTime(collective.createdAt || new Date())}
            </CardDescription>
          </div>
          <Badge variant="outline" className="flex items-center">
            <Users className="h-3 w-3 mr-1" />
            {/* Display actual member count instead of placeholder */}
            {expanded ? members.length : 
              (collective.memberCount !== undefined ? collective.memberCount : members.length || 0)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="line-clamp-2 text-sm">
          {collective.description || collective.personality || 'No description provided.'}
        </p>
      </CardContent>
      <CardFooter className="pt-2 flex justify-between">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onViewMembers(collective.id)}
          className="flex items-center"
        >
          {expanded ? 'Hide Members' : 'View Members'}
          <ChevronRight className={`ml-2 h-4 w-4 transform transition-transform ${
            expanded ? 'rotate-90' : ''
          }`} />
        </Button>
      </CardFooter>
      
      {expanded && (
        <div className="px-6 pb-4">
          <h4 className="font-medium mb-2 text-sm">Collective Members:</h4>
          {isLoadingMembers ? (
            <p className="text-sm text-muted-foreground italic">Loading members...</p>
          ) : members.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No members found in this collective.</p>
          ) : (
            <div className="space-y-2">
              {Array.isArray(members) && members.length > 0 ? members.map((follower) => (
                <div key={follower.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={follower.avatarUrl} alt={follower.name} />
                    <AvatarFallback>{getInitials(follower.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{follower.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {follower.personality.substring(0, 40)}...
                    </p>
                  </div>
                  <Badge variant="outline" className={`${
                    follower.responsiveness === 'instant' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                    follower.responsiveness === 'active' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                    follower.responsiveness === 'casual' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                  }`}>
                    <Activity className="h-3 w-3 mr-1" />
                    {follower.responsiveness}
                  </Badge>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground italic">No members found in this collective.</p>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
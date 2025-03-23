import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AiFollowerCollective, AiFollower } from '@shared/schema';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, User, ChevronRight, Activity } from 'lucide-react';

type CollectiveWithMembers = AiFollowerCollective & {
  members: (AiFollower & { collectiveMemberId: number })[];
};

export function CollectivesList() {
  const [expandedCollective, setExpandedCollective] = useState<number | null>(null);

  // Fetch user's collectives
  const { data: collectives, isLoading } = useQuery<AiFollowerCollective[]>({
    queryKey: ['/api/followers/collectives'],
  });

  // Function to fetch members for a specific collective when expanded
  const fetchCollectiveMembers = async (collectiveId: number) => {
    const response = await fetch(`/api/followers/collectives/${collectiveId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch collective members');
    }
    return response.json();
  };

  // Query for expanded collective's members
  const { data: expandedCollectiveData, isLoading: isLoadingMembers } = useQuery<{ 
    collective: AiFollowerCollective, 
    members: (AiFollower & { collectiveMemberId: number })[] 
  }>({
    queryKey: ['/api/followers/collectives', expandedCollective],
    queryFn: () => expandedCollective ? fetchCollectiveMembers(expandedCollective) : Promise.resolve(null),
    enabled: !!expandedCollective,
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading collectives...</div>;
  }

  if (!collectives || collectives.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No AI collectives found. Create one to get started!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <Users className="h-6 w-6" />
        Your AI Collectives
      </h2>
      
      {collectives.map((collective) => (
        <Card key={collective.id} className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {collective.name}
                  <Badge variant="outline" className="ml-2">
                    {collective.active ? 'Active' : 'Inactive'}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {collective.description || `A collective of AI followers with ${collective.personality.substring(0, 30)}... personality`}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpandedCollective(
                  expandedCollective === collective.id ? null : collective.id
                )}
              >
                {expandedCollective === collective.id ? 'Collapse' : 'View Members'}
                <ChevronRight className={`ml-1 h-4 w-4 transition-transform ${
                  expandedCollective === collective.id ? 'rotate-90' : ''
                }`} />
              </Button>
            </div>
          </CardHeader>
          
          {expandedCollective === collective.id && (
            <CardContent className="pb-3">
              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Collective Members
                </h3>
                
                {isLoadingMembers ? (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    Loading members...
                  </div>
                ) : expandedCollectiveData?.members?.length ? (
                  <div className="grid gap-2">
                    {expandedCollectiveData.members.map((follower) => (
                      <div 
                        key={follower.id} 
                        className="flex items-center justify-between p-2 rounded-md hover:bg-muted"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={follower.avatarUrl} alt={follower.name} />
                            <AvatarFallback>
                              {follower.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{follower.name}</div>
                            <div className="text-xs text-muted-foreground truncate max-w-[300px]">
                              {follower.personality.substring(0, 50)}...
                            </div>
                          </div>
                        </div>
                        <Badge variant={follower.active ? "default" : "secondary"} className="flex items-center gap-1">
                          <Activity className="h-3 w-3 mr-1" />
                          {follower.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    No members found in this collective
                  </div>
                )}
              </div>
            </CardContent>
          )}
          
          <CardFooter className="bg-muted/50 p-2 text-xs text-muted-foreground">
            <div className="flex justify-between w-full">
              <span>Created: {collective.createdAt ? new Date(collective.createdAt).toLocaleDateString() : 'Unknown'}</span>
              <span>Personality: {collective.personality.substring(0, 30)}...</span>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
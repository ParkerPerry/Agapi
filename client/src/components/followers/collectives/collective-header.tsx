interface CollectiveHeaderProps {
  collectiveCount: number;
}

export function CollectiveHeader({ collectiveCount }: CollectiveHeaderProps) {
  return (
    <div className="flex flex-col space-y-2">
      <h2 className="text-2xl font-bold">Your AI Collectives</h2>
      <p className="text-muted-foreground">
        {collectiveCount > 0 
          ? `You have ${collectiveCount} AI Collective${collectiveCount !== 1 ? 's' : ''}. Each collective is a group of related AI followers created together.`
          : 'AI Collectives are groups of related AI followers that were created together.'}
      </p>
    </div>
  );
}
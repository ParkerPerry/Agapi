import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AiFollower } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface MintingStatus {
  status: 'NOT_MINTED' | 'PENDING' | 'MINTED' | 'FAILED';
  tokenId?: number;
  transactionHash?: string;
  ownerAddress?: string;
  tokenURI?: string;
  error?: string;
}

interface FollowerNftMintProps {
  follower: AiFollower;
}

export function FollowerNftMint({ follower }: FollowerNftMintProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<MintingStatus | null>(null);
  const [ownerAddress, setOwnerAddress] = useState('');
  const { toast } = useToast();

  // Fetch current minting status on open
  useEffect(() => {
    if (open && !status) {
      fetchStatus();
    }
  }, [open]);

  const fetchStatus = async () => {
    try {
      const response = await apiRequest(`/api/nft/status/${follower.id}`, "GET");
      setStatus(response as MintingStatus);
    } catch (error) {
      console.error('Error fetching NFT status:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch NFT status',
        variant: 'destructive'
      });
    }
  };

  const handleMint = async () => {
    if (!ownerAddress || !ownerAddress.startsWith('0x')) {
      toast({
        title: 'Invalid Address',
        description: 'Please enter a valid Ethereum address starting with 0x',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setLoading(true);
      const response = await apiRequest(`/api/nft/mint/${follower.id}`, "POST", {
        ownerAddress
      });
      setStatus(response as MintingStatus);
      toast({
        title: 'Success',
        description: 'NFT minting started successfully',
      });
    } catch (error) {
      console.error('Error minting NFT:', error);
      toast({
        title: 'Error',
        description: 'Failed to mint NFT',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }

    setLoading(true);
    try {
      const response = await apiRequest(`/api/nft/mint/${follower.id}`, {
        method: 'POST',
        body: JSON.stringify({ ownerAddress }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      setStatus(response as MintingStatus);
      toast({
        title: 'Success',
        description: 'NFT minting process started',
      });
    } catch (error) {
      console.error('Error minting NFT:', error);
      toast({
        title: 'Error',
        description: 'Failed to mint NFT',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    
    switch (status) {
      case 'NOT_MINTED':
        return <Badge variant="outline" className="bg-gray-100">Not Minted</Badge>;
      case 'PENDING':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'MINTED':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Minted</Badge>;
      case 'FAILED':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const renderStatusContent = () => {
    if (!status) return <p>Loading status...</p>;

    switch (status.status) {
      case 'NOT_MINTED':
        return (
          <div className="space-y-4">
            <p>This AI follower has not been minted as an NFT yet.</p>
            <div className="space-y-2">
              <Label htmlFor="owner-address">Owner Ethereum Address</Label>
              <Input 
                id="owner-address" 
                placeholder="0x..." 
                value={ownerAddress} 
                onChange={(e) => setOwnerAddress(e.target.value)} 
              />
              <p className="text-xs text-gray-500">The Ethereum address that will own this NFT</p>
            </div>
            <Button onClick={handleMint} disabled={loading}>
              {loading ? 'Minting...' : 'Mint NFT'}
            </Button>
          </div>
        );
        
      case 'PENDING':
        return (
          <div className="space-y-4">
            <p>Your NFT is being minted. This process can take a few minutes to complete.</p>
            <p className="text-sm text-gray-500">Owner address: {status.ownerAddress}</p>
            <Button onClick={fetchStatus}>Check Status</Button>
          </div>
        );
        
      case 'MINTED':
        return (
          <div className="space-y-4">
            <p>Your AI follower has been successfully minted as an NFT!</p>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Token ID:</span> {status.tokenId}</p>
              <p><span className="font-medium">Owner:</span> {status.ownerAddress}</p>
              {status.transactionHash && (
                <p>
                  <span className="font-medium">Transaction:</span>{' '}
                  <a 
                    href={`https://sepolia.basescan.org/tx/${status.transactionHash}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline break-all"
                  >
                    {status.transactionHash}
                  </a>
                </p>
              )}
            </div>
          </div>
        );
        
      case 'FAILED':
        return (
          <div className="space-y-4">
            <p>Sorry, there was an error minting your NFT.</p>
            {status.error && <p className="text-sm text-red-600">{status.error}</p>}
            <div className="space-y-2">
              <Label htmlFor="owner-address">Owner Ethereum Address</Label>
              <Input 
                id="owner-address" 
                placeholder="0x..." 
                value={ownerAddress || status.ownerAddress || ''} 
                onChange={(e) => setOwnerAddress(e.target.value)} 
              />
            </div>
            <Button onClick={handleMint} disabled={loading}>
              {loading ? 'Minting...' : 'Try Again'}
            </Button>
          </div>
        );
        
      default:
        return <p>Unknown status</p>;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="w-full">
            {getStatusBadge(status?.status)} Mint as NFT
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Mint AI Follower as NFT</DialogTitle>
            <DialogDescription>
              Mint {follower.name} as an NFT on the Base Sepolia blockchain.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{follower.name}</CardTitle>
                <CardDescription>AI Follower #{follower.id}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <img 
                    src={follower.avatarUrl} 
                    alt={follower.name} 
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium">{follower.personality}</p>
                    <p className="text-sm text-gray-500">{follower.communicationStyle}</p>
                  </div>
                </div>
                
                {renderStatusContent()}
              </CardContent>
              <CardFooter className="text-xs text-gray-500 border-t pt-3">
                <p>
                  This will mint your AI follower as an NFT on the Base Sepolia testnet. 
                  Your AI follower will remain unchanged in the application.
                </p>
              </CardFooter>
            </Card>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
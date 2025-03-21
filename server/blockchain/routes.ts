import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { generateMetadata, mintAIFollowerNFT, getAIFollowerMintingStatus } from './nft-service';

const router = Router();

/**
 * GET /api/nft/metadata/:followerId
 * Returns the metadata for an AI follower
 */
router.get('/metadata/:followerId', async (req: Request, res: Response) => {
  try {
    const followerId = parseInt(req.params.followerId);
    if (isNaN(followerId)) {
      return res.status(400).json({ error: 'Invalid follower ID' });
    }
    
    // Get the AI follower from the database
    const follower = await storage.getAiFollower(followerId);
    if (!follower) {
      return res.status(404).json({ error: 'AI Follower not found' });
    }
    
    // Generate metadata
    const { metadata } = generateMetadata(follower);
    
    res.json(metadata);
  } catch (error) {
    console.error('Error retrieving metadata:', error);
    res.status(500).json({ error: 'Failed to retrieve NFT metadata' });
  }
});

/**
 * GET /api/nft/status/:followerId
 * Returns the minting status for an AI follower
 */
router.get('/status/:followerId', async (req: Request, res: Response) => {
  try {
    const followerId = parseInt(req.params.followerId);
    if (isNaN(followerId)) {
      return res.status(400).json({ error: 'Invalid follower ID' });
    }
    
    // Get the AI follower from the database
    const follower = await storage.getAiFollower(followerId);
    if (!follower) {
      return res.status(404).json({ error: 'AI Follower not found' });
    }
    
    // Get minting status
    const status = await getAIFollowerMintingStatus(followerId);
    
    res.json(status);
  } catch (error) {
    console.error('Error checking NFT status:', error);
    res.status(500).json({ error: 'Failed to check NFT status' });
  }
});

/**
 * POST /api/nft/mint/:followerId
 * Mints an AI follower as an NFT
 */
router.post('/mint/:followerId', async (req: Request, res: Response) => {
  try {
    const followerId = parseInt(req.params.followerId);
    if (isNaN(followerId)) {
      return res.status(400).json({ error: 'Invalid follower ID' });
    }
    
    // Validate input
    const { ownerAddress } = req.body;
    if (!ownerAddress || typeof ownerAddress !== 'string') {
      return res.status(400).json({ error: 'Owner address is required' });
    }
    
    // Check if the address is valid
    if (!ownerAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({ error: 'Invalid Ethereum address format' });
    }
    
    // Get the AI follower from the database
    const follower = await storage.getAiFollower(followerId);
    if (!follower) {
      return res.status(404).json({ error: 'AI Follower not found' });
    }
    
    // The user should own this AI follower
    // Uncomment this check in production
    /*
    if (follower.userId !== req.user?.id) {
      return res.status(403).json({ error: 'You do not own this AI follower' });
    }
    */
    
    // Check current minting status
    const currentStatus = await getAIFollowerMintingStatus(followerId);
    if (currentStatus.status === 'MINTED') {
      return res.json(currentStatus);
    }
    
    // Mint the NFT
    const mintingResult = await mintAIFollowerNFT(follower, ownerAddress);
    
    res.json(mintingResult);
  } catch (error) {
    console.error('Error minting NFT:', error);
    res.status(500).json({ error: 'Failed to mint NFT' });
  }
});

// Export the router
export default router;
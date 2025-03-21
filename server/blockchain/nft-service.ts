import { AiFollower } from "@shared/schema";
import { getContractInstance } from "./contract-utils";
import fs from 'fs';
import path from 'path';

// In-memory storage for NFT status since we don't have database columns for this yet
// In a production app, this would be stored in the database
const mintingStatusMap = new Map<number, MintingDetails>();

export enum MintingStatus {
  NOT_MINTED = 'NOT_MINTED',
  PENDING = 'PENDING',
  MINTED = 'MINTED',
  FAILED = 'FAILED'
}

export interface MintingDetails {
  status: MintingStatus;
  tokenId?: number;
  transactionHash?: string;
  ownerAddress?: string;
  tokenURI?: string;
  error?: string;
}

/**
 * Generates metadata for an AI follower NFT
 * @param follower The AI follower to create metadata for
 * @returns The metadata object and URI
 */
export function generateMetadata(follower: AiFollower) {
  // Extract relevant attributes from the follower
  const attributes = [
    {
      trait_type: "Personality",
      value: follower.personality || "Unknown"
    },
    {
      trait_type: "Communication Style",
      value: follower.communicationStyle || "Casual"
    },
    {
      trait_type: "Responsiveness",
      value: follower.responsiveness || "Normal"
    }
  ];

  // Add interests as attributes if available
  if (follower.interests && follower.interests.length > 0) {
    attributes.push({
      trait_type: "Interests",
      value: follower.interests.join(", ")
    });
  }

  // Create the metadata
  const metadata = {
    name: `${follower.name}`,
    description: `${follower.name} is an AI Follower with ${follower.personality} personality.`,
    image: follower.avatarUrl || "https://i.imgur.com/Qwh8daR.png", // Use follower avatar or default
    external_url: `${process.env.BASE_URL || 'https://circletube.app'}/follower/${follower.id}`,
    attributes
  };

  // Generate a URI for the metadata
  const uri = `ipfs://QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn/${follower.id}`; // Placeholder IPFS URI

  return { metadata, uri };
}

/**
 * Stores metadata for an AI follower and returns the URI
 * @param followerId The ID of the AI follower
 * @param metadata The metadata object to store
 * @returns The metadata URI
 */
export async function storeMetadata(followerId: number, metadata: any): Promise<string> {
  try {
    // In a production app, this would upload to IPFS or another storage service
    // For now, we'll just store it locally
    const storagePath = path.resolve(__dirname, '../../public/metadata');
    
    // Create the directory if it doesn't exist
    if (!fs.existsSync(storagePath)) {
      fs.mkdirSync(storagePath, { recursive: true });
    }
    
    const filePath = path.join(storagePath, `${followerId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(metadata, null, 2));
    
    // Return a URI that points to this metadata
    // In production, this would be an IPFS or Arweave URI
    return `${process.env.BASE_URL || 'http://localhost:5000'}/metadata/${followerId}.json`;
  } catch (error) {
    console.error('Error storing metadata:', error);
    throw error;
  }
}

/**
 * Mints an AI follower as an NFT
 * @param follower The AI follower to mint
 * @param ownerAddress Ethereum address that will own the NFT
 * @returns Minting result with transaction details
 */
export async function mintAIFollowerNFT(follower: AiFollower, ownerAddress: string): Promise<MintingDetails> {
  try {
    // Check if we already have minting info for this follower
    const existingStatus = await getAIFollowerMintingStatus(follower.id);
    if (existingStatus.status === MintingStatus.MINTED) {
      return existingStatus;
    }
    
    // Generate metadata for the NFT
    const { metadata, uri } = generateMetadata(follower);
    
    // Set pending status while minting
    const pendingStatus: MintingDetails = {
      status: MintingStatus.PENDING,
      ownerAddress
    };
    mintingStatusMap.set(follower.id, pendingStatus);
    
    try {
      // Get the contract instance
      const contract = await getContractInstance();
      
      // Call the mint function on the contract
      const tx = await contract.mint(ownerAddress, follower.id, uri);
      const receipt = await tx.wait();
      
      // Update the minting status
      const mintedStatus: MintingDetails = {
        status: MintingStatus.MINTED,
        tokenId: follower.id,
        transactionHash: receipt.hash,
        ownerAddress,
        tokenURI: uri
      };
      mintingStatusMap.set(follower.id, mintedStatus);
      
      return mintedStatus;
    } catch (error) {
      console.error('Error minting NFT:', error);
      
      // Update status to failed
      const failedStatus: MintingDetails = {
        status: MintingStatus.FAILED,
        ownerAddress,
        error: error instanceof Error ? error.message : String(error)
      };
      mintingStatusMap.set(follower.id, failedStatus);
      
      return failedStatus;
    }
  } catch (error) {
    console.error('Error in mintAIFollowerNFT:', error);
    throw error;
  }
}

/**
 * Checks if an AI follower has been minted as an NFT
 * @param followerId The ID of the AI follower
 * @returns Minting status
 */
export async function getAIFollowerMintingStatus(followerId: number): Promise<MintingDetails> {
  try {
    // Check our in-memory map first
    if (mintingStatusMap.has(followerId)) {
      return mintingStatusMap.get(followerId)!;
    }
    
    // If not in our map, check the blockchain
    try {
      const contract = await getContractInstance();
      const exists = await contract.exists(followerId);
      
      if (exists) {
        const owner = await contract.ownerOf(followerId);
        const tokenURI = await contract.tokenURI(followerId);
        
        const mintingDetails: MintingDetails = {
          status: MintingStatus.MINTED,
          tokenId: followerId,
          ownerAddress: owner,
          tokenURI
        };
        
        // Cache the result
        mintingStatusMap.set(followerId, mintingDetails);
        
        return mintingDetails;
      }
    } catch (error) {
      console.log(`NFT ${followerId} not found on blockchain:`, error);
      // NFT doesn't exist on chain, which is normal
    }
    
    // If we get here, the NFT doesn't exist
    const notMinted: MintingDetails = {
      status: MintingStatus.NOT_MINTED
    };
    
    // Cache the result
    mintingStatusMap.set(followerId, notMinted);
    
    return notMinted;
  } catch (error) {
    console.error('Error checking NFT status:', error);
    throw error;
  }
}
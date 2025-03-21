import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { AIFollowerNFTAbi, AIFollowerNFTBytecode, predeployedContractAddress } from './contract-data';

dotenv.config();

// Contract deployment info
let deployedContractAddress: string | null = predeployedContractAddress || null;
let deployedContractAbi: any[] = AIFollowerNFTAbi;

// Use environment variables for network settings
const PROVIDER_URL = process.env.ETH_PROVIDER_URL || 'https://sepolia.base.org';
const PRIVATE_KEY = process.env.ETH_PRIVATE_KEY || '';

/**
 * Deploys a compiled smart contract to Base Sepolia
 * @returns Deployed contract address and ABI
 */
export async function deployContract() {
  try {
    // If we already have a deployed contract, return that info
    if (deployedContractAddress && deployedContractAbi) {
      console.log(`Using existing deployed contract at ${deployedContractAddress}`);
      return { address: deployedContractAddress, abi: deployedContractAbi };
    }
    
    // Check if we have the necessary environment variables
    if (!PRIVATE_KEY) {
      throw new Error('ETH_PRIVATE_KEY environment variable is required for contract deployment');
    }
    
    console.log(`Deploying AIFollowerNFT to ${PROVIDER_URL}...`);
    
    // Use the pre-compiled contract data
    const abi = AIFollowerNFTAbi;
    const bytecode = AIFollowerNFTBytecode;
    
    // Connect to the network
    const provider = new ethers.JsonRpcProvider(PROVIDER_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    // Create contract factory and deploy
    const factory = new ethers.ContractFactory(abi, bytecode, wallet);
    const contract = await factory.deploy();
    
    // Wait for deployment confirmation
    await contract.deploymentTransaction()?.wait();
    
    // Save the deployed contract info
    deployedContractAddress = await contract.getAddress();
    deployedContractAbi = abi;
    
    console.log(`Contract deployed to: ${deployedContractAddress}`);
    
    return { address: deployedContractAddress, abi };
  } catch (error) {
    console.error('Error deploying contract:', error);
    throw error;
  }
}

/**
 * Gets an instance of the deployed contract
 * @returns Contract instance
 */
export async function getContractInstance() {
  try {
    // If we don't have a deployed contract, deploy one
    if (!deployedContractAddress) {
      const { address } = await deployContract();
      deployedContractAddress = address;
    }
    
    // Connect to the provider
    const provider = new ethers.JsonRpcProvider(PROVIDER_URL);
    
    // If we have a private key, use it to get a signer
    if (PRIVATE_KEY) {
      const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
      return new ethers.Contract(deployedContractAddress, deployedContractAbi, wallet);
    }
    
    // Otherwise, just use the provider (read-only)
    return new ethers.Contract(deployedContractAddress, deployedContractAbi, provider);
  } catch (error) {
    console.error('Error getting contract instance:', error);
    throw error;
  }
}

/**
 * Set the deployed contract address (for use in development/testing)
 * @param address Contract address
 * @param abi Contract ABI
 */
export function setDeployedContract(address: string, abi: any[] = AIFollowerNFTAbi) {
  deployedContractAddress = address;
  deployedContractAbi = abi;
}
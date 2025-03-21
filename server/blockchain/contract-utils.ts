import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import solc from 'solc';
import dotenv from 'dotenv';

dotenv.config();

// Contract deployment info
let deployedContractAddress: string | null = null;
let deployedContractAbi: any[] | null = null;

// Use environment variables for network settings
const PROVIDER_URL = process.env.ETH_PROVIDER_URL || 'https://sepolia.base.org';
const PRIVATE_KEY = process.env.ETH_PRIVATE_KEY || '';

/**
 * Compiles a Solidity smart contract
 * @param contractFileName Name of the contract file without extension
 * @returns Compiled contract output
 */
export function compileContract(contractFileName: string) {
  try {
    // Read the Solidity source code directly from the project root
    const contractPath = path.resolve('./contracts', `${contractFileName}.sol`);
    console.log(`Reading contract from: ${contractPath}`);
    const sourceCode = fs.readFileSync(contractPath, 'utf8');
    
    // Prepare input for solc compiler
    const input = {
      language: 'Solidity',
      sources: {
        [`${contractFileName}.sol`]: {
          content: sourceCode
        }
      },
      settings: {
        outputSelection: {
          '*': {
            '*': ['*']
          }
        }
      }
    };
    
    // Compile the contract
    const compiledContract = JSON.parse(solc.compile(JSON.stringify(input)));
    
    // Check for compilation errors
    if (compiledContract.errors) {
      console.error('Compilation errors:', compiledContract.errors);
      throw new Error('Contract compilation failed');
    }
    
    // Return the compiled contract
    return compiledContract.contracts[`${contractFileName}.sol`][contractFileName];
  } catch (error) {
    console.error('Error compiling contract:', error);
    throw error;
  }
}

/**
 * Deploys a compiled smart contract to Base Sepolia
 * @param contractName Name of the contract file without extension
 * @returns Deployed contract address and ABI
 */
export async function deployContract(contractName: string = 'AIFollowerNFT') {
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
    
    console.log(`Deploying ${contractName} to ${PROVIDER_URL}...`);
    
    // Compile the contract
    const compiledContract = compileContract(contractName);
    const abi = compiledContract.abi;
    const bytecode = compiledContract.evm.bytecode.object;
    
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
    if (!deployedContractAddress || !deployedContractAbi) {
      const { address, abi } = await deployContract();
      deployedContractAddress = address;
      deployedContractAbi = abi;
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
export function setDeployedContract(address: string, abi: any[]) {
  deployedContractAddress = address;
  deployedContractAbi = abi;
}
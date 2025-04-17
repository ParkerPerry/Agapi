/**
 * Ethereum integration utilities
 * This file provides helper functions for working with Ethereum browser extensions
 * such as MetaMask in a safe way that avoids conflicts.
 */

/**
 * Safely gets the Ethereum provider from the window object
 * This handles the case where the window.ethereum property is already
 * defined with a getter, which can cause conflicts with browser extensions.
 * 
 * @returns The Ethereum provider or null if not available
 */
export function getEthereumProvider(): any | null {
  try {
    // Check if ethereum is already available on window
    if (typeof window !== 'undefined' && 'ethereum' in window) {
      return (window as any).ethereum;
    }
    
    return null;
  } catch (error) {
    console.error('Error accessing Ethereum provider:', error);
    return null;
  }
}

/**
 * Checks if MetaMask or another Ethereum wallet is installed
 * @returns True if a wallet is available
 */
export function isWalletInstalled(): boolean {
  return getEthereumProvider() !== null;
}

/**
 * Checks if the user is connected to an Ethereum wallet
 * @returns Promise resolving to true if connected
 */
export async function isWalletConnected(): Promise<boolean> {
  try {
    const ethereum = getEthereumProvider();
    if (!ethereum) return false;
    
    const accounts = await ethereum.request({ method: 'eth_accounts' });
    return accounts && accounts.length > 0;
  } catch (error) {
    console.error('Error checking wallet connection:', error);
    return false;
  }
}

/**
 * Requests the user to connect their Ethereum wallet
 * @returns Connected accounts or empty array if request failed
 */
export async function connectWallet(): Promise<string[]> {
  try {
    const ethereum = getEthereumProvider();
    if (!ethereum) {
      console.error('No Ethereum provider found');
      return [];
    }
    
    const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
    return accounts || [];
  } catch (error) {
    console.error('Error connecting wallet:', error);
    return [];
  }
}

/**
 * Gets the current Ethereum network ID
 * @returns Network ID or null if not available
 */
export async function getNetworkId(): Promise<string | null> {
  try {
    const ethereum = getEthereumProvider();
    if (!ethereum) return null;
    
    const chainId = await ethereum.request({ method: 'eth_chainId' });
    return chainId;
  } catch (error) {
    console.error('Error getting network ID:', error);
    return null;
  }
}
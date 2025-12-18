import { useState, useCallback, useEffect } from 'react';
import { BrowserProvider, Contract, toUtf8Bytes, toUtf8String } from 'ethers';

// Sepolia testnet configuration
const SEPOLIA_CHAIN_ID = '0xaa36a7'; // 11155111 in hex
const SEPOLIA_RPC_URL = 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY';

// Smart contract ABI (simplified)
const DIARY_ABI = [
  'function addEntry(bytes calldata encrypted) external',
  'function getCount(address user) external view returns (uint)',
  'function getEntry(address user, uint index) external view returns (bytes)',
  'event EntryAdded(address indexed user, uint indexed index, bytes encrypted)',
];

interface Web3State {
  provider: BrowserProvider | null;
  signer: any;
  account: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

interface UseWeb3Return extends Web3State {
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchToSepolia: () => Promise<void>;
  addDiaryEntry: (encryptedData: string, contractAddress: string) => Promise<string | null>;
  getDiaryCount: (contractAddress: string) => Promise<number>;
  getDiaryEntry: (contractAddress: string, index: number) => Promise<string | null>;
}

export function useWeb3(): UseWeb3Return {
  const [state, setState] = useState<Web3State>({
    provider: null,
    signer: null,
    account: null,
    isConnected: false,
    isConnecting: false,
    error: null,
  });

  // Check if wallet is already connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({
            method: 'eth_accounts',
          });
          if (accounts.length > 0) {
            const provider = new BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const address = await signer.getAddress();
            setState((prev) => ({
              ...prev,
              provider,
              signer,
              account: address,
              isConnected: true,
            }));
          }
        } catch (error) {
          console.error('Error checking wallet connection:', error);
        }
      }
    };

    checkConnection();
  }, []);

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      setState((prev) => ({
        ...prev,
        error: 'MetaMask is not installed. Please install it to continue.',
      }));
      return;
    }

    setState((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      // Initialize provider and signer
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      // Check if on Sepolia, if not, switch
      const network = await provider.getNetwork();
      if (network.chainId !== BigInt(11155111)) {
        await switchToSepolia();
      }

      setState((prev) => ({
        ...prev,
        provider,
        signer,
        account: address,
        isConnected: true,
        isConnecting: false,
      }));
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        error: error.message || 'Failed to connect wallet',
        isConnecting: false,
      }));
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setState({
      provider: null,
      signer: null,
      account: null,
      isConnected: false,
      isConnecting: false,
      error: null,
    });
  }, []);

  const switchToSepolia = useCallback(async () => {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_CHAIN_ID }],
      });
    } catch (error: any) {
      // If chain doesn't exist, add it
      if (error.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: SEPOLIA_CHAIN_ID,
              chainName: 'Sepolia Testnet',
              rpcUrls: ['https://sepolia.infura.io/v3/'],
              nativeCurrency: {
                name: 'Ethereum',
                symbol: 'ETH',
                decimals: 18,
              },
              blockExplorerUrls: ['https://sepolia.etherscan.io'],
            },
          ],
        });
      } else {
        throw error;
      }
    }
  }, []);

  const addDiaryEntry = useCallback(
    async (encryptedData: string, contractAddress: string): Promise<string | null> => {
      if (!state.signer || !state.provider) {
        setState((prev) => ({
          ...prev,
          error: 'Wallet not connected',
        }));
        return null;
      }

      try {
        const contract = new Contract(contractAddress, DIARY_ABI, state.signer);
        const encryptedBytes = toUtf8Bytes(encryptedData);
        const tx = await contract.addEntry(encryptedBytes);
        const receipt = await tx.wait();
        return receipt?.hash || null;
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          error: error.message || 'Failed to add diary entry',
        }));
        return null;
      }
    },
    [state.signer, state.provider]
  );

  const getDiaryCount = useCallback(
    async (contractAddress: string): Promise<number> => {
      if (!state.provider) {
        return 0;
      }

      try {
        const contract = new Contract(contractAddress, DIARY_ABI, state.provider);
        const count = await contract.getCount(state.account);
        return Number(count);
      } catch (error) {
        console.error('Error getting diary count:', error);
        return 0;
      }
    },
    [state.provider, state.account]
  );

  const getDiaryEntry = useCallback(
    async (contractAddress: string, index: number): Promise<string | null> => {
      if (!state.provider) {
        return null;
      }

      try {
        const contract = new Contract(contractAddress, DIARY_ABI, state.provider);
        const entry = await contract.getEntry(state.account, index);
        return toUtf8String(entry);
      } catch (error) {
        console.error('Error getting diary entry:', error);
        return null;
      }
    },
    [state.provider, state.account]
  );

  return {
    ...state,
    connectWallet,
    disconnectWallet,
    switchToSepolia,
    addDiaryEntry,
    getDiaryCount,
    getDiaryEntry,
  };
}

// Extend window interface for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
}

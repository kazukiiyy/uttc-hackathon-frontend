import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { BrowserProvider, Contract, formatEther, parseEther } from 'ethers';
import { MARKETPLACE_CONTRACT_ADDRESS, MARKETPLACE_ABI, jpyToWei, jpyToEthDisplay } from '../config/contract';

// サポートするネットワーク
const NETWORKS = {
  ethereum: {
    chainId: '0x1',
    chainName: 'Ethereum Mainnet',
    symbol: 'ETH',
    rpcUrls: ['https://mainnet.infura.io/v3/'],
    blockExplorerUrls: ['https://etherscan.io/'],
  },
  sepolia: {
    chainId: '0xaa36a7',
    chainName: 'Sepolia Testnet',
    symbol: 'ETH',
    rpcUrls: ['https://sepolia.infura.io/v3/'],
    blockExplorerUrls: ['https://sepolia.etherscan.io/'],
  },
  polygon: {
    chainId: '0x89',
    chainName: 'Polygon Mainnet',
    symbol: 'MATIC',
    rpcUrls: ['https://polygon-rpc.com/'],
    blockExplorerUrls: ['https://polygonscan.com/'],
  },
  mumbai: {
    chainId: '0x13881',
    chainName: 'Polygon Mumbai',
    symbol: 'MATIC',
    rpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
    blockExplorerUrls: ['https://mumbai.polygonscan.com/'],
  },
} as const;

type NetworkKey = keyof typeof NETWORKS;

// 出品用パラメータ
interface ListItemParams {
  title: string;
  priceJpy: number;
  explanation: string;
  imageUrl: string;
  uid: string;
  category: string;
  tokenURI: string;
}

// 購入用パラメータ
interface BuyItemParams {
  itemId: number;
  priceWei: bigint;
}

interface WalletContextType {
  address: string | null;
  balance: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  chainId: string | null;
  networkName: string | null;
  networkSymbol: string | null;
  isSepoliaNetwork: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: (network: NetworkKey) => Promise<void>;
  sendTransaction: (to: string, amountEth: string) => Promise<string>;
  // スマートコントラクト操作
  listItem: (params: ListItemParams) => Promise<{ txHash: string; itemId: number }>;
  buyItem: (params: BuyItemParams) => Promise<string>;
  confirmReceipt: (itemId: number) => Promise<string>;
  cancelListing: (itemId: number) => Promise<string>;
  // ユーティリティ
  jpyToEthDisplay: (jpyPrice: number) => string;
  jpyToWei: (jpyPrice: number) => bigint;
  availableNetworks: typeof NETWORKS;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

// チェーンIDからネットワーク情報を取得
const getNetworkInfo = (chainId: string | null) => {
  if (!chainId) return { name: null, symbol: null };

  const network = Object.values(NETWORKS).find(n => n.chainId.toLowerCase() === chainId.toLowerCase());
  if (network) {
    return { name: network.chainName, symbol: network.symbol };
  }

  return { name: `Unknown (${chainId})`, symbol: '???' };
};

export const WalletProvider = ({ children }: WalletProviderProps) => {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [chainId, setChainId] = useState<string | null>(null);

  const isConnected = !!address;
  const { name: networkName, symbol: networkSymbol } = getNetworkInfo(chainId);
  const isSepoliaNetwork = chainId?.toLowerCase() === NETWORKS.sepolia.chainId.toLowerCase();

  // 残高を取得
  const fetchBalance = useCallback(async (addr: string) => {
    if (!window.ethereum) return;
    try {
      const provider = new BrowserProvider(window.ethereum);
      const bal = await provider.getBalance(addr);
      setBalance(formatEther(bal));
    } catch (error) {
      console.error('残高取得エラー:', error);
    }
  }, []);

  // コントラクトインスタンスを取得
  const getContract = async (withSigner = false) => {
    if (!window.ethereum) throw new Error('MetaMaskがインストールされていません');

    const provider = new BrowserProvider(window.ethereum);

    if (withSigner) {
      const signer = await provider.getSigner();
      return new Contract(MARKETPLACE_CONTRACT_ADDRESS, MARKETPLACE_ABI, signer);
    }

    return new Contract(MARKETPLACE_CONTRACT_ADDRESS, MARKETPLACE_ABI, provider);
  };

  // ウォレット接続
  const connect = async () => {
    if (!window.ethereum) {
      alert('MetaMaskがインストールされていません。\nhttps://metamask.io からインストールしてください。');
      return;
    }

    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      }) as string[];

      if (accounts.length > 0) {
        const addr = accounts[0];
        setAddress(addr);
        await fetchBalance(addr);

        const chainIdHex = await window.ethereum.request({
          method: 'eth_chainId'
        }) as string;
        setChainId(chainIdHex);

        localStorage.setItem('walletConnected', 'true');
      } else {
        alert('MetaMaskでアカウントを選択して接続を許可してください');
      }
    } catch (error: any) {
      if (error.code === 4001) {
        // ユーザーが拒否
      } else {
        console.error('ウォレット接続エラー:', error);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  // 切断
  const disconnect = () => {
    setAddress(null);
    setBalance(null);
    setChainId(null);
    localStorage.removeItem('walletConnected');
  };

  // ネットワーク切り替え
  const switchNetwork = async (network: NetworkKey) => {
    if (!window.ethereum) return;

    const networkConfig = NETWORKS[network];

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: networkConfig.chainId }],
      });
    } catch (error: any) {
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: networkConfig.chainId,
              chainName: networkConfig.chainName,
              nativeCurrency: {
                name: networkConfig.symbol,
                symbol: networkConfig.symbol,
                decimals: 18,
              },
              rpcUrls: networkConfig.rpcUrls,
              blockExplorerUrls: networkConfig.blockExplorerUrls,
            }],
          });
        } catch (addError) {
          console.error('ネットワーク追加エラー:', addError);
        }
      } else {
        console.error('ネットワーク切り替えエラー:', error);
      }
    }
  };

  // ETH送金
  const sendTransaction = async (to: string, amountEth: string): Promise<string> => {
    if (!window.ethereum || !address) {
      throw new Error('ウォレットが接続されていません');
    }

    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    const tx = await signer.sendTransaction({
      to,
      value: parseEther(amountEth),
    });

    await tx.wait();
    await fetchBalance(address);

    return tx.hash;
  };

  // ==========================================
  // スマートコントラクト操作
  // ==========================================

  // 商品を出品
  const listItem = async (params: ListItemParams): Promise<{ txHash: string; itemId: number }> => {
    if (!address) throw new Error('ウォレットが接続されていません');
    if (!isSepoliaNetwork) throw new Error('Sepoliaネットワークに切り替えてください');

    const contract = await getContract(true);
    const priceWei = jpyToWei(params.priceJpy);

    const tx = await contract.listItem(
      params.title,
      priceWei,
      params.explanation,
      params.imageUrl,
      params.uid,
      params.category,
      params.tokenURI
    );

    const receipt = await tx.wait();

    // イベントからitemIdを取得
    let itemId = 0;
    for (const log of receipt.logs) {
      try {
        const parsed = contract.interface.parseLog({
          topics: log.topics as string[],
          data: log.data,
        });
        if (parsed?.name === 'ItemListed') {
          itemId = Number(parsed.args.itemId);
          break;
        }
      } catch {
        // パースできないログはスキップ
      }
    }

    await fetchBalance(address);
    return { txHash: tx.hash, itemId };
  };

  // 商品を購入
  const buyItem = async (params: BuyItemParams): Promise<string> => {
    if (!address) throw new Error('ウォレットが接続されていません');
    if (!isSepoliaNetwork) throw new Error('Sepoliaネットワークに切り替えてください');

    const contract = await getContract(true);

    const tx = await contract.buyItem(params.itemId, {
      value: params.priceWei,
    });

    await tx.wait();
    await fetchBalance(address);

    return tx.hash;
  };

  // 受け取り確認
  const confirmReceipt = async (itemId: number): Promise<string> => {
    if (!address) throw new Error('ウォレットが接続されていません');
    if (!isSepoliaNetwork) throw new Error('Sepoliaネットワークに切り替えてください');

    const contract = await getContract(true);
    const tx = await contract.confirmReceipt(itemId);
    await tx.wait();
    await fetchBalance(address);

    return tx.hash;
  };

  // 出品キャンセル
  const cancelListing = async (itemId: number): Promise<string> => {
    if (!address) throw new Error('ウォレットが接続されていません');
    if (!isSepoliaNetwork) throw new Error('Sepoliaネットワークに切り替えてください');

    const contract = await getContract(true);
    const tx = await contract.cancelListing(itemId);
    await tx.wait();
    await fetchBalance(address);

    return tx.hash;
  };

  // アカウント変更を監視
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setAddress(accounts[0]);
        fetchBalance(accounts[0]);
      }
    };

    const handleChainChanged = (newChainId: string) => {
      setChainId(newChainId);
      if (address) {
        fetchBalance(address);
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, [address, fetchBalance]);

  // 自動再接続
  useEffect(() => {
    const autoConnect = async () => {
      if (localStorage.getItem('walletConnected') === 'true' && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({
            method: 'eth_accounts'
          }) as string[];

          if (accounts.length > 0) {
            const addr = accounts[0];
            setAddress(addr);
            await fetchBalance(addr);

            const chainIdHex = await window.ethereum.request({
              method: 'eth_chainId'
            }) as string;
            setChainId(chainIdHex);
          }
        } catch (error) {
          console.error('自動接続エラー:', error);
        }
      }
    };

    autoConnect();
  }, [fetchBalance]);

  return (
    <WalletContext.Provider value={{
      address,
      balance,
      isConnected,
      isConnecting,
      chainId,
      networkName,
      networkSymbol,
      isSepoliaNetwork,
      connect,
      disconnect,
      switchNetwork,
      sendTransaction,
      // スマートコントラクト操作
      listItem,
      buyItem,
      confirmReceipt,
      cancelListing,
      // ユーティリティ
      jpyToEthDisplay,
      jpyToWei,
      availableNetworks: NETWORKS,
    }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

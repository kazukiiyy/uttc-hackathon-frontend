import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { BrowserProvider, Contract, formatEther, parseEther, getAddress } from 'ethers';
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
  getItem: (itemId: number) => Promise<any>;
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

  const checkMetaMask = (): boolean => {
    return typeof window !== 'undefined' && !!window.ethereum?.isMetaMask;
  };

  const fetchBalance = useCallback(async (addr: string) => {
    if (!checkMetaMask()) return;
    try {
      const provider = new BrowserProvider(window.ethereum!);
      setBalance(formatEther(await provider.getBalance(addr)));
    } catch (error) {
      console.error('残高取得エラー:', error);
    }
  }, []);

  const getContract = async (withSigner = false) => {
    if (!checkMetaMask()) throw new Error('MetaMaskがインストールされていません');
    const provider = new BrowserProvider(window.ethereum!);
    if (withSigner) {
      return new Contract(MARKETPLACE_CONTRACT_ADDRESS, MARKETPLACE_ABI, await provider.getSigner());
    }
    return new Contract(MARKETPLACE_CONTRACT_ADDRESS, MARKETPLACE_ABI, provider);
  };

  const connect = async () => {
    if (!checkMetaMask()) {
      alert('MetaMaskがインストールされていません。\nhttps://metamask.io からインストールしてください。');
      return;
    }

    setIsConnecting(true);
    try {
      const accounts = await window.ethereum!.request({ method: 'eth_requestAccounts' }) as string[];
      if (!accounts?.length) {
        alert('MetaMaskでアカウントを選択して接続を許可してください');
        return;
      }

      const addr = accounts[0];
      setAddress(addr);
      await fetchBalance(addr);
      const chainIdHex = await window.ethereum!.request({ method: 'eth_chainId' }) as string;
      setChainId(chainIdHex);
      localStorage.setItem('walletConnected', 'true');
    } catch (error: any) {
      if (error.code === 4001) {
        // ユーザーが拒否
      } else if (error.code === -32002) {
        alert('既に接続リクエストが進行中です。\nMetaMaskを確認してください。');
      } else {
        console.error('ウォレット接続エラー:', error);
        alert(`接続エラー: ${error.message || '不明なエラー'}`);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = useCallback(() => {
    setAddress(null);
    setBalance(null);
    setChainId(null);
    localStorage.removeItem('walletConnected');
  }, []);

  const switchNetwork = async (network: NetworkKey) => {
    if (!checkMetaMask()) return;
    const config = NETWORKS[network];
    try {
      await window.ethereum!.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: config.chainId }],
      });
    } catch (error: any) {
      if (error.code === 4902) {
        await window.ethereum!.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: config.chainId,
            chainName: config.chainName,
            nativeCurrency: { name: config.symbol, symbol: config.symbol, decimals: 18 },
            rpcUrls: config.rpcUrls,
            blockExplorerUrls: config.blockExplorerUrls,
          }],
        });
      } else {
        console.error('ネットワーク切り替えエラー:', error);
      }
    }
  };

  const sendTransaction = async (to: string, amountEth: string): Promise<string> => {
    if (!checkMetaMask() || !address) throw new Error('ウォレットが接続されていません');
    const provider = new BrowserProvider(window.ethereum!);
    const tx = await (await provider.getSigner()).sendTransaction({ to, value: parseEther(amountEth) });
    await tx.wait();
    await fetchBalance(address);
    return tx.hash;
  };

  const listItem = async (params: ListItemParams): Promise<{ txHash: string; itemId: number }> => {
    if (!address) throw new Error('ウォレットが接続されていません');
    if (!isSepoliaNetwork) throw new Error('Sepoliaネットワークに切り替えてください');

    const contract = await getContract(true);
    const tx = await contract.listItem(params.title, jpyToWei(params.priceJpy), params.explanation, params.imageUrl, params.uid, params.category, params.tokenURI);
    const receipt = await tx.wait();

    let itemId = 0;
    for (const log of receipt.logs) {
      try {
        const parsed = contract.interface.parseLog({ topics: log.topics as string[], data: log.data });
        if (parsed?.name === 'ItemListed') {
          itemId = Number(parsed.args.itemId);
          break;
        }
      } catch {}
    }

    await fetchBalance(address);
    return { txHash: tx.hash, itemId };
  };

  const getItem = async (itemId: number) => {
    if (!isSepoliaNetwork) throw new Error('Sepoliaネットワークに切り替えてください');
    const contract = await getContract(false);
    return await contract.getItem(itemId);
  };

  const buyItem = async (params: BuyItemParams): Promise<string> => {
    if (!address) throw new Error('ウォレットが接続されていません');
    if (!isSepoliaNetwork) throw new Error('Sepoliaネットワークに切り替えてください');

    try {
      const contract = await getContract(true);
      
      // コントラクト側で出品者チェックが行われるため、ここではチェックしない
      // エラーメッセージを適切に処理する
      const tx = await contract.buyItem(params.itemId, { value: params.priceWei });
      await tx.wait();
      await fetchBalance(address);
      return tx.hash;
    } catch (error: any) {
      // ユーザーがトランザクションを拒否した場合
      if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
        throw new Error('トランザクションがキャンセルされました');
      }
      
      // MetaMaskのエラーメッセージを取得
      // ethers.js v6では、エラーメッセージが複数の場所に存在する可能性がある
      let errorMessage = '購入処理中にエラーが発生しました';
      
      // エラーメッセージの取得を試みる（複数のパターンをチェック）
      if (error.reason) {
        errorMessage = error.reason;
      } else if (error.shortMessage) {
        errorMessage = error.shortMessage;
      } else if (error.data?.message) {
        errorMessage = error.data.message;
      } else if (error.message) {
        // MetaMaskのエラーメッセージを抽出
        // "execution reverted: Seller cannot buy their own item." のような形式
        const match = error.message.match(/execution reverted:?\s*(.+?)(?:\.|$)/i);
        if (match && match[1]) {
          errorMessage = match[1].trim();
        } else if (!error.message.includes('missing revert data')) {
          errorMessage = error.message;
        }
      }
      
      // よくあるエラーメッセージを日本語化
      if (errorMessage.includes('Seller cannot buy their own item')) {
        errorMessage = '出品者は自分の商品を購入できません';
      } else if (errorMessage.includes('Insufficient payment') || errorMessage.includes('insufficient funds')) {
        errorMessage = '残高が不足しています';
      } else if (errorMessage.includes('Item is not available for purchase')) {
        errorMessage = 'この商品は購入できません（既に購入済み、キャンセル済み、または完了済みです）';
      } else if (errorMessage.includes('Item is not available') || errorMessage.includes('Item does not exist')) {
        errorMessage = 'この商品は購入できません（既に購入済みまたは存在しません）';
      }
      
      throw new Error(errorMessage);
    }
  };

  const confirmReceipt = async (itemId: number): Promise<string> => {
    if (!address) throw new Error('ウォレットが接続されていません');
    if (!isSepoliaNetwork) throw new Error('Sepoliaネットワークに切り替えてください');
    const contract = await getContract(true);
    const tx = await contract.confirmReceipt(itemId);
    await tx.wait();
    await fetchBalance(address);
    return tx.hash;
  };

  const cancelListing = async (itemId: number): Promise<string> => {
    if (!address) throw new Error('ウォレットが接続されていません');
    if (!isSepoliaNetwork) throw new Error('Sepoliaネットワークに切り替えてください');
    const contract = await getContract(true);
    const tx = await contract.cancelListing(itemId);
    await tx.wait();
    await fetchBalance(address);
    return tx.hash;
  };

  useEffect(() => {
    if (!checkMetaMask()) return;

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
      if (address) fetchBalance(address);
    };

    window.ethereum!.on('accountsChanged', handleAccountsChanged);
    window.ethereum!.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, [address, fetchBalance, disconnect]);

  useEffect(() => {
    const autoConnect = async () => {
      if (localStorage.getItem('walletConnected') !== 'true' || !checkMetaMask()) return;
      try {
        const accounts = await window.ethereum!.request({ method: 'eth_accounts' }) as string[];
        if (accounts?.length) {
          const addr = accounts[0];
          setAddress(addr);
          await fetchBalance(addr);
          setChainId(await window.ethereum!.request({ method: 'eth_chainId' }) as string);
        } else {
          localStorage.removeItem('walletConnected');
        }
      } catch (error) {
        console.error('自動接続エラー:', error);
        localStorage.removeItem('walletConnected');
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
      getItem,
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

interface Window {
  ethereum?: {
    isMetaMask?: boolean;
    request: (args: { method: string; params?: any[] }) => Promise<any>;
    on: (event: string, callback: (...args: any[]) => void) => void;
    removeListener: (event: string, callback: (...args: any[]) => void) => void;
    removeAllListeners?: (event?: string) => void;
    selectedAddress?: string | null;
    chainId?: string;
    isConnected?: () => boolean;
    _metamask?: {
      isUnlocked?: () => Promise<boolean>;
    };
  };
}

// FrimaMarketplace コントラクト設定

// Sepolia testnetにデプロイ済みコントラクトアドレス
export const MARKETPLACE_CONTRACT_ADDRESS = process.env.REACT_APP_MARKETPLACE_CONTRACT_ADDRESS || '0xA9bde62a88EFb45DfEd198349dCAEd9BE4743aB1';

// 価格レート: 1円 = 0.000001 ETH (Sepolia用に少なめ)
// 例: 1000円 = 0.001 ETH
export const JPY_TO_ETH_RATE = 0.000001;

// 円からWeiに変換
export const jpyToWei = (jpyPrice: number): bigint => {
  const ethAmount = jpyPrice * JPY_TO_ETH_RATE;
  // ETHをWeiに変換 (1 ETH = 10^18 Wei)
  return BigInt(Math.floor(ethAmount * 1e18));
};

// Weiから円に変換
export const weiToJpy = (wei: bigint): number => {
  const ethAmount = Number(wei) / 1e18;
  return Math.floor(ethAmount / JPY_TO_ETH_RATE);
};

// ETH表示用にフォーマット
export const jpyToEthDisplay = (jpyPrice: number): string => {
  const ethAmount = jpyPrice * JPY_TO_ETH_RATE;
  return ethAmount.toFixed(6);
};

// コントラクトABI (必要な関数のみ)
export const MARKETPLACE_ABI = [
  // listItem - 商品出品
  {
    inputs: [
      { internalType: 'string', name: '_title', type: 'string' },
      { internalType: 'uint256', name: '_price', type: 'uint256' },
      { internalType: 'string', name: '_explanation', type: 'string' },
      { internalType: 'string', name: '_imageUrl', type: 'string' },
      { internalType: 'string', name: '_uid', type: 'string' },
      { internalType: 'string', name: '_category', type: 'string' },
      { internalType: 'string', name: '_tokenURI', type: 'string' },
    ],
    name: 'listItem',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // buyItem - 商品購入
  {
    inputs: [{ internalType: 'uint256', name: '_itemId', type: 'uint256' }],
    name: 'buyItem',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  // confirmReceipt - 受け取り確認
  {
    inputs: [{ internalType: 'uint256', name: '_itemId', type: 'uint256' }],
    name: 'confirmReceipt',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // updateItem - 商品更新
  {
    inputs: [
      { internalType: 'uint256', name: '_itemId', type: 'uint256' },
      { internalType: 'string', name: '_title', type: 'string' },
      { internalType: 'uint256', name: '_price', type: 'uint256' },
      { internalType: 'string', name: '_explanation', type: 'string' },
      { internalType: 'string', name: '_imageUrl', type: 'string' },
      { internalType: 'string', name: '_category', type: 'string' },
    ],
    name: 'updateItem',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // cancelListing - 出品キャンセル
  {
    inputs: [{ internalType: 'uint256', name: '_itemId', type: 'uint256' }],
    name: 'cancelListing',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // getItem - 商品情報取得
  {
    inputs: [{ internalType: 'uint256', name: '_itemId', type: 'uint256' }],
    name: 'getItem',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'itemId', type: 'uint256' },
          { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
          { internalType: 'string', name: 'title', type: 'string' },
          { internalType: 'uint256', name: 'price', type: 'uint256' },
          { internalType: 'string', name: 'explanation', type: 'string' },
          { internalType: 'string', name: 'imageUrl', type: 'string' },
          { internalType: 'string', name: 'uid', type: 'string' },
          { internalType: 'uint256', name: 'createdAt', type: 'uint256' },
          { internalType: 'uint256', name: 'updatedAt', type: 'uint256' },
          { internalType: 'bool', name: 'isPurchased', type: 'bool' },
          { internalType: 'string', name: 'category', type: 'string' },
          { internalType: 'address', name: 'seller', type: 'address' },
          { internalType: 'address', name: 'buyer', type: 'address' },
          { internalType: 'uint8', name: 'status', type: 'uint8' },
        ],
        internalType: 'struct FrimaMarketplace.Item',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'itemId', type: 'uint256' },
      { indexed: true, internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      { indexed: true, internalType: 'address', name: 'seller', type: 'address' },
      { indexed: false, internalType: 'string', name: 'title', type: 'string' },
      { indexed: false, internalType: 'uint256', name: 'price', type: 'uint256' },
      { indexed: false, internalType: 'string', name: 'explanation', type: 'string' },
      { indexed: false, internalType: 'string', name: 'imageUrl', type: 'string' },
      { indexed: false, internalType: 'string', name: 'uid', type: 'string' },
      { indexed: false, internalType: 'uint256', name: 'createdAt', type: 'uint256' },
      { indexed: false, internalType: 'string', name: 'category', type: 'string' },
    ],
    name: 'ItemListed',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'itemId', type: 'uint256' },
      { indexed: true, internalType: 'address', name: 'buyer', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'price', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'tokenId', type: 'uint256' },
    ],
    name: 'ItemPurchased',
    type: 'event',
  },
] as const;

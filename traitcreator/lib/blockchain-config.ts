// Blockchain Configuration
export const BLOCKCHAIN_CONFIG = {
  // Contract Addresses
  ADRIAN_SIMPLE_SAVE: '0x8e439e92f3a884716b39294248b0a47f645f0854',
  ADRIAN_TOKEN: '0x7E99075Ce287F1cF8cBCAaa6A1C7894e404fD7Ea',
  
  // Network Configuration
  NETWORK: {
    chainId: '0x1', // Ethereum Mainnet
    chainName: 'Ethereum Mainnet',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: ['https://ethereum.publicnode.com'],
    blockExplorerUrls: ['https://etherscan.io'],
  },
  
  // Contract ABIs
  ADRIAN_SIMPLE_SAVE_ABI: require('../contracts/AdrianSimpleSave.json'),
  ADRIAN_TOKEN_ABI: require('../contracts/AdrianToken.json'),
}

// Helper functions
export const formatTokenAmount = (amount: bigint, decimals: number = 18): string => {
  const divisor = BigInt(10 ** decimals)
  const whole = amount / divisor
  const fraction = amount % divisor
  
  if (fraction === BigInt(0)) {
    return whole.toString()
  }
  
  const fractionStr = fraction.toString().padStart(decimals, '0')
  const trimmedFraction = fractionStr.replace(/0+$/, '')
  
  return `${whole}.${trimmedFraction}`
}

export const parseTokenAmount = (amount: string, decimals: number = 18): bigint => {
  const [whole, fraction = ''] = amount.split('.')
  const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals)
  return BigInt(whole + paddedFraction)
}

export const shortenAddress = (address: string): string => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
} 
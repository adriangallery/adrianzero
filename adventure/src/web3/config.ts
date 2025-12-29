/**
 * Configuración centralizada de blockchain para AdrianAdventure
 * 
 * Este módulo centraliza todas las configuraciones relacionadas con blockchain:
 * - Direcciones de contratos
 * - Configuración de red
 * - API keys de Alchemy
 * - ABIs mínimos necesarios
 */

export interface NetworkConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  explorer: string;
}

export interface ContractAddresses {
  ERC721: string;      // AdrianZERO
  ERC1155: string;     // AdrianLAB
  ERC20?: string;      // $ADRIAN Token (opcional)
  [key: string]: string | undefined;
}

export class BlockchainConfig {
  // Contratos principales
  public readonly CONTRACTS: ContractAddresses = {
    ERC721: "0x6e369bf0e4e0c106192d606fb6d85836d684da75", // AdrianZERO
    ERC1155: "0x90546848474fb3c9fda3fdad887969bb244e7e58", // AdrianLAB
    ERC20: "0x7E99075Ce287F1cF8cBCAaa6A1C7894e404fD7Ea" // $ADRIAN Token
  };

  // Configuración de red (Base Mainnet)
  public readonly NETWORK: NetworkConfig = {
    name: "Base Mainnet",
    chainId: 8453,
    rpcUrl: "https://mainnet.base.org",
    explorer: "https://basescan.org"
  };

  // API keys de Alchemy - solo primary key desde secrets
  // Se cargan desde config-keys.js (generado por GitHub Actions)
  private _alchemyApiKeys: string[] = [];
  private _alchemyBaseUrl = "https://base-mainnet.g.alchemy.com/nft/v3";
  private _alchemyRpcUrl = "https://base-mainnet.g.alchemy.com/v2";

  // RPC providers (sin key hardcodeada)
  public readonly RPC_PROVIDERS: string[] = [
    "https://mainnet.base.org",
    "https://base.llamarpc.com",
    "https://base-rpc.publicnode.com"
  ];

  // ABIs mínimos necesarios
  public readonly ERC721_ABI = [
    "function tokenURI(uint256 tokenId) view returns (string)",
    "function ownerOf(uint256 tokenId) view returns (address)",
    "function balanceOf(address owner) view returns (uint256)",
    "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
    "function totalSupply() view returns (uint256)"
  ];

  public readonly ERC1155_ABI = [
    "function uri(uint256 tokenId) view returns (string)",
    "function balanceOf(address account, uint256 id) view returns (uint256)",
    "function balanceOfBatch(address[] accounts, uint256[] ids) view returns (uint256[])"
  ];

  public readonly ERC20_ABI = [
    "function balanceOf(address account) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function decimals() view returns (uint8)"
  ];

  constructor() {
    // Cargar API keys desde config externa si está disponible
    this.loadAlchemyKeysFromConfig();
  }

  /**
   * Cargar API keys de Alchemy desde configuración externa
   * Busca en window.ALCHEMY_KEYS_CONFIG o variables de entorno
   */
  private loadAlchemyKeysFromConfig(): void {
    try {
      // Intentar cargar desde window (config-keys.js generado por CI/CD)
      if (typeof window !== 'undefined' && (window as any).ALCHEMY_KEYS_CONFIG) {
        const config = (window as any).ALCHEMY_KEYS_CONFIG;
        this._alchemyApiKeys = [];
        
        if (config.primary) {
          this._alchemyApiKeys.push(config.primary);
        }
        // NO agregar fallbacks - solo usar primary key
        
        console.log('✅ BlockchainConfig: API keys cargadas desde config externa');
      } else {
        console.log('⚠️ BlockchainConfig: Usando API keys de fallback');
      }
    } catch (error) {
      console.warn('⚠️ BlockchainConfig: Error cargando config externa:', error);
    }
  }

  /**
   * Obtener todas las API keys de Alchemy disponibles
   */
  public getAllAlchemyApiKeys(): string[] {
    return [...this._alchemyApiKeys];
  }

  /**
   * Obtener API key primaria de Alchemy
   */
  public getPrimaryAlchemyApiKey(): string | null {
    return this._alchemyApiKeys[0] || null;
  }

  /**
   * Obtener API key por índice (para fallback)
   */
  public getAlchemyApiKey(index: number = 0): string | null {
    if (index >= 0 && index < this._alchemyApiKeys.length) {
      return this._alchemyApiKeys[index];
    }
    return this._alchemyApiKeys[0] || null;
  }

  /**
   * Obtener URL base de Alchemy NFT API
   */
  public getAlchemyBaseUrl(): string {
    return this._alchemyBaseUrl;
  }

  /**
   * Obtener URL de RPC de Alchemy
   */
  public getAlchemyRpcUrl(): string {
    return this._alchemyRpcUrl;
  }

  /**
   * Obtener dirección de contrato por tipo
   */
  public getContractAddress(type: keyof ContractAddresses): string | undefined {
    return this.CONTRACTS[type];
  }

  /**
   * Obtener configuración de red
   */
  public getNetwork(): NetworkConfig {
    return this.NETWORK;
  }

  /**
   * Verificar si una dirección es un contrato válido
   */
  public isValidContractAddress(address: string, type?: keyof ContractAddresses): boolean {
    if (!address || !address.startsWith('0x') || address.length !== 42) {
      return false;
    }
    
    if (type) {
      return this.CONTRACTS[type]?.toLowerCase() === address.toLowerCase();
    }
    
    return Object.values(this.CONTRACTS).some(addr => 
      addr?.toLowerCase() === address.toLowerCase()
    );
  }
}

// Instancia singleton
let configInstance: BlockchainConfig | null = null;

/**
 * Obtener instancia singleton de configuración
 */
export function getBlockchainConfig(): BlockchainConfig {
  if (!configInstance) {
    configInstance = new BlockchainConfig();
  }
  return configInstance;
}

// Exportar instancia por defecto para compatibilidad
export default getBlockchainConfig();




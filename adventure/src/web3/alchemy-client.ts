/**
 * Cliente de Alchemy con fallback automático de API keys
 * 
 * Este módulo proporciona una interfaz unificada para interactuar con la API de Alchemy,
 * incluyendo manejo de rate limiting, fallback de API keys, y retry con exponential backoff.
 */

import { getBlockchainConfig } from './config';

export interface AlchemyNFTResponse {
  ownedNfts?: AlchemyNFT[];
  nfts?: AlchemyNFT[];
  pageKey?: string;
  totalCount?: number;
}

export interface AlchemyNFT {
  contract: {
    address: string;
    name?: string;
  };
  id: {
    tokenId: string;
    tokenMetadata?: {
      tokenType: string;
    };
  };
  title?: string;
  name?: string;
  description?: string;
  tokenUri?: {
    raw: string;
    gateway: string;
  };
  media?: Array<{
    gateway?: string;
    raw?: string;
    thumbnail?: string;
    format?: string;
  }>;
  metadata?: {
    name?: string;
    description?: string;
    image?: string;
    image_url?: string;
    imageUrl?: string;
    imageURI?: string;
    image_uri?: string;
    imageData?: string;
    attributes?: Array<{
      trait_type: string;
      value: string | number;
    }>;
  };
  raw?: {
    metadata?: {
      image?: string;
      [key: string]: any;
    };
  };
  tokenType?: string;
  balance?: string;
}

export interface FetchOptions {
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
}

export class AlchemyClient {
  private config = getBlockchainConfig();
  private rateLimiter: RateLimiter;

  constructor(maxRequestsPerSecond: number = 25) {
    this.rateLimiter = new RateLimiter(maxRequestsPerSecond, 1000);
  }

  /**
   * Fetch con fallback secuencial de API keys
   * Intenta con cada API key hasta que una funcione
   */
  async fetchWithFallback(
    urlTemplate: string,
    options: FetchOptions = {}
  ): Promise<Response> {
    const apiKeys = this.config.getAllAlchemyApiKeys();
    const maxRetriesPerKey = options.maxRetries || 3;
    const timeout = options.timeout || 15000;

    for (let keyIndex = 0; keyIndex < apiKeys.length; keyIndex++) {
      const apiKey = apiKeys[keyIndex];
      
      for (let attempt = 0; attempt < maxRetriesPerKey; attempt++) {
        try {
          // Esperar slot en rate limiter
          await this.rateLimiter.waitForSlot();

          // Reemplazar {API_KEY} en la URL
          const url = urlTemplate.replace('{API_KEY}', apiKey);

          // Crear AbortController para timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeout);

          try {
            const response = await fetch(url, {
              signal: controller.signal,
              headers: {
                'Content-Type': 'application/json',
              }
            });

            clearTimeout(timeoutId);

            if (response.ok) {
              return response;
            }

            // Si es 429 (rate limit), esperar y reintentar
            if (response.status === 429) {
              const retryAfter = response.headers.get('Retry-After');
              const delay = retryAfter 
                ? parseInt(retryAfter) * 1000 
                : (options.retryDelay || 1000) * Math.pow(2, attempt);
              
              console.warn(`⚠️ Rate limit (429) en API key ${keyIndex + 1}, esperando ${delay}ms...`);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }

            // Si es otro error, lanzar excepción
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          } catch (error: any) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
              throw new Error(`Timeout después de ${timeout}ms`);
            }
            
            throw error;
          }
        } catch (error: any) {
          const isLastAttempt = attempt === maxRetriesPerKey - 1;
          const isLastKey = keyIndex === apiKeys.length - 1;

          if (isLastAttempt && isLastKey) {
            throw new Error(
              `Todas las API keys de Alchemy fallaron. Último error: ${error.message}`
            );
          }

          if (isLastAttempt) {
            console.warn(`⚠️ API key ${keyIndex + 1} falló después de ${maxRetriesPerKey} intentos, probando siguiente...`);
            break; // Probar siguiente API key
          }

          // Exponential backoff
          const delay = (options.retryDelay || 1000) * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error('No hay API keys disponibles');
  }

  /**
   * Obtener NFTs de un propietario
   */
  async getNFTsForOwner(
    owner: string,
    contractAddresses?: string[],
    tokenType?: 'ERC721' | 'ERC1155',
    pageKey?: string,
    pageSize: number = 100
  ): Promise<AlchemyNFTResponse> {
    const baseUrl = this.config.getAlchemyBaseUrl();
    let urlParams = `owner=${owner}&withMetadata=true&pageSize=${pageSize}`;

    if (contractAddresses && contractAddresses.length > 0) {
      contractAddresses.forEach(addr => {
        urlParams += `&contractAddresses[]=${addr}`;
      });
    }

    if (tokenType) {
      urlParams += `&tokenType=${tokenType}`;
    }

    if (pageKey) {
      urlParams += `&pageKey=${encodeURIComponent(pageKey)}`;
    }

    const urlTemplate = `${baseUrl}/{API_KEY}/getNFTsForOwner?${urlParams}`;
    
    const response = await this.fetchWithFallback(urlTemplate);
    return await response.json();
  }

  /**
   * Obtener metadata de un NFT específico
   */
  async getNFTMetadata(
    contractAddress: string,
    tokenId: string,
    tokenType: 'ERC721' | 'ERC1155' = 'ERC721'
  ): Promise<AlchemyNFT> {
    const baseUrl = this.config.getAlchemyBaseUrl();
    const urlTemplate = `${baseUrl}/{API_KEY}/getNFTMetadata?contractAddress=${contractAddress}&tokenId=${tokenId}&tokenType=${tokenType}`;
    
    const response = await this.fetchWithFallback(urlTemplate);
    return await response.json();
  }

  /**
   * Obtener todos los NFTs de una colección (paginado)
   */
  async getNFTsForCollection(
    contractAddress: string,
    pageKey?: string,
    pageSize: number = 100
  ): Promise<AlchemyNFTResponse> {
    const baseUrl = this.config.getAlchemyBaseUrl();
    let urlParams = `contractAddress=${contractAddress}&withMetadata=true&pageSize=${pageSize}`;

    if (pageKey) {
      urlParams += `&pageKey=${encodeURIComponent(pageKey)}`;
    }

    const urlTemplate = `${baseUrl}/{API_KEY}/getNFTsForCollection?${urlParams}`;
    
    const response = await this.fetchWithFallback(urlTemplate);
    return await response.json();
  }
}

/**
 * Rate Limiter simple para controlar requests por segundo
 */
class RateLimiter {
  private maxRequests: number;
  private windowMs: number;
  private requests: number[] = [];

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async waitForSlot(): Promise<void> {
    const now = Date.now();
    
    // Limpiar requests antiguos
    this.requests = this.requests.filter(time => now - time < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      // Esperar hasta que haya espacio
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest);
      
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return this.waitForSlot(); // Recursivo para verificar de nuevo
      }
    }

    this.requests.push(now);
  }
}

// Instancia singleton
let clientInstance: AlchemyClient | null = null;

/**
 * Obtener instancia singleton del cliente de Alchemy
 */
export function getAlchemyClient(): AlchemyClient {
  if (!clientInstance) {
    clientInstance = new AlchemyClient();
  }
  return clientInstance;
}

export default getAlchemyClient();




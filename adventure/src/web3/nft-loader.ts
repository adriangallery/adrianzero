/**
 * Módulo de carga de NFTs desde Alchemy
 * 
 * Este módulo proporciona funciones para cargar NFTs de un usuario,
 * con soporte para paginación, filtrado, y procesamiento de metadata.
 */

import { getAlchemyClient, AlchemyNFT, AlchemyNFTResponse } from './alchemy-client';
import { getBlockchainConfig } from './config';
import { GameItem, filterItems } from '../game/filters/filter-config';

export interface LoadNFTsOptions {
  owner: string;
  contractAddresses?: string[];
  tokenType?: 'ERC721' | 'ERC1155';
  filterId?: string; // ID del filtro a aplicar
  maxPages?: number; // Límite de páginas a cargar
  maxTokens?: number; // Límite total de tokens
  pageSize?: number;
}

export interface LoadNFTsResult {
  items: GameItem[];
  totalLoaded: number;
  hasMore: boolean;
  pageKey?: string;
}

/**
 * Convertir NFT de Alchemy a formato GameItem
 */
function alchemyNFTToGameItem(nft: AlchemyNFT): GameItem | null {
  try {
    // Extraer tokenId
    let tokenId: number;
    if (nft.id?.tokenId) {
      const tokenIdStr = nft.id.tokenId;
      if (typeof tokenIdStr === 'string') {
        if (tokenIdStr.startsWith('0x')) {
          tokenId = parseInt(tokenIdStr, 16);
        } else {
          tokenId = parseInt(tokenIdStr, 10);
        }
      } else {
        tokenId = tokenIdStr;
      }
    } else {
      console.error('No tokenId found in NFT:', nft);
      return null;
    }

    if (isNaN(tokenId)) {
      console.error('Invalid tokenId format:', nft.id?.tokenId);
      return null;
    }

    // Extraer título/nombre
    let title = `Token #${tokenId}`;
    if (nft.title) {
      title = nft.title;
    } else if (nft.name) {
      title = nft.name;
    } else if (nft.metadata?.name) {
      title = nft.metadata.name;
    } else if (nft.contract?.name) {
      title = `${nft.contract.name} #${tokenId}`;
    }

    // Extraer URL de imagen
    let imageUrl = '';
    
    // Prioridad 1: raw.metadata.image
    if (nft.raw?.metadata?.image) {
      imageUrl = nft.raw.metadata.image;
    }
    // Prioridad 2: media array
    else if (nft.media && Array.isArray(nft.media) && nft.media.length > 0) {
      const mediaSources = ['gateway', 'raw', 'thumbnail', 'format'];
      for (const source of mediaSources) {
        if (nft.media[0][source as keyof typeof nft.media[0]] && 
            typeof nft.media[0][source as keyof typeof nft.media[0]] === 'string') {
          imageUrl = nft.media[0][source as keyof typeof nft.media[0]] as string;
          break;
        }
      }
    }
    // Prioridad 3: metadata object
    else if (nft.metadata) {
      const imageProps = ['image', 'image_url', 'imageUrl', 'imageURI', 'image_uri', 'imageData'];
      for (const prop of imageProps) {
        if (nft.metadata[prop] && typeof nft.metadata[prop] === 'string') {
          imageUrl = nft.metadata[prop];
          break;
        }
      }
    }

    // Limpiar URLs de IPFS
    if (imageUrl && imageUrl.startsWith('ipfs://')) {
      imageUrl = imageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }

    // Determinar tokenType
    const tokenType = nft.id?.tokenMetadata?.tokenType || 
                     nft.tokenType || 
                     (nft.contract?.address === getBlockchainConfig().getContractAddress('ERC721') ? 'ERC721' : 'ERC1155');

    return {
      tokenId,
      title,
      imageUrl,
      contract: nft.contract?.address,
      contractName: nft.contract?.name || 'Unknown Contract',
      tokenType: tokenType as 'ERC721' | 'ERC1155',
      metadata: nft.metadata || {},
      balance: nft.balance || '1'
    };
  } catch (error) {
    console.error('Error processing NFT:', error, nft);
    return null;
  }
}

/**
 * Cargar NFTs de un propietario desde Alchemy
 */
export async function loadNFTs(options: LoadNFTsOptions): Promise<LoadNFTsResult> {
  const {
    owner,
    contractAddresses,
    tokenType,
    filterId,
    maxPages = 10,
    maxTokens = 1000,
    pageSize = 100
  } = options;

  const client = getAlchemyClient();
  const allItems: GameItem[] = [];
  let pageKey: string | undefined;
  let pageCount = 0;
  let hasMore = true;

  console.log(`📦 Cargando NFTs para ${owner}...`);

  while (hasMore && pageCount < maxPages && allItems.length < maxTokens) {
    pageCount++;
    console.log(`📄 Cargando página ${pageCount}/${maxPages}... (items: ${allItems.length}/${maxTokens})`);

    try {
      const response: AlchemyNFTResponse = await client.getNFTsForOwner(
        owner,
        contractAddresses,
        tokenType,
        pageKey,
        pageSize
      );

      const nfts = response.ownedNfts || response.nfts || [];
      const tokensInPage = nfts.length;
      console.log(`📦 Página ${pageCount}: ${tokensInPage} NFTs recibidos`);

      // Convertir NFTs a GameItems
      const items = nfts
        .map(nft => alchemyNFTToGameItem(nft))
        .filter((item): item is GameItem => item !== null);

      allItems.push(...items);

      // Verificar si hay más páginas
      pageKey = response.pageKey;
      hasMore = !!pageKey && tokensInPage === pageSize;

      console.log(`📊 Total acumulado: ${allItems.length} items, hay más: ${hasMore}`);

    } catch (error) {
      console.error(`❌ Error cargando página ${pageCount}:`, error);
      throw error;
    }
  }

  // Aplicar filtro si se especificó
  let filteredItems = allItems;
  if (filterId) {
    filteredItems = filterItems(allItems, filterId);
    console.log(`🔍 Filtro "${filterId}" aplicado: ${allItems.length} → ${filteredItems.length} items`);
  }

  console.log(`✅ Carga completa: ${filteredItems.length} items de ${allItems.length} totales`);

  return {
    items: filteredItems,
    totalLoaded: filteredItems.length,
    hasMore,
    pageKey
  };
}

/**
 * Cargar todos los NFTs de un usuario (sin límites)
 */
export async function loadAllNFTs(
  owner: string,
  contractAddresses?: string[],
  tokenType?: 'ERC721' | 'ERC1155',
  filterId?: string
): Promise<GameItem[]> {
  const result = await loadNFTs({
    owner,
    contractAddresses,
    tokenType,
    filterId,
    maxPages: 100, // Límite alto pero razonable
    maxTokens: 10000
  });

  return result.items;
}

/**
 * Cargar NFTs de un contrato específico
 */
export async function loadNFTsFromContract(
  owner: string,
  contractAddress: string,
  tokenType: 'ERC721' | 'ERC1155',
  filterId?: string
): Promise<GameItem[]> {
  return loadAllNFTs(owner, [contractAddress], tokenType, filterId);
}




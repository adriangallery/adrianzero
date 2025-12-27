/**
 * Sistema de gating para verificar ownership de NFTs y tokens
 * 
 * Este módulo proporciona funciones para verificar si un usuario tiene
 * acceso a ciertas funcionalidades basado en ownership de NFTs (ERC721)
 * o balance de tokens (ERC20).
 */

import { getBlockchainConfig } from './config';
import { loadAllNFTs, GameItem } from './nft-loader';
import { filterItems } from '../game/filters/filter-config';

export interface GatingRule {
  type: 'ERC721' | 'ERC20' | 'ERC1155';
  contractAddress: string;
  minBalance?: number; // Para ERC20/ERC1155
  tokenId?: number; // Para ERC721
  tokenIds?: number[]; // Para múltiples ERC721
  filterId?: string; // Para filtrar por tipo de item
}

export interface GatingCheck {
  rule: GatingRule;
  passed: boolean;
  reason?: string;
  details?: any;
}

/**
 * Verificar ownership de ERC721 (NFT)
 */
async function checkERC721Ownership(
  owner: string,
  contractAddress: string,
  tokenIds?: number[]
): Promise<{ passed: boolean; ownedTokens: number[]; reason?: string }> {
  try {
    // Cargar NFTs del usuario desde el contrato
    const nfts = await loadAllNFTs(owner, [contractAddress], 'ERC721');
    
    const ownedTokenIds = nfts.map(nft => {
      const tokenId = typeof nft.tokenId === 'string' 
        ? parseInt(nft.tokenId, 10) 
        : nft.tokenId;
      return tokenId;
    });

    // Si se especificaron tokenIds específicos, verificar ownership
    if (tokenIds && tokenIds.length > 0) {
      const hasAny = tokenIds.some(id => ownedTokenIds.includes(id));
      return {
        passed: hasAny,
        ownedTokens: ownedTokenIds.filter(id => tokenIds.includes(id)),
        reason: hasAny ? undefined : `Usuario no posee ninguno de los tokens requeridos: ${tokenIds.join(', ')}`
      };
    }

    // Si no se especificaron tokenIds, verificar que tenga al menos uno
    return {
      passed: ownedTokenIds.length > 0,
      ownedTokens: ownedTokenIds,
      reason: ownedTokenIds.length === 0 ? 'Usuario no posee ningún NFT del contrato' : undefined
    };
  } catch (error) {
    console.error('Error verificando ownership ERC721:', error);
    return {
      passed: false,
      ownedTokens: [],
      reason: `Error al verificar ownership: ${error}`
    };
  }
}

/**
 * Verificar ownership de ERC1155 (multi-token)
 */
async function checkERC1155Ownership(
  owner: string,
  contractAddress: string,
  tokenId?: number,
  minBalance: number = 1
): Promise<{ passed: boolean; balance: number; reason?: string }> {
  try {
    // Cargar NFTs del usuario desde el contrato
    const nfts = await loadAllNFTs(owner, [contractAddress], 'ERC1155');
    
    if (tokenId !== undefined) {
      // Verificar balance de un token específico
      const token = nfts.find(nft => {
        const nftTokenId = typeof nft.tokenId === 'string' 
          ? parseInt(nft.tokenId, 10) 
          : nft.tokenId;
        return nftTokenId === tokenId;
      });

      const balance = token ? parseInt(token.balance || '0', 10) : 0;
      const passed = balance >= minBalance;

      return {
        passed,
        balance,
        reason: passed ? undefined : `Balance insuficiente: ${balance} < ${minBalance}`
      };
    } else {
      // Verificar que tenga al menos un token del contrato
      const totalBalance = nfts.reduce((sum, nft) => {
        return sum + parseInt(nft.balance || '0', 10);
      }, 0);

      return {
        passed: totalBalance >= minBalance,
        balance: totalBalance,
        reason: totalBalance < minBalance ? `Balance total insuficiente: ${totalBalance} < ${minBalance}` : undefined
      };
    }
  } catch (error) {
    console.error('Error verificando ownership ERC1155:', error);
    return {
      passed: false,
      balance: 0,
      reason: `Error al verificar ownership: ${error}`
    };
  }
}

/**
 * Verificar balance de ERC20 (token)
 * Nota: Esto requiere un provider de ethers, se implementará cuando se integre wallet
 */
async function checkERC20Balance(
  owner: string,
  contractAddress: string,
  minBalance: string // En formato de string para manejar BigNumber
): Promise<{ passed: boolean; balance: string; reason?: string }> {
  // TODO: Implementar cuando se integre wallet connector
  // Por ahora retornar false
  return {
    passed: false,
    balance: '0',
    reason: 'Verificación de balance ERC20 no implementada aún (requiere provider de ethers)'
  };
}

/**
 * Verificar gating por filtro de items
 */
async function checkFilterGating(
  owner: string,
  contractAddress: string,
  filterId: string
): Promise<{ passed: boolean; items: GameItem[]; reason?: string }> {
  try {
    const nfts = await loadAllNFTs(owner, [contractAddress]);
    const filtered = filterItems(nfts, filterId);

    return {
      passed: filtered.length > 0,
      items: filtered,
      reason: filtered.length === 0 ? `Usuario no posee items del tipo: ${filterId}` : undefined
    };
  } catch (error) {
    console.error('Error verificando gating por filtro:', error);
    return {
      passed: false,
      items: [],
      reason: `Error al verificar filtro: ${error}`
    };
  }
}

/**
 * Verificar una regla de gating
 */
export async function checkGatingRule(
  owner: string,
  rule: GatingRule
): Promise<GatingCheck> {
  console.log(`🔒 Verificando gating para ${owner}:`, rule);

  let result: { passed: boolean; reason?: string; details?: any };

  if (rule.filterId) {
    // Gating por filtro de items
    const filterResult = await checkFilterGating(owner, rule.contractAddress, rule.filterId);
    result = {
      passed: filterResult.passed,
      reason: filterResult.reason,
      details: { items: filterResult.items }
    };
  } else if (rule.type === 'ERC721') {
    // Gating por ownership de ERC721
    const ownershipResult = await checkERC721Ownership(
      owner,
      rule.contractAddress,
      rule.tokenIds || (rule.tokenId ? [rule.tokenId] : undefined)
    );
    result = {
      passed: ownershipResult.passed,
      reason: ownershipResult.reason,
      details: { ownedTokens: ownershipResult.ownedTokens }
    };
  } else if (rule.type === 'ERC1155') {
    // Gating por ownership de ERC1155
    const ownershipResult = await checkERC1155Ownership(
      owner,
      rule.contractAddress,
      rule.tokenId,
      rule.minBalance || 1
    );
    result = {
      passed: ownershipResult.passed,
      reason: ownershipResult.reason,
      details: { balance: ownershipResult.balance }
    };
  } else if (rule.type === 'ERC20') {
    // Gating por balance de ERC20
    const balanceResult = await checkERC20Balance(
      owner,
      rule.contractAddress,
      rule.minBalance?.toString() || '0'
    );
    result = {
      passed: balanceResult.passed,
      reason: balanceResult.reason,
      details: { balance: balanceResult.balance }
    };
  } else {
    result = {
      passed: false,
      reason: `Tipo de gating no soportado: ${rule.type}`
    };
  }

  const check: GatingCheck = {
    rule,
    passed: result.passed,
    reason: result.reason,
    details: result.details
  };

  console.log(`🔒 Resultado de gating:`, check.passed ? '✅ PASÓ' : '❌ FALLÓ', check.reason || '');

  return check;
}

/**
 * Verificar múltiples reglas de gating (AND lógico)
 * Todas las reglas deben pasar para que el gating sea exitoso
 */
export async function checkMultipleGatingRules(
  owner: string,
  rules: GatingRule[]
): Promise<{ passed: boolean; checks: GatingCheck[] }> {
  const checks = await Promise.all(
    rules.map(rule => checkGatingRule(owner, rule))
  );

  const passed = checks.every(check => check.passed);

  return {
    passed,
    checks
  };
}

/**
 * Verificar gating con OR lógico (al menos una regla debe pasar)
 */
export async function checkGatingRulesOR(
  owner: string,
  rules: GatingRule[]
): Promise<{ passed: boolean; checks: GatingCheck[] }> {
  const checks = await Promise.all(
    rules.map(rule => checkGatingRule(owner, rule))
  );

  const passed = checks.some(check => check.passed);

  return {
    passed,
    checks
  };
}

/**
 * Helper para crear regla de gating para floppy discs
 */
export function createFloppyGatingRule(contractAddress?: string): GatingRule {
  const config = getBlockchainConfig();
  return {
    type: 'ERC1155',
    contractAddress: contractAddress || config.getContractAddress('ERC1155') || '',
    filterId: 'floppy'
  };
}

/**
 * Helper para crear regla de gating para AdrianZERO
 */
export function createAdrianZeroGatingRule(contractAddress?: string): GatingRule {
  const config = getBlockchainConfig();
  return {
    type: 'ERC721',
    contractAddress: contractAddress || config.getContractAddress('ERC721') || ''
  };
}




/**
 * Ejemplos de uso del sistema modular de blockchain
 * 
 * Este archivo muestra cómo usar los diferentes módulos del sistema
 */

import { getBlockchainConfig } from '../web3/config';
import { getAlchemyClient } from '../web3/alchemy-client';
import { loadAllNFTs, loadNFTs } from '../web3/nft-loader';
import { checkGatingRule, createFloppyGatingRule, checkMultipleGatingRules } from '../web3/gating';
import { getInventoryManager } from '../game/inventory/inventory-manager';
import { filterItems, addCustomFilter, getItemStats } from '../game/filters/filter-config';

// ============================================
// Ejemplo 1: Configuración básica
// ============================================

export async function example1_Configuration() {
  const config = getBlockchainConfig();
  
  // Obtener direcciones de contratos
  const erc721Address = config.getContractAddress('ERC721');
  const erc1155Address = config.getContractAddress('ERC1155');
  
  // Obtener API keys de Alchemy
  const apiKeys = config.getAllAlchemyApiKeys();
  
  // Obtener configuración de red
  const network = config.getNetwork();
  
  console.log('Configuración:', {
    ERC721: erc721Address,
    ERC1155: erc1155Address,
    Network: network.name,
    APIKeys: apiKeys.length
  });
}

// ============================================
// Ejemplo 2: Cargar NFTs de un usuario
// ============================================

export async function example2_LoadNFTs(ownerAddress: string) {
  // Opción 1: Cargar todos los NFTs
  const allItems = await loadAllNFTs(
    ownerAddress,
    undefined, // Todos los contratos
    undefined, // Todos los tipos
    undefined  // Sin filtro
  );
  
  console.log(`Total NFTs cargados: ${allItems.length}`);
  
  // Opción 2: Cargar con opciones específicas
  const result = await loadNFTs({
    owner: ownerAddress,
    contractAddresses: [
      '0x90546848474fb3c9fda3fdad887969bb244e7e58' // AdrianLAB
    ],
    tokenType: 'ERC1155',
    filterId: 'floppy',
    maxPages: 5,
    maxTokens: 100
  });
  
  console.log(`Floppy discs encontrados: ${result.items.length}`);
  console.log(`Hay más páginas: ${result.hasMore}`);
}

// ============================================
// Ejemplo 3: Usar el gestor de inventario
// ============================================

export async function example3_InventoryManager(ownerAddress: string) {
  const inventory = getInventoryManager();
  
  // Suscribirse a eventos
  inventory.on('loading', (state) => {
    console.log('⏳ Cargando inventario...');
  });
  
  inventory.on('loaded', (state) => {
    console.log(`✅ Inventario cargado: ${state.allItems.length} items`);
    console.log('Estadísticas:', state.stats);
  });
  
  // Cargar inventario
  await inventory.loadInventory(ownerAddress);
  
  // Obtener items por categoría
  const floppies = inventory.getItemsByCategory('floppy');
  const serums = inventory.getItemsByCategory('serum');
  
  console.log(`Floppy discs: ${floppies.length}`);
  console.log(`Serums: ${serums.length}`);
  
  // Seleccionar un item
  if (floppies.length > 0) {
    inventory.selectItem(floppies[0]);
    console.log('Item seleccionado:', inventory.getSelectedItem()?.title);
  }
  
  // Obtener estado completo
  const state = inventory.getState();
  console.log('Estado del inventario:', state);
}

// ============================================
// Ejemplo 4: Sistema de filtros
// ============================================

export async function example4_Filters(ownerAddress: string) {
  // Cargar todos los items
  const allItems = await loadAllNFTs(ownerAddress);
  
  // Filtrar por tipo
  const floppies = filterItems(allItems, 'floppy');
  const serums = filterItems(allItems, 'serum');
  const adrianZero = filterItems(allItems, 'adrianZero');
  
  console.log('Items filtrados:', {
    floppies: floppies.length,
    serums: serums.length,
    adrianZero: adrianZero.length
  });
  
  // Obtener estadísticas
  const stats = getItemStats(allItems);
  console.log('Estadísticas:', stats);
  
  // Agregar filtro personalizado
  addCustomFilter({
    id: 'mySpecialItems',
    name: 'My Special Items',
    rules: [
      {
        type: 'tokenIdRange',
        value: { min: 30000, max: 30099 },
        operator: 'range'
      }
    ],
    displayName: (tokenId) => `Special #${tokenId}`
  });
  
  // Usar el nuevo filtro
  const specialItems = filterItems(allItems, 'mySpecialItems');
  console.log(`Items especiales encontrados: ${specialItems.length}`);
}

// ============================================
// Ejemplo 5: Sistema de gating
// ============================================

export async function example5_Gating(ownerAddress: string) {
  // Verificar gating para floppy discs
  const floppyRule = createFloppyGatingRule();
  const floppyCheck = await checkGatingRule(ownerAddress, floppyRule);
  
  if (floppyCheck.passed) {
    console.log('✅ Usuario tiene floppy discs');
    console.log('Items:', floppyCheck.details?.items);
  } else {
    console.log('❌ Usuario no tiene floppy discs:', floppyCheck.reason);
  }
  
  // Verificar múltiples reglas (AND)
  const rules = [
    createFloppyGatingRule(),
    {
      type: 'ERC721' as const,
      contractAddress: '0x6e369bf0e4e0c106192d606fb6d85836d684da75',
      tokenIds: [1, 2, 3] // Debe tener al menos uno de estos
    }
  ];
  
  const multiCheck = await checkMultipleGatingRules(ownerAddress, rules);
  
  if (multiCheck.passed) {
    console.log('✅ Usuario cumple todas las reglas');
  } else {
    console.log('❌ Usuario no cumple todas las reglas');
    multiCheck.checks.forEach((check, index) => {
      console.log(`Regla ${index + 1}:`, check.passed ? '✅' : '❌', check.reason);
    });
  }
}

// ============================================
// Ejemplo 6: Cliente de Alchemy directo
// ============================================

export async function example6_AlchemyClient() {
  const client = getAlchemyClient();
  
  // Obtener metadata de un NFT específico
  const nft = await client.getNFTMetadata(
    '0x90546848474fb3c9fda3fdad887969bb244e7e58',
    '10003',
    'ERC1155'
  );
  
  console.log('NFT metadata:', {
    title: nft.title,
    contract: nft.contract?.name,
    image: nft.media?.[0]?.gateway
  });
  
  // Obtener NFTs de una colección
  const collection = await client.getNFTsForCollection(
    '0x90546848474fb3c9fda3fdad887969bb244e7e58',
    undefined, // pageKey
    50 // pageSize
  );
  
  console.log(`NFTs en colección: ${collection.nfts?.length || 0}`);
  console.log(`Hay más páginas: ${!!collection.pageKey}`);
}

// ============================================
// Ejemplo 7: Flujo completo
// ============================================

export async function example7_CompleteFlow(ownerAddress: string) {
  console.log('🚀 Iniciando flujo completo...');
  
  // 1. Configuración
  const config = getBlockchainConfig();
  console.log('✅ Configuración cargada');
  
  // 2. Cargar inventario
  const inventory = getInventoryManager();
  await inventory.loadInventory(ownerAddress);
  console.log('✅ Inventario cargado');
  
  // 3. Obtener floppy discs
  const floppies = inventory.getItemsByFilter('floppy');
  console.log(`✅ Floppy discs encontrados: ${floppies.length}`);
  
  // 4. Verificar gating
  const rule = createFloppyGatingRule();
  const check = await checkGatingRule(ownerAddress, rule);
  console.log(`✅ Gating verificado: ${check.passed ? 'PASÓ' : 'FALLÓ'}`);
  
  // 5. Seleccionar item si hay
  if (floppies.length > 0) {
    inventory.selectItem(floppies[0]);
    console.log(`✅ Item seleccionado: ${inventory.getSelectedItem()?.title}`);
  }
  
  console.log('🎉 Flujo completo finalizado');
}




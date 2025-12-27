/**
 * Módulos de Web3 para AdrianAdventure
 * 
 * Exporta todos los módulos relacionados con blockchain de forma centralizada
 */

export * from './config';
export * from './alchemy-client';
export * from './nft-loader';
export * from './gating';

// Re-exportar instancias singleton para fácil acceso
export { getBlockchainConfig, default as blockchainConfig } from './config';
export { getAlchemyClient, default as alchemyClient } from './alchemy-client';




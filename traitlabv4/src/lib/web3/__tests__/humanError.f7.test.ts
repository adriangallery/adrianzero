import { describe, it, expect } from 'vitest';
import { humanError, isUserRejection } from '../humanError';

/**
 * F7 (13-sep-2026): mensajes nuevos añadidos a `humanError` con los motivos
 * reales encontrados en los ABIs verificados en Blockscout de los contratos
 * que usa el front (`src/config/contracts.ts`): KIT_SALE, SERUM_MODULE,
 * ADRIAN_CRAFTING, ZOOM_TOGGLE, ADRIAN_NAME_REGISTRY, REWARDS_CONTRACT,
 * OGCLAIM_CONTRACT, TRAITS_EXTENSIONS.
 */

/** Simula lo que viem produce al decodificar el revert de un custom error de
 *  Solidity: un `ContractFunctionExecutionError` cuya `cause` es un
 *  `ContractFunctionRevertedError` con `data.errorName`. */
function viemRevertError(errorName: string, shortMessage = `Execution reverted: ${errorName}()`) {
  const revertedError = {
    name: 'ContractFunctionRevertedError',
    shortMessage,
    data: { errorName, args: [] },
  };
  return {
    name: 'ContractFunctionExecutionError',
    message: `The contract function reverted with the following reason:\n${errorName}()`,
    cause: revertedError,
  };
}

describe('humanError — custom errors de KIT_SALE (onboarding/buy)', () => {
  it('KitSalesPaused', () => {
    expect(humanError(viemRevertError('KitSalesPaused'))).toBe('Kit sales are paused right now');
  });
  it('ExceedsMaxSupply', () => {
    expect(humanError(viemRevertError('ExceedsMaxSupply'))).toBe('Sold out — no supply left for this kit');
  });
  it('ExceedsKitWalletLimit', () => {
    expect(humanError(viemRevertError('ExceedsKitWalletLimit'))).toBe(
      "You've reached the per-wallet limit for this kit"
    );
  });
  it('InsufficientETH', () => {
    expect(humanError(viemRevertError('InsufficientETH'))).toBe('Not enough ETH sent for this purchase');
  });
  it('InsufficientAdrianTokens', () => {
    expect(humanError(viemRevertError('InsufficientAdrianTokens'))).toBe(
      "You don't have enough ADRIAN for this"
    );
  });
  it('NotStarted', () => {
    expect(humanError(viemRevertError('NotStarted'))).toBe("This sale hasn't started yet");
  });
});

describe('humanError — require() strings de Serum/Crafting/Toggle/NameRegistry/Traits', () => {
  it('Serum already used on this token', () => {
    expect(humanError(new Error('Serum already used on this token'))).toBe(
      'This serum has already been used on this token'
    );
  });
  it('Token not eligible for mutation', () => {
    expect(humanError(new Error('Token not eligible for mutation'))).toBe(
      "This token isn't eligible for this serum"
    );
  });
  it('Recipe inactive', () => {
    expect(humanError(new Error('Recipe inactive'))).toBe("This recipe isn't active right now");
  });
  it('Total burn below requirement', () => {
    expect(humanError(new Error('Total burn below requirement'))).toBe(
      "You don't have enough materials for this recipe"
    );
  });
  it('Name cannot be empty', () => {
    expect(humanError(new Error('Name cannot be empty'))).toBe('Enter a name first');
  });
  it('Cannot apply this asset', () => {
    expect(humanError(new Error('Cannot apply this asset'))).toBe("This trait can't be applied here");
  });
  it('Insufficient inventory balance', () => {
    expect(humanError(new Error('Insufficient inventory balance'))).toBe(
      "You don't have enough of this in your inventory"
    );
  });
  it('Not punk owner (OGClaim)', () => {
    expect(humanError(new Error('Not punk owner'))).toBe('You must own this punk');
  });
  it('Too early / Too late (rewards)', () => {
    expect(humanError(new Error('Too early'))).toBe("It's too early to claim this — check back later");
    expect(humanError(new Error('Too late'))).toBe('The claim window for this has closed');
  });
});

describe('humanError — cadena de cause (viem BaseError) y user rejection', () => {
  it('recorre `.cause` para encontrar el error name aunque el mensaje de arriba no lo diga', () => {
    const wrapped = { message: 'call reverted', cause: { message: 'ExceedsMintLimit()' } };
    expect(humanError(wrapped)).toBe("You've hit the mint limit for this transaction");
  });

  it('isUserRejection reconoce el shortMessage de viem sin message directo', () => {
    const rejected = { shortMessage: 'User rejected the request.' };
    expect(isUserRejection(rejected)).toBe(true);
    expect(humanError(rejected)).toBe('Transaction cancelled');
  });
});

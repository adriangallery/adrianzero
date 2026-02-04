/**
 * TRAITLAB - Contract Utilities
 * Utilidades genéricas para ejecutar transacciones de contratos
 * Elimina ~150 líneas de código duplicado
 */

/**
 * Carga dinámica de ethers.js si no está disponible
 * @returns {Promise<object>} - ethers library
 */
async function loadEthers() {
    if (typeof window.ethers !== 'undefined') {
        return window.ethers;
    }

    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/ethers@5.7.2/dist/ethers.umd.min.js';

        script.onload = () => {
            console.log('✅ Ethers loaded successfully');
            resolve(window.ethers);
        };

        script.onerror = () => {
            reject(new Error('Failed to load ethers library. Please refresh the page.'));
        };

        document.head.appendChild(script);
    });
}

/**
 * Ejecuta una transacción de contrato de manera genérica
 * Elimina duplicación de código en floppy.js
 *
 * @param {object} params - Parámetros de la transacción
 * @param {string} params.contractAddress - Dirección del contrato
 * @param {array} params.abi - ABI del contrato
 * @param {string} params.methodName - Nombre del método a llamar
 * @param {array} params.methodParams - Parámetros del método
 * @param {function} params.onSuccess - Callback al completar con éxito
 * @param {function} params.validateBefore - Validación pre-transacción opcional
 * @returns {Promise<object>} - Receipt de la transacción
 */
async function executeContractTransaction({
    contractAddress,
    abi,
    methodName,
    methodParams = [],
    onSuccess = null,
    validateBefore = null
}) {
    try {
        // Cargar ethers si no está disponible
        const ethers = await loadEthers();

        // Crear provider y signer
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();

        // Crear instancia del contrato
        const contract = new ethers.Contract(contractAddress, abi, signer);

        // Validación opcional pre-transacción
        if (validateBefore) {
            console.log('🔍 Ejecutando validación pre-transacción...');
            await validateBefore(contract, signer);
        }

        // Ejecutar transacción
        console.log(`📤 Calling ${methodName}(${methodParams.join(', ')})`);
        console.log('📍 Contract:', contractAddress);

        const tx = await contract[methodName](...methodParams);
        console.log('✅ Transaction sent:', tx.hash);

        // Esperar confirmación
        const receipt = await tx.wait();
        console.log('✅ Transaction confirmed in block:', receipt.blockNumber);

        // Callback de éxito opcional
        if (onSuccess) {
            await onSuccess(receipt);
        }

        return receipt;

    } catch (error) {
        console.error(`❌ Error in ${methodName}:`, error);

        // Parsear errores comunes
        let errorMessage = `Failed to execute ${methodName}.`;

        if (error.code === 4001 || error.code === 'ACTION_REJECTED') {
            errorMessage = 'Transaction was rejected by user.';
        } else if (error.reason) {
            errorMessage = `Error: ${error.reason}`;
        } else if (error.message) {
            errorMessage = `Error: ${error.message}`;
        }

        throw new Error(errorMessage);
    }
}

/**
 * Validador genérico para ActionPacks
 * Verifica packConfigs.active y canOpenPack
 *
 * @param {object} contract - Instancia del contrato
 * @param {object} signer - Signer de ethers
 * @param {number} packId - ID del pack
 * @returns {Promise<void>}
 */
async function validateActionPack(contract, signer, packId) {
    const userAddress = await signer.getAddress();

    // Verificar packConfigs.active
    try {
        const packConfig = await contract.packConfigs(packId);
        if (!packConfig.active) {
            throw new Error(`Pack ${packId} is not active.`);
        }
        console.log('✅ Pack is active');
    } catch (error) {
        console.warn('⚠️ Could not verify packConfig (contract may not support it)');
    }

    // Verificar canOpenPack
    const [canOpen, reason] = await contract.canOpenPack(userAddress, packId);
    if (!canOpen) {
        throw new Error(`Cannot open pack: ${reason}`);
    }
    console.log('✅ User can open pack');
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.ContractUtils = {
        executeContractTransaction,
        validateActionPack,
        loadEthers
    };
    console.log('✅ ContractUtils: Utilidades de contratos cargadas');
}

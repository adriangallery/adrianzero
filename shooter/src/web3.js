// Wallet connect + approve + mint flow (ethers v6 via ESM CDN)

import { ethers } from 'https://esm.sh/ethers@6.13.2';
import { CONFIG } from './config.js';

const MINTER_ABI = [
    'function mint(uint8 tier, uint256 score, uint256 nonce, uint256 expiry, bytes signature)',
    'function mintPublic(uint8 tier)',
    'function priceFor(uint8 tier) view returns (uint256)',
    'function nonces(address) view returns (uint256)',
    'function totalSupply() view returns (uint256)',
    'function publicMintEnabled() view returns (bool)',
    'function zeroToken() view returns (address)'
];

const ERC20_ABI = [
    'function allowance(address owner, address spender) view returns (uint256)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function balanceOf(address owner) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)'
];

let currentAddress = null;
const listeners = [];

export function onWalletChange(cb) { listeners.push(cb); }
export function getAddress() { return currentAddress; }
function emit() { listeners.forEach(l => l(currentAddress)); }

async function ensureChain(provider) {
    const net = await provider.getNetwork();
    if (Number(net.chainId) === CONFIG.chainId) return;
    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: CONFIG.chainIdHex }]
        });
    } catch (err) {
        if (err.code === 4902) {
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                    chainId: CONFIG.chainIdHex,
                    chainName: CONFIG.chainName,
                    rpcUrls: [CONFIG.rpcUrl],
                    blockExplorerUrls: [CONFIG.blockExplorer],
                    nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 }
                }]
            });
        } else {
            throw err;
        }
    }
}

export async function connectWallet() {
    if (!window.ethereum) throw new Error('No wallet found. Install MetaMask.');
    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send('eth_requestAccounts', []);
    await ensureChain(provider);
    const signer = await provider.getSigner();
    currentAddress = await signer.getAddress();
    emit();

    window.ethereum.on('accountsChanged', (accts) => {
        currentAddress = accts[0] || null;
        emit();
    });
    window.ethereum.on('chainChanged', () => window.location.reload());

    return { provider, signer };
}

async function getSignerOrConnect() {
    if (!currentAddress) return connectWallet();
    const provider = new ethers.BrowserProvider(window.ethereum);
    await ensureChain(provider);
    const signer = await provider.getSigner();
    return { provider, signer };
}

async function fetchSignature(address, score, tierId) {
    const res = await fetch(CONFIG.signerEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, score, tier: tierId })
    });
    if (!res.ok) throw new Error(`Signer rejected: ${res.status}`);
    return res.json();
}

async function ensureAllowance(signer, owner, spender, amount, statusCb) {
    if (amount === 0n) return;
    const zero = new ethers.Contract(CONFIG.zeroTokenAddress, ERC20_ABI, signer);

    const balance = await zero.balanceOf(owner);
    if (balance < amount) {
        throw new Error(`Insufficient $ZERO balance. Need ${ethers.formatUnits(amount, 18)} ZERO, have ${ethers.formatUnits(balance, 18)}`);
    }

    const current = await zero.allowance(owner, spender);
    if (current >= amount) return;

    statusCb?.('Approving $ZERO…');
    const tx = await zero.approve(spender, amount);
    await tx.wait();
}

export async function attemptMint(score, tier, statusCb) {
    if (CONFIG.contractAddress === '0x0000000000000000000000000000000000000000') {
        throw new Error('Contract address not configured. Edit src/config.js');
    }

    const { signer } = await getSignerOrConnect();
    const contract = new ethers.Contract(CONFIG.contractAddress, MINTER_ABI, signer);
    const price = await contract.priceFor(tier.id);

    await ensureAllowance(signer, currentAddress, CONFIG.contractAddress, price, statusCb);

    statusCb?.('Minting…');
    if (CONFIG.allowPublicMint) {
        const tx = await contract.mintPublic(tier.id);
        const receipt = await tx.wait();
        return { txHash: receipt.hash };
    }

    const sig = await fetchSignature(currentAddress, score, tier.id);
    const tx = await contract.mint(tier.id, score, sig.nonce, sig.expiry, sig.signature);
    const receipt = await tx.wait();
    return { txHash: receipt.hash };
}

export { ethers };

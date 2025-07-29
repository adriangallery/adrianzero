import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { transactionHash, walletAddress, designHash } = body

    // Validate required fields
    if (!transactionHash || !walletAddress || !designHash) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate transaction hash format
    if (!ethers.isHexString(transactionHash, 32)) {
      return NextResponse.json(
        { error: 'Invalid transaction hash format' },
        { status: 400 }
      )
    }

    // Validate wallet address format
    if (!ethers.isAddress(walletAddress)) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      )
    }

    // Get provider (you can configure this for different networks)
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/your-api-key')

    try {
      // Get transaction receipt
      const receipt = await provider.getTransactionReceipt(transactionHash)
      
      if (!receipt) {
        return NextResponse.json(
          { error: 'Transaction not found or not yet mined' },
          { status: 404 }
        )
      }

      // Check if transaction is successful
      if (receipt.status !== 1) {
        return NextResponse.json(
          { error: 'Transaction failed' },
          { status: 400 }
        )
      }

      // Get transaction details
      const transaction = await provider.getTransaction(transactionHash)
      
      if (!transaction) {
        return NextResponse.json(
          { error: 'Transaction details not found' },
          { status: 404 }
        )
      }

      // Verify the transaction is from the correct wallet
      if (transaction.from.toLowerCase() !== walletAddress.toLowerCase()) {
        return NextResponse.json(
          { error: 'Transaction not from specified wallet' },
          { status: 400 }
        )
      }

      // Additional verification can be added here:
      // - Check if transaction is to the correct contract
      // - Verify the transaction data contains the design hash
      // - Check gas used and other parameters

      return NextResponse.json({
        success: true,
        verified: true,
        transaction: {
          hash: transactionHash,
          from: transaction.from,
          to: transaction.to,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString(),
          effectiveGasPrice: transaction.gasPrice?.toString(),
        },
        designHash,
        walletAddress,
      })

    } catch (error) {
      console.error('Error verifying transaction:', error)
      return NextResponse.json(
        { error: 'Failed to verify transaction on blockchain' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error in verify-transaction API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 
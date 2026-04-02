/**
 * ShopFacet ABI - Diamond $ZERO Shop V2
 * Generated from ShopFacet.sol - only user-facing functions
 */
export const SHOP_FACET_ABI = [
  {
    "type": "function",
    "name": "batchGetShopItems",
    "inputs": [
      {
        "name": "ids",
        "type": "uint256[]",
        "internalType": "uint256[]"
      },
      {
        "name": "user",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "items",
        "type": "tuple[]",
        "internalType": "struct ShopFacet.ShopItemView[]",
        "components": [
          {
            "name": "assetId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "priceZero",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "priceAdrian",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "quantityAvailable",
            "type": "uint128",
            "internalType": "uint128"
          },
          {
            "name": "sold",
            "type": "uint128",
            "internalType": "uint128"
          },
          {
            "name": "startTime",
            "type": "uint48",
            "internalType": "uint48"
          },
          {
            "name": "endTime",
            "type": "uint48",
            "internalType": "uint48"
          },
          {
            "name": "active",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "maxPerWallet",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "hasAllowlist",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "freePerWallet",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "freeUsedByUser",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "freeRemaining",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "isAllowlisted",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "userPurchases",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "effectiveBurnBps",
            "type": "uint16",
            "internalType": "uint16"
          },
          {
            "name": "revenueRecipient",
            "type": "address",
            "internalType": "address"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "canPurchaseItem",
    "inputs": [
      {
        "name": "user",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "assetId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "qty",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "useFree",
        "type": "bool",
        "internalType": "bool"
      },
      {
        "name": "payWith",
        "type": "uint8",
        "internalType": "enum ShopFacet.PaymentToken"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getActiveItems",
    "inputs": [
      {
        "name": "offset",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "limit",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "user",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "items",
        "type": "tuple[]",
        "internalType": "struct ShopFacet.ShopItemView[]",
        "components": [
          {
            "name": "assetId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "priceZero",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "priceAdrian",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "quantityAvailable",
            "type": "uint128",
            "internalType": "uint128"
          },
          {
            "name": "sold",
            "type": "uint128",
            "internalType": "uint128"
          },
          {
            "name": "startTime",
            "type": "uint48",
            "internalType": "uint48"
          },
          {
            "name": "endTime",
            "type": "uint48",
            "internalType": "uint48"
          },
          {
            "name": "active",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "maxPerWallet",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "hasAllowlist",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "freePerWallet",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "freeUsedByUser",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "freeRemaining",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "isAllowlisted",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "userPurchases",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "effectiveBurnBps",
            "type": "uint16",
            "internalType": "uint16"
          },
          {
            "name": "revenueRecipient",
            "type": "address",
            "internalType": "address"
          }
        ]
      },
      {
        "name": "total",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getShopItemView",
    "inputs": [
      {
        "name": "assetId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "user",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "internalType": "struct ShopFacet.ShopItemView",
        "components": [
          {
            "name": "assetId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "priceZero",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "priceAdrian",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "quantityAvailable",
            "type": "uint128",
            "internalType": "uint128"
          },
          {
            "name": "sold",
            "type": "uint128",
            "internalType": "uint128"
          },
          {
            "name": "startTime",
            "type": "uint48",
            "internalType": "uint48"
          },
          {
            "name": "endTime",
            "type": "uint48",
            "internalType": "uint48"
          },
          {
            "name": "active",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "maxPerWallet",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "hasAllowlist",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "freePerWallet",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "freeUsedByUser",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "freeRemaining",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "isAllowlisted",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "userPurchases",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "effectiveBurnBps",
            "type": "uint16",
            "internalType": "uint16"
          },
          {
            "name": "revenueRecipient",
            "type": "address",
            "internalType": "address"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getShopStats",
    "inputs": [],
    "outputs": [
      {
        "name": "totalActive",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "totalSold",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "revenueZero",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "revenueAdrian",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getUserAllowlistStatus",
    "inputs": [
      {
        "name": "user",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "assetId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "isAllowlisted",
        "type": "bool",
        "internalType": "bool"
      },
      {
        "name": "freeRemaining",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "freeUsed",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "previewBatchPurchase",
    "inputs": [
      {
        "name": "requests",
        "type": "tuple[]",
        "internalType": "struct ShopFacet.PurchaseRequest[]",
        "components": [
          {
            "name": "assetId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "quantity",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "useFree",
            "type": "bool",
            "internalType": "bool"
          }
        ]
      },
      {
        "name": "user",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "payWith",
        "type": "uint8",
        "internalType": "enum ShopFacet.PaymentToken"
      }
    ],
    "outputs": [
      {
        "name": "preview",
        "type": "tuple",
        "internalType": "struct ShopFacet.BatchPreview",
        "components": [
          {
            "name": "canPurchaseAll",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "totalCost",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "totalFreeAmount",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "purchaseItems",
    "inputs": [
      {
        "name": "requests",
        "type": "tuple[]",
        "internalType": "struct ShopFacet.PurchaseRequest[]",
        "components": [
          {
            "name": "assetId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "quantity",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "useFree",
            "type": "bool",
            "internalType": "bool"
          }
        ]
      },
      {
        "name": "payWith",
        "type": "uint8",
        "internalType": "enum ShopFacet.PaymentToken"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "purchaseWithMerkle",
    "inputs": [
      {
        "name": "assetId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "quantity",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "payWith",
        "type": "uint8",
        "internalType": "enum ShopFacet.PaymentToken"
      },
      {
        "name": "proof",
        "type": "bytes32[]",
        "internalType": "bytes32[]"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "shopActive",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "verifyMerkleProof",
    "inputs": [
      {
        "name": "assetId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "wallet",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "proof",
        "type": "bytes32[]",
        "internalType": "bytes32[]"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "zeroBurnBps",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint16",
        "internalType": "uint16"
      }
    ],
    "stateMutability": "view"
  }
] as const;

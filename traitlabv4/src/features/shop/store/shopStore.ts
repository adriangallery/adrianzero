/**
 * Shop Store
 * Cart state management with Zustand
 */

import { create } from 'zustand';

export interface CartItem {
  assetId: number;
  quantity: number;
  price: bigint;
  useFree: boolean;
  name: string;
  imageUrl: string;
}

interface ShopState {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeFromCart: (assetId: number) => void;
  updateQuantity: (assetId: number, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => bigint;
  getCartItemCount: () => number;
}

export const useShopStore = create<ShopState>((set, get) => ({
  cart: [],

  addToCart: (item) => {
    set((state) => {
      const existingIndex = state.cart.findIndex((i) => i.assetId === item.assetId);
      if (existingIndex >= 0) {
        const newCart = [...state.cart];
        newCart[existingIndex].quantity += item.quantity ?? 1;
        return { cart: newCart };
      }
      return {
        cart: [...state.cart, { ...item, quantity: item.quantity ?? 1 }],
      };
    });
  },

  removeFromCart: (assetId) => {
    set((state) => ({
      cart: state.cart.filter((item) => item.assetId !== assetId),
    }));
  },

  updateQuantity: (assetId, quantity) => {
    set((state) => {
      if (quantity <= 0) {
        return { cart: state.cart.filter((item) => item.assetId !== assetId) };
      }
      return {
        cart: state.cart.map((item) =>
          item.assetId === assetId ? { ...item, quantity } : item
        ),
      };
    });
  },

  clearCart: () => set({ cart: [] }),

  getCartTotal: () => {
    const { cart } = get();
    return cart.reduce((total, item) => {
      if (item.useFree) return total;
      return total + item.price * BigInt(item.quantity);
    }, BigInt(0));
  },

  getCartItemCount: () => {
    const { cart } = get();
    return cart.reduce((count, item) => count + item.quantity, 0);
  },
}));

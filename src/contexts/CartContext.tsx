import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import type { CartItem } from '../types/cart';

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: 'ADD_ITEM'; productId: string; quantity?: number }
  | { type: 'REMOVE_ITEM'; productId: string }
  | { type: 'UPDATE_QUANTITY'; productId: string; quantity: number }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; items: CartItem[] };

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  addItem: (productId: string, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

const STORAGE_KEY = 'metallics_cart';

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find((item) => item.productId === action.productId);
      if (existing) {
        return {
          items: state.items.map((item) =>
            item.productId === action.productId
              ? { ...item, quantity: item.quantity + (action.quantity ?? 1) }
              : item
          ),
        };
      }
      return {
        items: [...state.items, { productId: action.productId, quantity: action.quantity ?? 1 }],
      };
    }
    case 'REMOVE_ITEM':
      return { items: state.items.filter((item) => item.productId !== action.productId) };
    case 'UPDATE_QUANTITY': {
      if (action.quantity <= 0) {
        return { items: state.items.filter((item) => item.productId !== action.productId) };
      }
      return {
        items: state.items.map((item) =>
          item.productId === action.productId ? { ...item, quantity: action.quantity } : item
        ),
      };
    }
    case 'CLEAR_CART':
      return { items: [] };
    case 'LOAD_CART':
      return { items: action.items };
    default:
      return state;
  }
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const items = JSON.parse(stored) as CartItem[];
        if (Array.isArray(items)) {
          dispatch({ type: 'LOAD_CART', items });
        }
      }
    } catch {
      // Ignore corrupt localStorage
    }
  }, []);

  // Persist cart to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    } catch {
      // Storage quota exceeded — ignore
    }
  }, [state.items]);

  const totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);

  const value: CartContextValue = {
    items: state.items,
    totalItems,
    addItem: (productId, quantity) => dispatch({ type: 'ADD_ITEM', productId, quantity }),
    removeItem: (productId) => dispatch({ type: 'REMOVE_ITEM', productId }),
    updateQuantity: (productId, quantity) =>
      dispatch({ type: 'UPDATE_QUANTITY', productId, quantity }),
    clearCart: () => dispatch({ type: 'CLEAR_CART' }),
  };

  return <CartContext value={value}>{children}</CartContext>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}

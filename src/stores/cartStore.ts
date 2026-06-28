import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, CartState, CustomizationData, Product } from '../types';
import { generateId } from '../lib/utils';

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (product: Product, quantity: number, customizations: CustomizationData, price: number) => {
        const items = get().items;
        const existingIndex = items.findIndex(
          (item) =>
            item.product.id === product.id &&
            JSON.stringify(item.customizations) === JSON.stringify(customizations)
        );

        if (existingIndex >= 0) {
          const updatedItems = items.map((item, index) => {
            if (index === existingIndex) {
              const newQuantity = item.quantity + quantity;
              return {
                ...item,
                quantity: newQuantity,
                total_price: price * newQuantity,
              };
            }
            return item;
          });
          set({ items: updatedItems, isOpen: true });
        } else {
          const newItem: CartItem = {
            id: generateId(),
            product,
            quantity,
            customizations,
            unit_price: price,
            total_price: price * quantity,
          };
          set({ items: [...items, newItem], isOpen: true });
        }
      },

      removeItem: (id: string) => {
        set({ items: get().items.filter((item) => item.id !== id) });
      },

      updateQuantity: (id: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        set({
          items: get().items.map((item) =>
            item.id === id
              ? { ...item, quantity, total_price: item.unit_price * quantity }
              : item
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set({ isOpen: !get().isOpen }),

      getTotalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
      getTotalPrice: () => get().items.reduce((sum, item) => sum + item.total_price, 0),
    }),
    {
      name: 'rony-cart',
    }
  )
);

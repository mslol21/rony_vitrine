import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FavoritesState } from '../types';

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      ids: [],

      toggle: (id: string) => {
        const ids = get().ids;
        if (ids.includes(id)) {
          set({ ids: ids.filter((fid) => fid !== id) });
        } else {
          set({ ids: [...ids, id] });
        }
      },

      isFavorite: (id: string) => get().ids.includes(id),

      clear: () => set({ ids: [] }),
    }),
    {
      name: 'rony-favorites',
    }
  )
);

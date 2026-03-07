import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Influencer {
    id: string;
    name: string;
    avatarUrl?: string;
}

interface ActiveInfluencerState {
    activeInfluencer: Influencer | null;
    setActiveInfluencer: (influencer: Influencer | null) => void;
}

export const useActiveInfluencerStore = create<ActiveInfluencerState>()(
    persist(
        (set) => ({
            activeInfluencer: null,
            setActiveInfluencer: (influencer) => set({ activeInfluencer: influencer }),
        }),
        {
            name: 'active-influencer-storage',
        }
    )
);

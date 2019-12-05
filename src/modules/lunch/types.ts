export type WeightedOption = LunchOption & { weight: number };

export interface LunchOption {
    name: string;
    category: string;
    icon?: string;
}

export interface LunchRecord {
    option: LunchOption | null;
    date: string;
    /** list of user IDs */
    participants: string[];
    successful: boolean;
    rerollVoters?: string[];
    rating?: number;
}

export interface LunchStore {
    today: LunchRecord;
    history: LunchRecord[];
    options: LunchOption[];
    categories: string[];
}

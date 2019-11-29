export interface LunchOption {
    name: string;
    category: string;
}

export interface LunchRecord {
    option: LunchOption | null;
    date: string;
    /** list of user IDs */
    participants: string[];
    successful: boolean;
}

export interface LunchStore {
    today: LunchRecord | null;
    history: LunchRecord[];
    options: LunchOption[];
    categories: string[];
}

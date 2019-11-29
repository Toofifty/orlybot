import Store from './store';
import { User, Dict } from './types';

/**
 * Persist data from users
 */
class UserData {
    private store: Store<Dict<User>>;

    constructor() {
        this.store = Store.create('users', {} as Dict<User>);
    }

    /**
     * Set user key value
     */
    set<T>(user: string | User, key: string, value: T) {
        const id = typeof user === 'object' ? user.id : user;

        if (!this.store.get([id])) {
            this.store.commit([id], {
                id,
                name: 'unknown',
                profile: { display_name: 'unknown' },
            });
        }

        return this.store.commit([id, key as any], value);
    }

    /**
     * Get user key value
     */
    get<T>(user: string | User, key: string, def: T = null) {
        if (typeof user === 'object') {
            user = user.id;
        }
        return this.store.get([user, key as any], def);
    }

    /**
     * Update a stored value via a callback
     */
    update<T>(
        user: string | User,
        key: string,
        updater: (prev: T) => T,
        def: T = null
    ): T {
        if (typeof user === 'object') {
            user = user.id;
        }
        return this.store.update([user, key as any], updater, def);
    }

    /**
     * Get all stored data for the user
     */
    all(user: string | User) {
        if (typeof user === 'object') {
            user = user.id;
        }
        return this.store.get([user]);
    }

    /**
     * Get all user IDs
     */
    get allUsers(): string[] {
        return Object.keys(this.store.getData());
    }
}

export default new UserData();

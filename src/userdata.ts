import Store from './store';
import { User } from 'types';

/**
 * Persist data from users
 */
class UserData {
    private store: Store;

    constructor() {
        this.store = Store.create('userdata', {});
    }

    /**
     * Set user key value
     */
    set<T>(user: string | User, key: string, value: T) {
        if (typeof user === 'object') {
            user = user.id;
        }
        if (!this.store.get(user)) {
            this.store.commit(user, {});
        }

        return this.store.commit([user, key], value);
    }

    /**
     * Get user key value
     */
    get<T>(user: string | User, key: string, def: T = null) {
        if (typeof user === 'object') {
            user = user.id;
        }
        return this.store.get([user, key], def);
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
        return this.store.update([user, key], updater, def);
    }

    /**
     * Get all stored data for the user
     */
    all(user: string | User) {
        if (typeof user === 'object') {
            user = user.id;
        }
        return this.store.get(user);
    }

    /**
     * Get all user IDs
     */
    get allUsers(): string[] {
        return Object.keys(this.store.getData());
    }
}

export default new UserData();

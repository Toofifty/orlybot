import { readfile, writefile } from './util';

export interface ChanneledStore<T> {
    [channel: string]: T;
}

/**
 * Persistent data storage
 *
 * Usage:
 *
 * const store = Store.create('name', {
 *     value: 'default',
 *     other: {
 *         more: 'values'
 *     }
 * })
 *
 * store.get('other.more') => 'values'
 * store.get(['other', 'more']) => 'values'
 * store.get('other.not_there', 'missing') => 'missing'
 * store.commit('value', 'changed') => 'changed'
 * store.get('value') => 'changed'
 */
export default class Store<T> {
    private name: string;
    private data: T;

    private constructor(name: string, initial?: T) {
        this.name = name;
        this.data = { ...initial };
    }

    /**
     * Create a new persistent store. The initial data in
     * the store will be loaded asynchronously, so if you need
     * to wait for it to load use `createAsync` instead
     *
     * It will be saved to `/data/{name}.json`
     */
    public static create<T>(name: string, initial?: T): Store<T> {
        const store = new Store(name, initial);
        store._load();
        return store;
    }

    /**
     * Create a new persistent store asynchronously
     */
    public static async createAsync<T>(
        name: string,
        initial?: T
    ): Promise<Store<T>> {
        const store = new Store(name, initial);
        await store._load();
        return store;
    }

    /**
     * File path
     */
    private get file(): string {
        return `./data/${this.name}.json`;
    }

    /**
     * Load store data from disk
     *
     * If this fails (file not found, IO exception), it will attempt
     * to write the current state into the file. This will write
     * the initial state for new stores.
     */
    private async _load() {
        try {
            const data = await readfile(this.file, 'utf8');
            this.data = JSON.parse(data || '{}');
        } catch (err) {
            this._save();
        }
    }

    /**
     * Store data to dask
     */
    private async _save() {
        try {
            await writefile(this.file, JSON.stringify(this.data));
        } catch (err) {
            console.error(err);
        }
    }

    public commit<P0 extends keyof T>(path: [P0], value: T[P0]): T[P0];
    public commit<P0 extends keyof T, P1 extends keyof T[P0]>(
        path: [P0, P1],
        value: T[P0][P1]
    ): T[P0][P1];
    public commit<
        P0 extends keyof T,
        P1 extends keyof T[P0],
        P2 extends keyof T[P0][P1]
    >(path: [P0, P1, P2], value: T[P0][P1][P2]): T[P0][P1][P2];
    public commit<
        P0 extends keyof T,
        P1 extends keyof T[P0],
        P2 extends keyof T[P0][P1],
        P3 extends keyof T[P0][P1][P2]
    >(path: [P0, P1, P2, P3], value: T[P0][P1][P2][P3]): T[P0][P1][P2][P3];
    public commit<
        P0 extends keyof T,
        P1 extends keyof T[P0],
        P2 extends keyof T[P0][P1],
        P3 extends keyof T[P0][P1][P2],
        P4 extends keyof T[P0][P1][P2][P3]
    >(
        path: [P0, P1, P2, P3, P4],
        value: T[P0][P1][P2][P3][P4]
    ): T[P0][P1][P2][P3][P4];

    /**
     * Commit a value to the store
     */
    public commit(path: string[], value: any): any {
        try {
            const target = path.pop();
            const item = path.reduce(
                (item: any, prop: string | number) => item[prop],
                this.data
            );
            item[target] = value;
            this._save();
            return value;
        } catch (err) {
            throw new TypeError(
                `Invalid path name in ${this.name} store: ${path.join('/')}`
            );
        }
    }

    public update<P0 extends keyof T>(
        path: [P0],
        updater: (prev: T[P0]) => T[P0],
        def?: T[P0]
    ): T[P0];
    public update<P0 extends keyof T, P1 extends keyof T[P0]>(
        path: [P0, P1],
        updater: (prev: T[P0][P1]) => T[P0][P1],
        def?: T[P0][P1]
    ): T[P0][P1];
    public update<
        P0 extends keyof T,
        P1 extends keyof T[P0],
        P2 extends keyof T[P0][P1]
    >(
        path: [P0, P1, P2],
        updater: (prev: T[P0][P1][P2]) => T[P0][P1][P2],
        def?: T[P0][P1][P2]
    ): T[P0][P1][P2];
    public update<
        P0 extends keyof T,
        P1 extends keyof T[P0],
        P2 extends keyof T[P0][P1],
        P3 extends keyof T[P0][P1][P2]
    >(
        path: [P0, P1, P2, P3],
        updater: (prev: T[P0][P1][P2][P3]) => T[P0][P1][P2][P3],
        def?: T[P0][P1][P2][P3]
    ): T[P0][P1][P2][P3];
    public update<
        P0 extends keyof T,
        P1 extends keyof T[P0],
        P2 extends keyof T[P0][P1],
        P3 extends keyof T[P0][P1][P2],
        P4 extends keyof T[P0][P1][P2][P3]
    >(
        path: [P0, P1, P2, P3, P4],
        updater: (prev: T[P0][P1][P2][P3][P4]) => T[P0][P1][P2][P3][P4],
        def?: T[P0][P1][P2][P3][P4]
    ): T[P0][P1][P2][P3][P4];

    /**
     * Update a stored value via a callback, and return
     * the result
     */
    public update(path: string[], updater: (prev: any) => any, def?: any): any {
        return this.commit(path as any, updater(this.get(path as any, def)));
    }

    public get<P0 extends keyof T>(path: [P0], def?: T[P0]): T[P0];
    public get<P0 extends keyof T, P1 extends keyof T[P0]>(
        path: [P0, P1],
        def?: T[P0][P1]
    ): T[P0][P1];
    public get<
        P0 extends keyof T,
        P1 extends keyof T[P0],
        P2 extends keyof T[P0][P1]
    >(path: [P0, P1, P2], def?: T[P0][P1][P2]): T[P0][P1][P2];
    public get<
        P0 extends keyof T,
        P1 extends keyof T[P0],
        P2 extends keyof T[P0][P1],
        P3 extends keyof T[P0][P1][P2]
    >(path: [P0, P1, P2, P3], def?: T[P0][P1][P2][P3]): T[P0][P1][P2][P3];
    public get<
        P0 extends keyof T,
        P1 extends keyof T[P0],
        P2 extends keyof T[P0][P1],
        P3 extends keyof T[P0][P1][P2],
        P4 extends keyof T[P0][P1][P2][P3]
    >(
        path: [P0, P1, P2, P3, P4],
        def?: T[P0][P1][P2][P3][P4]
    ): T[P0][P1][P2][P3][P4];

    /**
     * Get a value from the store
     */
    public get(path: string[], def?: any): any {
        try {
            const result = path.reduce(
                (item: any, prop: string | number) => item[prop],
                this.data
            );
            if (result === undefined) throw 'reee';
            return result;
        } catch (err) {
            if (def) this.commit(path as any, def);
            return def;
        }
    }

    /**
     * Get stored data
     */
    public getData(): any {
        return this.data;
    }
}

import { readfile, writefile } from './util';
import { Dict } from 'types';

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
export default class Store {
    private name: string;
    private data: Dict<any>;

    private constructor(name: string, initial: Dict<any>) {
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
    public static create(name: string, initial: Dict<any>): Store {
        const store = new Store(name, initial);
        store._load();
        return store;
    }

    /**
     * Create a new persistent store asynchronously
     */
    public static async createAsync(
        name: string,
        initial: Dict<any>
    ): Promise<Store> {
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

    /**
     * Get split parts from a path
     */
    private static _parts(path: string | string[]): string[] {
        if (Array.isArray(path)) {
            return path;
        }
        return path.split('.');
    }

    /**
     * Commit a value to the store
     */
    public commit<T>(path: string | string[], value: T): T {
        try {
            const props = Store._parts(path);
            const target = props.pop();
            const item = props.reduce(
                (item: any, prop: string | number) => item[prop],
                this.data
            );
            item[target] = value;
            this._save();
            return value;
        } catch (err) {
            throw new TypeError(
                `Invalid path name in ${this.name} store: ${Store._parts(
                    path
                ).join('/')}`
            );
        }
    }

    /**
     * Get a value from the store
     */
    public get<T>(path: string | string[], def?: T): any | T {
        try {
            const result = Store._parts(path).reduce(
                (item: any, prop: string | number) => item[prop],
                this.data
            );
            if (result === undefined) throw 'reee';
            return result;
        } catch (err) {
            if (def) this.commit(path, def);
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

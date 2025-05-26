import { GameSettings } from '../../types';
import { GameEventBus } from '../eventBus/gameEventBus';
import { Logger } from '../logger';

/**
 * Settings service for storing and retrieving game settings in IndexedDB
 */
export class Settings {
    private static _instance: Settings;
    private static readonly DB_NAME_PREFIX = 'BGA_Settings_';
    private static readonly STORE_NAME = 'game_settings';
    private static readonly DB_VERSION = 1;

    private dbName: string = '';
    private db: IDBDatabase | null = null;
    private initialized: boolean = false;
    private initPromise: Promise<boolean> | null = null;

    // Cache for fast access
    private cache: Map<string, any> = new Map();

    // Pending promises for in-flight requests to avoid duplicate DB queries
    private pendingGets: Map<string, Promise<any>> = new Map();

    /**
     * Get the singleton instance of the Settings service
     */
    public static get instance(): Settings {
        if (!Settings._instance) {
            Settings._instance = new Settings();
        }
        return Settings._instance;
    }

    /**
     * Private constructor to enforce singleton pattern
     */
    private constructor() {}

    /**
     * Initialize the settings service with the game name
     * @param gameName The name of the game to use for the database name
     */
    public initialize(gameName: string): Promise<boolean> {
        if (this.initPromise) {
            return this.initPromise;
        }

        this.dbName = `${Settings.DB_NAME_PREFIX}${gameName}`;
        Logger.debug(`Initializing Settings with database: ${this.dbName}`);

        this.initPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, Settings.DB_VERSION);

            request.onerror = (event) => {
                Logger.error('Failed to open IndexedDB', event);
                this.initialized = false;
                resolve(false);
            };

            request.onsuccess = (event) => {
                this.db = (event.target as IDBOpenDBRequest).result;
                this.initialized = true;
                Logger.debug('Settings IndexedDB opened successfully');

                // Load all settings into cache
                this.loadCache().then(() => {
                    resolve(true);
                });
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(Settings.STORE_NAME)) {
                    db.createObjectStore(Settings.STORE_NAME);
                    Logger.debug('Settings store created');
                }
            };
        });

        return this.initPromise;
    }

    /**
     * Load all settings into the cache
     */
    private async loadCache(): Promise<void> {
        try {
            const allSettings = await this.getAllFromDB();
            for (const [key, value] of Object.entries(allSettings)) {
                this.cache.set(key, value);
            }
            Logger.debug(`Loaded ${this.cache.size} settings into cache`);
        } catch (error) {
            Logger.error('Failed to load settings into cache', error);
        }
    }

    /**
     * Check if the settings service is initialized
     */
    private checkInitialized(): void {
        if (!this.initialized || !this.db) {
            throw new Error('Settings service not initialized. Call initialize() first.');
        }
    }

    /**
     * Get a setting value by key
     *
     * This method always returns a Promise, but resolves instantly when the value is cached.
     *
     * @param key The setting key
     * @param defaultValue The default value to return if the setting doesn't exist
     * @returns Promise that resolves to the setting value
     */
    public get<K extends keyof GameSettings>(
        key: K,
        defaultValue?: GameSettings[K],
    ): Promise<GameSettings[K] | undefined> {
        const cacheKey = key as string;

        // If value is in cache, return a pre-resolved promise
        if (this.cache.has(cacheKey)) {
            return Promise.resolve(this.cache.get(cacheKey));
        }

        // If there's already a pending request for this key, return that promise
        if (this.pendingGets.has(cacheKey)) {
            return this.pendingGets.get(cacheKey)!;
        }

        // Otherwise, fetch from DB and update cache
        this.checkInitialized();

        const promise = new Promise<GameSettings[K] | undefined>((resolve) => {
            const transaction = this.db!.transaction([Settings.STORE_NAME], 'readonly');
            const store = transaction.objectStore(Settings.STORE_NAME);
            const request = store.get(cacheKey);

            request.onerror = (event) => {
                Logger.error(`Error getting setting: ${key}`, event);
                this.pendingGets.delete(cacheKey);
                resolve(defaultValue);
            };

            request.onsuccess = () => {
                const result = request.result;
                if (result !== undefined) {
                    this.cache.set(cacheKey, result);
                }
                this.pendingGets.delete(cacheKey);
                resolve(result !== undefined ? result : defaultValue);
            };
        });

        // Store the promise to avoid duplicate requests
        this.pendingGets.set(cacheKey, promise);

        return promise;
    }

    /**
     * Set a setting value
     * @param key The setting key
     * @param value The value to store
     */
    public async set<K extends keyof GameSettings>(key: K, value: GameSettings[K]): Promise<boolean> {
        this.checkInitialized();
        const cacheKey = key as string;

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([Settings.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(Settings.STORE_NAME);
            const request = store.put(value, cacheKey);

            request.onerror = (event) => {
                Logger.error(`Error setting value for: ${key}`, event);
                resolve(false);
            };

            request.onsuccess = () => {
                this.cache.set(cacheKey, value);
                Logger.debug(`Setting saved: ${key}`);
                GameEventBus.instance.emit('settingChanged', { key, value });
                resolve(true);
            };
        });
    }

    /**
     * Set multiple setting values at once
     * @param settings The settings to store
     */
    public async bulkSet(settings: Partial<GameSettings>): Promise<boolean> {
        this.checkInitialized();

        const transaction = this.db!.transaction([Settings.STORE_NAME], 'readwrite');
        const store = transaction.objectStore(Settings.STORE_NAME);

        const promises = Object.entries(settings).map(([key, value]) => {
            return new Promise((resolve, reject) => {
                const request = store.put(value, key);
                request.onerror = (event) => {
                    Logger.error(`Error setting value for: ${key}`, event);
                    resolve(false);
                };
                request.onsuccess = () => {
                    this.cache.set(key, value);
                    Logger.debug(`Setting saved: ${key}`);
                    GameEventBus.instance.emit('settingChanged', { key: key as keyof GameSettings, value });
                    resolve(true);
                };
            });
        });

        try {
            await Promise.all(promises);
            return true;
        } catch (error) {
            Logger.error('Error bulk setting values', error);
            return false;
        }
    }

    /**
     * Remove a setting (from both cache and DB)
     * @param key The setting key to remove
     */
    public async remove<K extends keyof GameSettings>(key: K): Promise<boolean> {
        this.checkInitialized();
        const cacheKey = key as string;

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([Settings.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(Settings.STORE_NAME);
            const request = store.delete(cacheKey);

            request.onerror = (event) => {
                Logger.error(`Error removing setting: ${key}`, event);
                resolve(false);
            };

            request.onsuccess = () => {
                this.cache.delete(cacheKey);
                Logger.debug(`Setting removed: ${key}`);
                resolve(true);
            };
        });
    }

    /**
     * Get all settings for the current game from DB
     */
    private async getAllFromDB(): Promise<Record<string, any>> {
        this.checkInitialized();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([Settings.STORE_NAME], 'readonly');
            const store = transaction.objectStore(Settings.STORE_NAME);
            const request = store.getAll();
            const keyRequest = store.getAllKeys();

            const result: Record<string, any> = {};

            keyRequest.onsuccess = () => {
                const keys = keyRequest.result as string[];

                request.onsuccess = () => {
                    const values = request.result;

                    keys.forEach((key, index) => {
                        result[key] = values[index];
                    });

                    resolve(result);
                };
            };

            keyRequest.onerror = (event) => {
                Logger.error('Error getting all settings', event);
                resolve({});
            };
        });
    }

    /**
     * Clear all settings for the current game
     */
    public async clearAll(): Promise<boolean> {
        this.checkInitialized();

        const allSettings = await this.getAllFromDB();
        const keys = Object.keys(allSettings);

        const promises = keys.map((key) => this.remove(key as keyof GameSettings));
        // Note: Each remove operation will update the cache on success

        try {
            await Promise.all(promises);
            return true;
        } catch (error) {
            Logger.error('Error clearing all settings', error);
            return false;
        }
    }
}

/**
 * Storage module - handles LocalStorage operations, state management, and data migration
 */

const STORAGE_KEY = 'promptboard:v1';
const CURRENT_VERSION = 1;

/**
 * Generate UUID v4
 */
export const uuid = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

/**
 * Get current timestamp
 */
export const now = () => Date.now();

/**
 * Default state structure
 */
const defaultState = {
    version: CURRENT_VERSION,
    prompts: []
};

/**
 * Get current state from localStorage
 */
export const getState = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            return { ...defaultState };
        }
        
        const parsed = JSON.parse(stored);
        return migrate(parsed);
    } catch (error) {
        console.warn('Failed to load state from localStorage:', error);
        return { ...defaultState };
    }
};

/**
 * Save state to localStorage
 */
export const setState = (state) => {
    try {
        const stateToSave = {
            ...state,
            version: CURRENT_VERSION
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
        return true;
    } catch (error) {
        console.error('Failed to save state to localStorage:', error);
        return false;
    }
};

/**
 * Migrate data from older versions
 */
export const migrate = (data) => {
    if (!data || typeof data !== 'object') {
        return { ...defaultState };
    }

    // If no version, assume version 1
    const version = data.version || 1;
    
    let migrated = { ...data };

    // Future migrations can be added here
    // Example:
    // if (version < 2) {
    //     migrated = migrateToV2(migrated);
    // }

    // Ensure required fields exist
    if (!migrated.prompts || !Array.isArray(migrated.prompts)) {
        migrated.prompts = [];
    }

    // Validate and clean up prompts
    migrated.prompts = migrated.prompts
        .filter(prompt => prompt && typeof prompt === 'object')
        .map(prompt => ({
            id: prompt.id || uuid(),
            title: prompt.title || 'Untitled',
            content: prompt.content || '',
            tags: Array.isArray(prompt.tags) ? prompt.tags : [],
            createdAt: prompt.createdAt || now(),
            updatedAt: prompt.updatedAt || now()
        }));

    migrated.version = CURRENT_VERSION;
    
    return migrated;
};

/**
 * Clear all data (useful for testing/reset)
 */
export const clearStorage = () => {
    try {
        localStorage.removeItem(STORAGE_KEY);
        return true;
    } catch (error) {
        console.error('Failed to clear storage:', error);
        return false;
    }
};

/**
 * Get storage size info
 */
export const getStorageInfo = () => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return {
            size: data ? data.length : 0,
            sizeKB: data ? Math.round(data.length / 1024 * 100) / 100 : 0
        };
    } catch (error) {
        return { size: 0, sizeKB: 0 };
    }
};

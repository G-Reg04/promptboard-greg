/**
 * Storage module - handles LocalStorage operations, state management, and data migration
 */

const STORAGE_KEY = 'promptboard:v1';
const PREFERENCES_KEY = 'promptboard:prefs:v1';
const VARIABLES_KEY_PREFIX = 'promptboard:vars:v1:';
const BACKUPS_KEY = 'promptboard:backups:v1';
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

/**
 * Default preferences
 */
const defaultPreferences = {
    autoBackupEnabled: true,
    autoBackupThreshold: 10,
    changeCounter: 0
};

/**
 * Get user preferences
 */
export const getPreferences = () => {
    try {
        const stored = localStorage.getItem(PREFERENCES_KEY);
        if (!stored) {
            return { ...defaultPreferences };
        }
        
        const parsed = JSON.parse(stored);
        return { ...defaultPreferences, ...parsed };
    } catch (error) {
        console.warn('Failed to load preferences:', error);
        return { ...defaultPreferences };
    }
};

/**
 * Save user preferences
 */
export const setPreferences = (preferences) => {
    try {
        localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
        return true;
    } catch (error) {
        console.error('Failed to save preferences:', error);
        return false;
    }
};

/**
 * Increment change counter for auto-backup
 */
export const incrementChangeCounter = () => {
    const prefs = getPreferences();
    prefs.changeCounter = (prefs.changeCounter || 0) + 1;
    setPreferences(prefs);
    return prefs.changeCounter;
};

/**
 * Reset change counter
 */
export const resetChangeCounter = () => {
    const prefs = getPreferences();
    prefs.changeCounter = 0;
    setPreferences(prefs);
};

/**
 * Get cached variables for a prompt
 */
export const getPromptVariables = (promptId) => {
    try {
        const stored = localStorage.getItem(VARIABLES_KEY_PREFIX + promptId);
        return stored ? JSON.parse(stored) : {};
    } catch (error) {
        console.warn('Failed to load prompt variables:', error);
        return {};
    }
};

/**
 * Save cached variables for a prompt
 */
export const setPromptVariables = (promptId, variables) => {
    try {
        localStorage.setItem(VARIABLES_KEY_PREFIX + promptId, JSON.stringify(variables));
        return true;
    } catch (error) {
        console.error('Failed to save prompt variables:', error);
        return false;
    }
};

/**
 * Get local backups (ring buffer)
 */
export const getLocalBackups = () => {
    try {
        const stored = localStorage.getItem(BACKUPS_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.warn('Failed to load local backups:', error);
        return [];
    }
};

/**
 * Save local backup (maintain ring buffer of max 3 items)
 */
export const saveLocalBackup = (data) => {
    try {
        const backups = getLocalBackups();
        const newBackup = {
            id: uuid(),
            timestamp: now(),
            data: data
        };
        
        // Add to beginning and keep only last 3
        backups.unshift(newBackup);
        const trimmedBackups = backups.slice(0, 3);
        
        localStorage.setItem(BACKUPS_KEY, JSON.stringify(trimmedBackups));
        return newBackup;
    } catch (error) {
        console.error('Failed to save local backup:', error);
        return null;
    }
};

/**
 * Clear all prompt variables cache
 */
export const clearAllPromptVariables = () => {
    try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(VARIABLES_KEY_PREFIX)) {
                localStorage.removeItem(key);
            }
        });
        return true;
    } catch (error) {
        console.error('Failed to clear prompt variables:', error);
        return false;
    }
};

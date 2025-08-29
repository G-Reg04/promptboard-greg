/**
 * I/O module - handles import/export functionality (JSON and Markdown)
 */

import { getState, getPreferences, resetChangeCounter, saveLocalBackup, getLocalBackups } from './storage.js';
import { downloadFile, formatDate, formatDateTime } from './utils.js';
import { batchCreatePrompts } from './logic.js';
import { showToast, showConfirmDialog } from './render.js';

/**
 * Export all data as JSON
 */
export const exportToJSON = () => {
    try {
        const state = getState();
        const exportData = {
            ...state,
            exportedAt: Date.now(),
            exportedBy: 'PromptBoard'
        };

        const jsonString = JSON.stringify(exportData, null, 2);
        const filename = `promptboard-export-${new Date().toISOString().split('T')[0]}.json`;
        
        downloadFile(jsonString, filename, 'application/json');
        showToast('JSON export downloaded', 'success');
        
        return true;
    } catch (error) {
        console.error('Export failed:', error);
        showToast('Export failed', 'error');
        return false;
    }
};

/**
 * Export all data as Markdown
 */
export const exportToMarkdown = () => {
    try {
        const state = getState();
        const prompts = state.prompts || [];

        if (prompts.length === 0) {
            showToast('No prompts to export', 'warning');
            return false;
        }

        // Sort prompts by update date (newest first)
        const sortedPrompts = [...prompts].sort((a, b) => b.updatedAt - a.updatedAt);

        let markdown = `# PromptBoard Export\n\n`;
        markdown += `Exported on: ${formatDate(Date.now())}\n`;
        markdown += `Total prompts: ${prompts.length}\n\n`;
        
        markdown += '---\n\n';

        sortedPrompts.forEach((prompt, index) => {
            markdown += `## ${prompt.title}\n\n`;
            
            if (prompt.tags && prompt.tags.length > 0) {
                markdown += `**Tags:** ${prompt.tags.join(', ')}\n\n`;
            }
            
            if (prompt.content) {
                markdown += `${prompt.content}\n\n`;
            }
            
            markdown += `*Created: ${formatDate(prompt.createdAt)}*\n`;
            markdown += `*Updated: ${formatDate(prompt.updatedAt)}*\n\n`;
            
            if (index < sortedPrompts.length - 1) {
                markdown += '---\n\n';
            }
        });

        const filename = `promptboard-export-${new Date().toISOString().split('T')[0]}.md`;
        downloadFile(markdown, filename, 'text/markdown');
        showToast('Markdown export downloaded', 'success');
        
        return true;
    } catch (error) {
        console.error('Markdown export failed:', error);
        showToast('Markdown export failed', 'error');
        return false;
    }
};

/**
 * Parse and validate imported JSON data
 */
const parseImportData = (jsonString) => {
    try {
        const data = JSON.parse(jsonString);
        
        // Check if it's a valid PromptBoard export
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid file format');
        }

        // Extract prompts array
        let prompts = [];
        
        if (Array.isArray(data)) {
            // Direct array of prompts
            prompts = data;
        } else if (data.prompts && Array.isArray(data.prompts)) {
            // PromptBoard format
            prompts = data.prompts;
        } else {
            throw new Error('No valid prompts array found');
        }

        // Validate each prompt
        const validPrompts = [];
        const errors = [];

        prompts.forEach((prompt, index) => {
            if (!prompt || typeof prompt !== 'object') {
                errors.push(`Item ${index + 1}: Invalid prompt object`);
                return;
            }

            if (!prompt.title || typeof prompt.title !== 'string') {
                errors.push(`Item ${index + 1}: Missing or invalid title`);
                return;
            }

            // Normalize prompt data
            const normalizedPrompt = {
                title: prompt.title.trim(),
                content: prompt.content || '',
                tags: Array.isArray(prompt.tags) ? prompt.tags : [],
                createdAt: prompt.createdAt || Date.now(),
                updatedAt: prompt.updatedAt || Date.now()
            };

            validPrompts.push(normalizedPrompt);
        });

        if (errors.length > 0 && validPrompts.length === 0) {
            throw new Error(`Import failed:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n...' : ''}`);
        }

        return {
            prompts: validPrompts,
            errors: errors,
            totalCount: prompts.length,
            validCount: validPrompts.length
        };

    } catch (error) {
        if (error instanceof SyntaxError) {
            throw new Error('Invalid JSON format');
        }
        throw error;
    }
};

/**
 * Show import confirmation dialog
 */
const showImportDialog = (importData) => {
    return new Promise((resolve) => {
        const container = document.getElementById('modal-container');
        if (!container) {
            resolve(null);
            return;
        }

        const { prompts, errors, totalCount, validCount } = importData;

        container.innerHTML = `
            <div id="import-overlay" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div
                    id="import-dialog"
                    class="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg"
                    role="dialog"
                    aria-labelledby="import-title"
                    aria-modal="true"
                >
                    <div class="p-6">
                        <h3 id="import-title" class="text-lg font-semibold text-white mb-4">
                            Import Prompts
                        </h3>
                        
                        <div class="bg-gray-700 rounded-lg p-4 mb-6">
                            <div class="text-sm text-gray-300">
                                <div class="flex justify-between mb-2">
                                    <span>Total items:</span>
                                    <span class="font-medium">${totalCount}</span>
                                </div>
                                <div class="flex justify-between mb-2">
                                    <span>Valid prompts:</span>
                                    <span class="font-medium text-green-400">${validCount}</span>
                                </div>
                                ${errors.length > 0 ? `
                                    <div class="flex justify-between mb-2">
                                        <span>Errors:</span>
                                        <span class="font-medium text-red-400">${errors.length}</span>
                                    </div>
                                ` : ''}
                            </div>
                            
                            ${errors.length > 0 ? `
                                <details class="mt-3">
                                    <summary class="text-sm text-red-400 cursor-pointer hover:text-red-300">
                                        View errors (${errors.length})
                                    </summary>
                                    <div class="mt-2 text-xs text-red-300 max-h-32 overflow-y-auto">
                                        ${errors.slice(0, 10).map(error => `<div class="mb-1">• ${error}</div>`).join('')}
                                        ${errors.length > 10 ? `<div class="text-gray-400">... and ${errors.length - 10} more</div>` : ''}
                                    </div>
                                </details>
                            ` : ''}
                        </div>
                        
                        ${validCount > 0 ? `
                            <p class="text-gray-300 mb-6">
                                How would you like to import these prompts?
                            </p>
                            
                            <div class="space-y-3 mb-6">
                                <label class="flex items-center">
                                    <input type="radio" name="import-mode" value="merge" checked 
                                           class="mr-3 text-blue-600 focus:ring-blue-500 focus:ring-2">
                                    <div>
                                        <div class="font-medium text-white">Merge</div>
                                        <div class="text-sm text-gray-400">Add new prompts, skip duplicates</div>
                                    </div>
                                </label>
                                
                                <label class="flex items-center">
                                    <input type="radio" name="import-mode" value="replace" 
                                           class="mr-3 text-blue-600 focus:ring-blue-500 focus:ring-2">
                                    <div>
                                        <div class="font-medium text-white">Replace</div>
                                        <div class="text-sm text-gray-400">Replace all existing prompts</div>
                                    </div>
                                </label>
                            </div>
                            
                            <div class="flex justify-end gap-3">
                                <button
                                    id="import-cancel-btn"
                                    class="px-4 py-2 text-gray-300 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 rounded"
                                >
                                    Cancel
                                </button>
                                <button
                                    id="import-confirm-btn"
                                    class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                                >
                                    Import ${validCount} Prompts
                                </button>
                            </div>
                        ` : `
                            <p class="text-red-400 mb-6">
                                No valid prompts found to import.
                            </p>
                            
                            <div class="flex justify-end">
                                <button
                                    id="import-cancel-btn"
                                    class="px-4 py-2 text-gray-300 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 rounded"
                                >
                                    Close
                                </button>
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;

        const handleResolve = (result) => {
            container.innerHTML = '';
            resolve(result);
        };

        document.getElementById('import-cancel-btn').onclick = () => handleResolve(null);
        
        if (validCount > 0) {
            document.getElementById('import-confirm-btn').onclick = () => {
                const mode = document.querySelector('input[name="import-mode"]:checked')?.value || 'merge';
                handleResolve({ prompts, mode });
            };
        }

        document.getElementById('import-overlay').onclick = (e) => {
            if (e.target.id === 'import-overlay') {
                handleResolve(null);
            }
        };

        // Focus first interactive element
        const firstButton = container.querySelector('button');
        firstButton?.focus();
    });
};

/**
 * Import prompts from JSON file
 */
export const importFromJSON = async (file) => {
    try {
        // Validate file
        if (!file) {
            showToast('No file selected', 'error');
            return false;
        }

        if (!file.name.toLowerCase().endsWith('.json')) {
            showToast('Please select a JSON file', 'error');
            return false;
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            showToast('File too large (max 10MB)', 'error');
            return false;
        }

        // Read file
        const fileContent = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });

        // Parse and validate
        const importData = parseImportData(fileContent);

        if (importData.validCount === 0) {
            showToast('No valid prompts found in file', 'error');
            return false;
        }

        // Show import dialog
        const importChoice = await showImportDialog(importData);
        
        if (!importChoice) {
            return false; // User cancelled
        }

        // Perform import
        const results = batchCreatePrompts(importChoice.prompts, importChoice.mode);

        // Show results
        if (results.created > 0) {
            const message = `Imported ${results.created} prompts` + 
                          (results.skipped > 0 ? `, skipped ${results.skipped}` : '');
            showToast(message, 'success');
        }

        if (results.errors.length > 0) {
            console.warn('Import errors:', results.errors);
            if (results.created === 0) {
                showToast('Import failed with errors', 'error');
            }
        }

        return results.created > 0;

    } catch (error) {
        console.error('Import failed:', error);
        showToast(error.message || 'Import failed', 'error');
        return false;
    }
};

/**
 * Handle file input change for import
 */
export const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    if (file) {
        const success = await importFromJSON(file);
        // Clear the input so the same file can be selected again
        event.target.value = '';
        return success;
    }
    return false;
};

/**
 * Get export statistics
 */
export const getExportStats = () => {
    const state = getState();
    const prompts = state.prompts || [];
    
    if (prompts.length === 0) {
        return null;
    }

    const totalTags = new Set();
    let totalContent = 0;
    
    prompts.forEach(prompt => {
        prompt.tags.forEach(tag => totalTags.add(tag));
        totalContent += prompt.content.length;
    });

    return {
        promptCount: prompts.length,
        tagCount: totalTags.size,
        totalContentLength: totalContent,
        averageContentLength: Math.round(totalContent / prompts.length),
        estimatedJsonSize: Math.round(JSON.stringify(state).length / 1024), // KB
        oldestPrompt: Math.min(...prompts.map(p => p.createdAt)),
        newestPrompt: Math.max(...prompts.map(p => p.updatedAt))
    };
};

/**
 * Create backup blob data
 */
export const makeBackupBlob = () => {
    const state = getState();
    const exportData = {
        ...state,
        exportedAt: Date.now(),
        exportedBy: 'PromptBoard Auto-Backup'
    };
    
    return JSON.stringify(exportData, null, 2);
};

/**
 * Check if auto-backup should be triggered and execute if needed
 */
export const autoBackupMaybe = () => {
    const prefs = getPreferences();
    
    if (!prefs.autoBackupEnabled) {
        return false;
    }
    
    if ((prefs.changeCounter || 0) >= prefs.autoBackupThreshold) {
        return triggerAutoBackup();
    }
    
    return false;
};

/**
 * Trigger auto-backup: download file and save to local ring buffer
 */
const triggerAutoBackup = () => {
    try {
        const backupData = makeBackupBlob();
        const timestamp = formatDateTime(true).replace(/[:\s]/g, '').replace(/-/g, '');
        const filename = `promptboard-autobackup-${timestamp}.json`;
        
        // Download backup file
        downloadFile(backupData, filename, 'application/json');
        
        // Save to local ring buffer
        const state = getState();
        saveLocalBackup(state);
        
        // Reset counter
        resetChangeCounter();
        
        showToast('Auto-backup saved', 'success');
        
        return true;
    } catch (error) {
        console.error('Auto-backup failed:', error);
        showToast('Auto-backup failed', 'error');
        return false;
    }
};

/**
 * Get list of local backups with formatted info
 */
export const listLocalBackups = () => {
    const backups = getLocalBackups();
    
    return backups.map(backup => ({
        ...backup,
        formattedDate: formatDate(backup.timestamp),
        promptCount: backup.data?.prompts?.length || 0
    }));
};

/**
 * Restore backup from local ring buffer
 */
export const restoreLocalBackup = async (backupId, mode = 'merge') => {
    try {
        const backups = getLocalBackups();
        const backup = backups.find(b => b.id === backupId);
        
        if (!backup) {
            showToast('Backup not found', 'error');
            return false;
        }
        
        if (!backup.data || !backup.data.prompts) {
            showToast('Invalid backup data', 'error');
            return false;
        }
        
        // Use existing import logic
        const results = batchCreatePrompts(backup.data.prompts, mode);
        
        if (results.created > 0) {
            const message = `Backup restored (${mode}): ${results.created} prompts` + 
                          (results.skipped > 0 ? `, skipped ${results.skipped}` : '');
            showToast(message, 'success');
            return true;
        } else if (results.errors.length > 0) {
            showToast('Backup restore failed with errors', 'error');
            return false;
        } else {
            showToast('No new prompts from backup', 'info');
            return true;
        }
        
    } catch (error) {
        console.error('Backup restore failed:', error);
        showToast('Backup restore failed', 'error');
        return false;
    }
};

/**
 * Download a local backup as JSON file
 */
export const downloadLocalBackup = (backupId) => {
    try {
        const backups = getLocalBackups();
        const backup = backups.find(b => b.id === backupId);
        
        if (!backup) {
            showToast('Backup not found', 'error');
            return false;
        }
        
        const exportData = {
            ...backup.data,
            exportedAt: Date.now(),
            exportedBy: 'PromptBoard Local Backup'
        };
        
        const jsonString = JSON.stringify(exportData, null, 2);
        const timestamp = formatDateTime(true).replace(/[:\s]/g, '').replace(/-/g, '');
        const filename = `promptboard-backup-${timestamp}.json`;
        
        downloadFile(jsonString, filename, 'application/json');
        showToast('Backup downloaded', 'success');
        
        return true;
    } catch (error) {
        console.error('Backup download failed:', error);
        showToast('Backup download failed', 'error');
        return false;
    }
};

/**
 * PromptBoard - Main application module
 * Orchestrates all functionality and manages UI state
 */

import { debounce, createFocusTrap, parseTagsString } from './js/utils.js';
import { renderApp, renderTagFilters, renderPromptCards, renderModal, showToast, showConfirmDialog, renderPlaceholderModal, renderSettingsModal, showRestoreModeDialog } from './js/render.js';
import { processPrompts, createPrompt, updatePrompt, deletePrompt, copyPromptToClipboard, getAllTags, getPromptById, validatePromptData, detectPromptPlaceholders, getPromptVariablesWithAuto, insertAndCopyPrompt, duplicatePrompt } from './js/logic.js';
import { exportToJSON, exportToMarkdown, handleImportFile, autoBackupMaybe, listLocalBackups, restoreLocalBackup, downloadLocalBackup } from './js/io.js';
import { getPreferences, setPreferences } from './js/storage.js';

// Application state
let currentState = {
    searchQuery: '',
    selectedTags: [],
    isModalOpen: false,
    currentEditId: null,
    modalCleanup: null
};

/**
 * Reset app state and URL
 */
const handleResetApp = () => {
    currentState.searchQuery = '';
    currentState.selectedTags = [];
    
    // Clear URL
    window.history.pushState({}, '', window.location.pathname);
    
    // Reset UI
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.value = '';
    }
    
    renderApp();
    initializeUI();
};

/**
 * Initialize URL parameters
 */
const initializeFromURL = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    
    // Initialize search from URL
    const query = urlParams.get('q');
    if (query) {
        currentState.searchQuery = query;
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.value = query;
        }
    }
    
    // Initialize tags from hash
    const tagsParam = hashParams.get('tags');
    if (tagsParam) {
        currentState.selectedTags = tagsParam.split(',').filter(tag => tag.trim());
    }
};

/**
 * Update URL with current state
 */
const updateURL = () => {
    const url = new URL(window.location);
    
    // Update search query
    if (currentState.searchQuery) {
        url.searchParams.set('q', currentState.searchQuery);
    } else {
        url.searchParams.delete('q');
    }
    
    // Update tags hash
    if (currentState.selectedTags.length > 0) {
        url.hash = `tags=${currentState.selectedTags.join(',')}`;
    } else {
        url.hash = '';
    }
    
    window.history.replaceState({}, '', url);
};

/**
 * Render current state
 */
const renderCurrentState = () => {
    const filteredPrompts = processPrompts(currentState.searchQuery, currentState.selectedTags);
    const allTags = getAllTags();
    
    renderTagFilters(allTags, currentState.selectedTags);
    renderPromptCards(filteredPrompts);
    updateURL();
};

/**
 * Handle search input
 */
const handleSearch = debounce((query) => {
    currentState.searchQuery = query;
    renderCurrentState();
}, 150);

/**
 * Handle tag filter toggle
 */
const handleTagToggle = (tag) => {
    const index = currentState.selectedTags.indexOf(tag);
    if (index > -1) {
        currentState.selectedTags.splice(index, 1);
    } else {
        currentState.selectedTags.push(tag);
    }
    renderCurrentState();
};

/**
 * Clear all filters
 */
const handleClearFilters = () => {
    currentState.selectedTags = [];
    renderCurrentState();
};

/**
 * Show create/edit modal
 */
const showPromptModal = (promptId = null) => {
    if (currentState.isModalOpen) return;
    
    currentState.isModalOpen = true;
    currentState.currentEditId = promptId;
    
    const prompt = promptId ? getPromptById(promptId) : null;
    renderModal(prompt);
    
    const modal = document.getElementById('modal-dialog');
    if (modal) {
        currentState.modalCleanup = createFocusTrap(modal);
    }
    
    // Setup modal event listeners
    setupModalEventListeners();
};

/**
 * Hide modal
 */
const hideModal = () => {
    if (!currentState.isModalOpen) return;
    
    if (currentState.modalCleanup) {
        currentState.modalCleanup();
        currentState.modalCleanup = null;
    }
    
    document.getElementById('modal-container').innerHTML = '';
    currentState.isModalOpen = false;
    currentState.currentEditId = null;
};

/**
 * Setup modal event listeners
 */
const setupModalEventListeners = () => {
    const form = document.getElementById('prompt-form');
    const closeBtn = document.getElementById('modal-close-btn');
    const cancelBtn = document.getElementById('modal-cancel-btn');
    const overlay = document.getElementById('modal-overlay');
    
    // Form submission
    if (form) {
        form.onsubmit = handleFormSubmit;
    }
    
    // Close buttons
    if (closeBtn) closeBtn.onclick = hideModal;
    if (cancelBtn) cancelBtn.onclick = hideModal;
    
    // Overlay click
    if (overlay) {
        overlay.onclick = (e) => {
            if (e.target.id === 'modal-overlay') {
                hideModal();
            }
        };
    }
    
    // ESC key
    const handleEsc = (e) => {
        if (e.key === 'Escape') {
            hideModal();
            document.removeEventListener('keydown', handleEsc);
        }
    };
    document.addEventListener('keydown', handleEsc);
};

/**
 * Handle form submission
 */
const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    const titleInput = document.getElementById('prompt-title');
    const tagsInput = document.getElementById('prompt-tags');
    const contentTextarea = document.getElementById('prompt-content');
    
    if (!titleInput || !tagsInput || !contentTextarea) return;
    
    const data = {
        title: titleInput.value.trim(),
        tags: parseTagsString(tagsInput.value),
        content: contentTextarea.value.trim()
    };
    
    // Validate data
    const errors = validatePromptData(data);
    if (errors.length > 0) {
        showToast(errors[0], 'error');
        return;
    }
    
            try {
            if (currentState.currentEditId) {
                // Update existing prompt
                await updatePrompt(currentState.currentEditId, data);
                showToast('Prompt updated!', 'success');
            } else {
                // Create new prompt
                await createPrompt(data);
                showToast('Prompt created!', 'success');
            }
            
            hideModal();
            renderCurrentState();
            
            // Check for auto-backup
            autoBackupMaybe();
            
        } catch (error) {
            console.error('Save failed:', error);
            showToast(error.message || 'Failed to save prompt', 'error');
        }
};

/**
 * Handle prompt deletion
 */
const handleDelete = async (promptId) => {
    const prompt = getPromptById(promptId);
    if (!prompt) return;
    
    const confirmed = await showConfirmDialog(
        'Delete Prompt',
        `Are you sure you want to delete "${prompt.title}"? This action cannot be undone.`,
        'Delete',
        'Cancel'
    );
    
    if (confirmed) {
        try {
            await deletePrompt(promptId);
            showToast('Prompt deleted', 'success');
            renderCurrentState();
            
            // Check for auto-backup
            autoBackupMaybe();
        } catch (error) {
            console.error('Delete failed:', error);
            showToast('Failed to delete prompt', 'error');
        }
    }
};

/**
 * Handle prompt duplication
 */
const handleDuplicate = async (promptId) => {
    try {
        const duplicated = duplicatePrompt(promptId);
        showToast('Prompt duplicated', 'success');
        renderCurrentState();
        
        // Check for auto-backup
        autoBackupMaybe();
        
        return duplicated;
    } catch (error) {
        console.error('Duplicate failed:', error);
        showToast('Failed to duplicate prompt', 'error');
    }
};

/**
 * Handle Insert & Copy with placeholders
 */
const handleInsertAndCopy = async (promptId) => {
    const placeholders = detectPromptPlaceholders(promptId);
    
    if (placeholders.length === 0) {
        // No placeholders, act like regular copy
        return copyPromptToClipboard(promptId);
    }
    
    // Show placeholder modal
    const cachedValues = getPromptVariablesWithAuto(promptId);
    renderPlaceholderModal(promptId, placeholders, cachedValues);
    
    const modal = document.getElementById('placeholder-dialog');
    if (modal) {
        currentState.modalCleanup = createFocusTrap(modal);
    }
    
    setupPlaceholderModalEventListeners();
};

/**
 * Setup placeholder modal event listeners
 */
const setupPlaceholderModalEventListeners = () => {
    const form = document.getElementById('placeholder-form');
    const closeBtn = document.getElementById('placeholder-close-btn');
    const cancelBtn = document.getElementById('placeholder-cancel-btn');
    const overlay = document.getElementById('placeholder-overlay');
    
    const closePlaceholderModal = () => {
        if (currentState.modalCleanup) {
            currentState.modalCleanup();
            currentState.modalCleanup = null;
        }
        document.getElementById('modal-container').innerHTML = '';
    };
    
    // Form submission
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            
            const promptId = document.getElementById('placeholder-dialog')?.dataset.promptId;
            if (!promptId) return;
            
            // Collect form values
            const formData = new FormData(form);
            const variables = {};
            for (const [key, value] of formData.entries()) {
                if (value.trim()) {
                    variables[key] = value.trim();
                }
            }
            
            // Apply placeholders and copy
            const success = await insertAndCopyPrompt(promptId, variables);
            
            if (success) {
                closePlaceholderModal();
            }
        };
    }
    
    // Close buttons
    if (closeBtn) closeBtn.onclick = closePlaceholderModal;
    if (cancelBtn) cancelBtn.onclick = closePlaceholderModal;
    
    // Overlay click
    if (overlay) {
        overlay.onclick = (e) => {
            if (e.target.id === 'placeholder-overlay') {
                closePlaceholderModal();
            }
        };
    }
    
    // ESC key and Enter key
    const handlePlaceholderKeydown = (e) => {
        if (e.key === 'Escape') {
            closePlaceholderModal();
            document.removeEventListener('keydown', handlePlaceholderKeydown);
        } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            form?.dispatchEvent(new Event('submit'));
        }
    };
    document.addEventListener('keydown', handlePlaceholderKeydown);
};

/**
 * Show settings modal
 */
const showSettings = () => {
    const preferences = getPreferences();
    const backups = listLocalBackups();
    
    renderSettingsModal(preferences, backups);
    
    const modal = document.getElementById('settings-dialog');
    if (modal) {
        currentState.modalCleanup = createFocusTrap(modal);
    }
    
    setupSettingsModalEventListeners();
};

/**
 * Setup settings modal event listeners
 */
const setupSettingsModalEventListeners = () => {
    const closeBtn = document.getElementById('settings-close-btn');
    const saveBtn = document.getElementById('settings-save-btn');
    const overlay = document.getElementById('settings-overlay');
    
    const closeSettingsModal = () => {
        if (currentState.modalCleanup) {
            currentState.modalCleanup();
            currentState.modalCleanup = null;
        }
        document.getElementById('modal-container').innerHTML = '';
    };
    
    // Save settings
    if (saveBtn) {
        saveBtn.onclick = () => {
            const autoBackupEnabled = document.getElementById('auto-backup-enabled')?.checked || false;
            const autoBackupThreshold = parseInt(document.getElementById('backup-threshold')?.value) || 10;
            
            const currentPrefs = getPreferences();
            const newPrefs = {
                ...currentPrefs,
                autoBackupEnabled,
                autoBackupThreshold
            };
            
            if (setPreferences(newPrefs)) {
                showToast('Settings saved', 'success');
                closeSettingsModal();
            } else {
                showToast('Failed to save settings', 'error');
            }
        };
    }
    
    // Close buttons
    if (closeBtn) closeBtn.onclick = closeSettingsModal;
    
    // Overlay click
    if (overlay) {
        overlay.onclick = (e) => {
            if (e.target.id === 'settings-overlay') {
                closeSettingsModal();
            }
        };
    }
    
    // Backup actions
    document.addEventListener('click', async (e) => {
        if (e.target.classList.contains('backup-download-btn')) {
            const backupId = e.target.dataset.backupId;
            if (backupId) {
                downloadLocalBackup(backupId);
            }
        }
        
        if (e.target.classList.contains('backup-restore-btn')) {
            const backupId = e.target.dataset.backupId;
            if (backupId) {
                const mode = await showRestoreModeDialog();
                if (mode) {
                    const success = await restoreLocalBackup(backupId, mode);
                    if (success) {
                        renderCurrentState();
                        closeSettingsModal();
                    }
                }
            }
        }
    });
    
    // ESC key
    const handleSettingsKeydown = (e) => {
        if (e.key === 'Escape') {
            closeSettingsModal();
            document.removeEventListener('keydown', handleSettingsKeydown);
        }
    };
    document.addEventListener('keydown', handleSettingsKeydown);
};

/**
 * Setup export menu
 */
const setupExportMenu = () => {
    const menuBtn = document.getElementById('export-menu-btn');
    const menu = document.getElementById('export-menu');
    
    if (!menuBtn || !menu) return;
    
    // Toggle menu
    menuBtn.onclick = (e) => {
        e.stopPropagation();
        const isOpen = !menu.classList.contains('hidden');
        
        if (isOpen) {
            menu.classList.add('hidden');
            menuBtn.setAttribute('aria-expanded', 'false');
        } else {
            menu.classList.remove('hidden');
            menuBtn.setAttribute('aria-expanded', 'true');
        }
    };
    
    // Close menu when clicking outside
    document.addEventListener('click', () => {
        menu.classList.add('hidden');
        menuBtn.setAttribute('aria-expanded', 'false');
    });
    
    // Menu items
    const exportJsonBtn = document.getElementById('export-json-btn');
    const exportMarkdownBtn = document.getElementById('export-markdown-btn');
    const importFile = document.getElementById('import-file');
    
    if (exportJsonBtn) {
        exportJsonBtn.onclick = () => {
            exportToJSON();
            menu.classList.add('hidden');
            menuBtn.setAttribute('aria-expanded', 'false');
        };
    }
    
    if (exportMarkdownBtn) {
        exportMarkdownBtn.onclick = () => {
            exportToMarkdown();
            menu.classList.add('hidden');
            menuBtn.setAttribute('aria-expanded', 'false');
        };
    }
    
            if (importFile) {
            importFile.onchange = async (e) => {
                const success = await handleImportFile(e);
                if (success) {
                    renderCurrentState();
                    // Check for auto-backup after import
                    autoBackupMaybe();
                }
                menu.classList.add('hidden');
                menuBtn.setAttribute('aria-expanded', 'false');
            };
        }
};

/**
 * Setup global keyboard shortcuts
 */
const setupKeyboardShortcuts = () => {
    document.addEventListener('keydown', (e) => {
        // Skip if modal is open or user is typing
        if (currentState.isModalOpen || 
            e.target.tagName === 'INPUT' || 
            e.target.tagName === 'TEXTAREA') {
            
            // Ctrl/Cmd + Enter in modal saves
            if (currentState.isModalOpen && 
                (e.ctrlKey || e.metaKey) && 
                e.key === 'Enter') {
                const form = document.getElementById('prompt-form');
                if (form) {
                    e.preventDefault();
                    form.dispatchEvent(new Event('submit'));
                }
            }
            return;
        }
        
        switch (e.key) {
            case '/':
                e.preventDefault();
                document.getElementById('search-input')?.focus();
                break;
                
            case 'n':
            case 'N':
                e.preventDefault();
                showPromptModal();
                break;
                
            case 'b':
            case 'B':
                e.preventDefault();
                showSettings();
                break;
                
            case 'Escape':
                // Clear search and filters
                currentState.searchQuery = '';
                currentState.selectedTags = [];
                const searchInput = document.getElementById('search-input');
                if (searchInput) {
                    searchInput.value = '';
                }
                renderCurrentState();
                break;
        }
    });
};

/**
 * Initialize UI event listeners
 */
const initializeUI = () => {
    // Search input
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.oninput = (e) => handleSearch(e.target.value);
    }
    
    // Settings button
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
        settingsBtn.onclick = () => showSettings();
    }
    
    // New prompt button
    const newPromptBtn = document.getElementById('new-prompt-btn');
    if (newPromptBtn) {
        newPromptBtn.onclick = () => showPromptModal();
    }
    
    // Empty state new prompt button
    const emptyNewPromptBtn = document.getElementById('empty-new-prompt-btn');
    if (emptyNewPromptBtn) {
        emptyNewPromptBtn.onclick = () => showPromptModal();
    }
    
    // Tag filter buttons (event delegation)
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('tag-filter-btn')) {
            const tag = e.target.dataset.tag;
            if (tag) {
                handleTagToggle(tag);
            }
        }
        
        if (e.target.id === 'clear-filters-btn') {
            handleClearFilters();
        }
        
        // Prompt card actions
        if (e.target.closest('.insert-copy-btn')) {
            const promptId = e.target.closest('.insert-copy-btn').dataset.id;
            if (promptId) {
                handleInsertAndCopy(promptId);
            }
        }
        
        if (e.target.closest('.copy-btn')) {
            const promptId = e.target.closest('.copy-btn').dataset.id;
            if (promptId) {
                copyPromptToClipboard(promptId);
            }
        }
        
        if (e.target.closest('.duplicate-btn')) {
            const promptId = e.target.closest('.duplicate-btn').dataset.id;
            if (promptId) {
                handleDuplicate(promptId);
            }
        }
        
        if (e.target.closest('.edit-btn')) {
            const promptId = e.target.closest('.edit-btn').dataset.id;
            if (promptId) {
                showPromptModal(promptId);
            }
        }
        
        if (e.target.closest('.delete-btn')) {
            const promptId = e.target.closest('.delete-btn').dataset.id;
            if (promptId) {
                handleDelete(promptId);
            }
        }
    });
    
    setupExportMenu();
    renderCurrentState();
};

/**
 * Initialize application
 */
const initializeApp = () => {
    console.log('PromptBoard initializing...');
    
    // Make reset function global for navbar
    window.handleResetApp = handleResetApp;
    
    // Render main structure
    renderApp();
    
    // Initialize from URL
    initializeFromURL();
    
    // Setup UI
    initializeUI();
    
    // Setup keyboard shortcuts
    setupKeyboardShortcuts();
    
    console.log('PromptBoard initialized successfully');
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

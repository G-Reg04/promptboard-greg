/**
 * PromptBoard - Main application module
 * Orchestrates all functionality and manages UI state
 */

import { debounce, createFocusTrap, parseTagsString } from './js/utils.js';
import { renderApp, renderTagFilters, renderPromptCards, renderModal, showToast, showConfirmDialog } from './js/render.js';
import { processPrompts, createPrompt, updatePrompt, deletePrompt, copyPromptToClipboard, getAllTags, getPromptById, validatePromptData } from './js/logic.js';
import { exportToJSON, exportToMarkdown, handleImportFile } from './js/io.js';

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
        } catch (error) {
            console.error('Delete failed:', error);
            showToast('Failed to delete prompt', 'error');
        }
    }
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
        if (e.target.closest('.copy-btn')) {
            const promptId = e.target.closest('.copy-btn').dataset.id;
            if (promptId) {
                copyPromptToClipboard(promptId);
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

/**
 * Render module - handles all UI rendering (app, cards, filters, toasts, modals)
 */

import { sanitizeHTML, truncate, getFirstLine, formatDate, formatDateTime, createFocusTrap, parsePlaceholders } from './utils.js';

/**
 * Render main application structure
 */
export const renderApp = () => {
    const app = document.getElementById('main-content');
    if (!app) return;

    app.innerHTML = `
        <!-- Search and Actions Bar -->
        <div class="flex flex-col sm:flex-row gap-4 mb-6">
            <div class="flex-1">
                <div class="relative">
                    <input
                        type="text"
                        id="search-input"
                        placeholder="Search prompts... (Press / to focus)"
                        class="w-full px-4 py-3 pl-10 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                        autocomplete="off"
                    >
                    <svg class="absolute left-3 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                </div>
            </div>
            
            <div class="flex gap-2">
                <button
                    id="settings-btn"
                    class="px-3 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
                    aria-label="Settings (Press B)"
                    title="Settings"
                >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                </button>
                
                <button
                    id="new-prompt-btn"
                    class="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    aria-label="Create new prompt (Press N)"
                >
                    <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                    </svg>
                    New Prompt
                </button>
                
                <div class="relative">
                    <button
                        id="export-menu-btn"
                        class="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
                        aria-label="Export menu"
                        aria-expanded="false"
                        aria-haspopup="true"
                    >
                        <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        Export
                        <svg class="w-4 h-4 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                    </button>
                    
                    <div id="export-menu" class="hidden absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg border border-gray-600 z-50">
                        <div class="py-1">
                            <button id="export-json-btn" class="w-full text-left px-4 py-2 text-white hover:bg-gray-700 transition-colors duration-200">
                                Export as JSON
                            </button>
                            <button id="export-markdown-btn" class="w-full text-left px-4 py-2 text-white hover:bg-gray-700 transition-colors duration-200">
                                Export as Markdown
                            </button>
                            <hr class="border-gray-600 my-1">
                            <label class="w-full text-left px-4 py-2 text-white hover:bg-gray-700 transition-colors duration-200 cursor-pointer block">
                                <input type="file" id="import-file" accept=".json" class="hidden">
                                Import JSON
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Tags Filter Bar -->
        <div id="tags-filter-container" class="mb-6">
            <!-- Tags will be rendered here -->
        </div>

        <!-- Prompts Grid -->
        <div id="prompts-container" class="space-y-4">
            <!-- Prompt cards will be rendered here -->
        </div>

        <!-- Toast Container -->
        <div id="toast-container" class="fixed bottom-4 right-4 z-50 space-y-2">
            <!-- Toasts will be rendered here -->
        </div>

        <!-- Modal Container -->
        <div id="modal-container">
            <!-- Modals will be rendered here -->
        </div>
    `;
};

/**
 * Render tag filters
 */
export const renderTagFilters = (allTags, selectedTags = []) => {
    const container = document.getElementById('tags-filter-container');
    if (!container) return;

    if (allTags.length === 0) {
        container.innerHTML = '';
        return;
    }

    const hasSelectedTags = selectedTags.length > 0;

    container.innerHTML = `
        <div class="flex flex-wrap items-center gap-2">
            <span class="text-sm text-gray-400 font-medium">Filter by tags:</span>
            ${allTags.map(({ tag, count }) => `
                <button
                    class="tag-filter-btn px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${
                        selectedTags.includes(tag)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }"
                    data-tag="${sanitizeHTML(tag)}"
                    aria-pressed="${selectedTags.includes(tag)}"
                >
                    ${sanitizeHTML(tag)} <span class="opacity-75">(${count})</span>
                </button>
            `).join('')}
            ${hasSelectedTags ? `
                <button
                    id="clear-filters-btn"
                    class="px-3 py-1 text-sm text-red-400 hover:text-red-300 font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 rounded"
                >
                    Clear filters
                </button>
            ` : ''}
        </div>
    `;
};

/**
 * Render prompt cards
 */
export const renderPromptCards = (prompts) => {
    const container = document.getElementById('prompts-container');
    if (!container) return;

    if (prompts.length === 0) {
        renderEmptyState(container);
        return;
    }

    container.innerHTML = prompts.map(prompt => `
        <div class="prompt-card bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-colors duration-200">
            <div class="flex justify-between items-start mb-3">
                <h3 class="text-lg font-semibold text-white truncate flex-1 mr-4">
                    ${sanitizeHTML(prompt.title)}
                </h3>
                <div class="flex gap-1 flex-shrink-0">
                    ${parsePlaceholders(prompt.content).length > 0 ? `
                    <button
                        class="insert-copy-btn p-2 text-gray-400 hover:text-purple-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 rounded"
                        data-id="${prompt.id}"
                        title="Insert & Copy with variables"
                        aria-label="Insert variables and copy"
                    >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2V9a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
                        </svg>
                    </button>
                    ` : ''}
                    <button
                        class="copy-btn p-2 text-gray-400 hover:text-green-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 rounded"
                        data-id="${prompt.id}"
                        title="Copy content"
                        aria-label="Copy prompt content"
                    >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                        </svg>
                    </button>
                    <button
                        class="duplicate-btn p-2 text-gray-400 hover:text-blue-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded"
                        data-id="${prompt.id}"
                        title="Duplicate prompt"
                        aria-label="Duplicate prompt"
                    >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"></path>
                        </svg>
                    </button>
                    <button
                        class="edit-btn p-2 text-gray-400 hover:text-yellow-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50 rounded"
                        data-id="${prompt.id}"
                        title="Edit prompt"
                        aria-label="Edit prompt"
                    >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                    </button>
                    <button
                        class="delete-btn p-2 text-gray-400 hover:text-red-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 rounded"
                        data-id="${prompt.id}"
                        title="Delete prompt"
                        aria-label="Delete prompt"
                    >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </button>
                </div>
            </div>
            
            ${prompt.content ? `
                <p class="text-gray-300 text-sm mb-4 whitespace-pre-wrap">
                    ${sanitizeHTML(truncate(getFirstLine(prompt.content), 150))}
                </p>
            ` : ''}
            
            <div class="flex justify-between items-center">
                <div class="flex flex-wrap gap-1">
                    ${prompt.tags.map(tag => `
                        <span class="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-full">
                            ${sanitizeHTML(tag)}
                        </span>
                    `).join('')}
                </div>
                <time class="text-xs text-gray-500" datetime="${new Date(prompt.updatedAt).toISOString()}">
                    ${formatDate(prompt.updatedAt)}
                </time>
            </div>
        </div>
    `).join('');
};

/**
 * Render empty state
 */
export const renderEmptyState = (container) => {
    container.innerHTML = `
        <div class="text-center py-16">
            <svg class="mx-auto h-16 w-16 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <h3 class="text-lg font-medium text-gray-400 mb-2">No prompts found</h3>
            <p class="text-gray-500 mb-6">Create your first prompt to get started!</p>
            <button
                id="empty-new-prompt-btn"
                class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
                Create First Prompt
            </button>
        </div>
    `;
};

/**
 * Render edit/create modal
 */
export const renderModal = (prompt = null) => {
    const isEdit = !!prompt;
    const container = document.getElementById('modal-container');
    if (!container) return;

    container.innerHTML = `
        <div id="modal-overlay" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div
                id="modal-dialog"
                class="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
                role="dialog"
                aria-labelledby="modal-title"
                aria-modal="true"
            >
                <div class="flex justify-between items-center p-6 border-b border-gray-700">
                    <h2 id="modal-title" class="text-xl font-semibold text-white">
                        ${isEdit ? 'Edit Prompt' : 'Create New Prompt'}
                    </h2>
                    <button
                        id="modal-close-btn"
                        class="p-2 text-gray-400 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 rounded"
                        aria-label="Close modal"
                    >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                
                <form id="prompt-form" class="p-6">
                    <div class="space-y-4">
                        <div>
                            <label for="prompt-title" class="block text-sm font-medium text-gray-300 mb-2">
                                Title <span class="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                id="prompt-title"
                                required
                                value="${isEdit ? sanitizeHTML(prompt.title) : ''}"
                                class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                                placeholder="Enter prompt title..."
                            >
                        </div>
                        
                        <div>
                            <label for="prompt-tags" class="block text-sm font-medium text-gray-300 mb-2">
                                Tags <span class="text-gray-500">(comma-separated)</span>
                            </label>
                            <input
                                type="text"
                                id="prompt-tags"
                                value="${isEdit ? prompt.tags.join(', ') : ''}"
                                class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                                placeholder="tag1, tag2, tag3..."
                            >
                        </div>
                        
                        <div>
                            <label for="prompt-content" class="block text-sm font-medium text-gray-300 mb-2">
                                Content
                            </label>
                            <textarea
                                id="prompt-content"
                                rows="8"
                                class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 resize-vertical"
                                placeholder="Enter your prompt content here..."
                            >${isEdit ? sanitizeHTML(prompt.content) : ''}</textarea>
                        </div>
                    </div>
                    
                    <div class="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            id="modal-cancel-btn"
                            class="px-4 py-2 text-gray-300 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 rounded"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            id="modal-save-btn"
                            class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                        >
                            ${isEdit ? 'Update' : 'Create'} Prompt
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // Store prompt ID for editing
    if (isEdit) {
        document.getElementById('modal-dialog').dataset.promptId = prompt.id;
    }
};

/**
 * Show toast notification
 */
export const showToast = (message, type = 'success', duration = 3000) => {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    const toastId = 'toast-' + Date.now();
    toast.id = toastId;

    const bgColor = {
        success: 'bg-green-600',
        error: 'bg-red-600',
        warning: 'bg-yellow-600',
        info: 'bg-blue-600'
    }[type] || 'bg-gray-600';

    toast.className = `${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 transform transition-all duration-300 translate-x-full opacity-0`;
    
    toast.innerHTML = `
        <div class="flex-1">
            ${sanitizeHTML(message)}
        </div>
        <button class="text-white hover:text-gray-300 transition-colors duration-200 focus:outline-none" onclick="this.parentElement.remove()">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
        </button>
    `;

    container.appendChild(toast);

    // Animate in
    setTimeout(() => {
        toast.classList.remove('translate-x-full', 'opacity-0');
    }, 10);

    // Auto remove
    setTimeout(() => {
        toast.classList.add('translate-x-full', 'opacity-0');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 300);
    }, duration);

    return toastId;
};

/**
 * Show backup restore mode selection dialog
 */
export const showRestoreModeDialog = () => {
    return new Promise((resolve) => {
        const container = document.getElementById('modal-container');
        if (!container) {
            resolve(null);
            return;
        }

        container.innerHTML = `
            <div id="restore-overlay" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div
                    id="restore-dialog"
                    class="bg-gray-800 rounded-lg shadow-xl w-full max-w-md"
                    role="dialog"
                    aria-labelledby="restore-title"
                    aria-modal="true"
                >
                    <div class="p-6">
                        <h3 id="restore-title" class="text-lg font-semibold text-white mb-4">
                            Restore Backup
                        </h3>
                        <p class="text-gray-300 mb-6">
                            How would you like to restore this backup?
                        </p>
                        
                        <div class="space-y-3 mb-6">
                            <label class="flex items-center">
                                <input type="radio" name="restore-mode" value="merge" checked 
                                       class="mr-3 text-blue-600 focus:ring-blue-500 focus:ring-2">
                                <div>
                                    <div class="font-medium text-white">Merge</div>
                                    <div class="text-sm text-gray-400">Add backup prompts, keep existing</div>
                                </div>
                            </label>
                            
                            <label class="flex items-center">
                                <input type="radio" name="restore-mode" value="replace" 
                                       class="mr-3 text-blue-600 focus:ring-blue-500 focus:ring-2">
                                <div>
                                    <div class="font-medium text-white">Replace</div>
                                    <div class="text-sm text-gray-400">Replace all current prompts</div>
                                </div>
                            </label>
                        </div>
                        
                        <div class="flex justify-end gap-3">
                            <button
                                id="restore-cancel-btn"
                                class="px-4 py-2 text-gray-300 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                id="restore-confirm-btn"
                                class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                            >
                                Restore
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const handleResolve = (result) => {
            container.innerHTML = '';
            resolve(result);
        };

        document.getElementById('restore-cancel-btn').onclick = () => handleResolve(null);
        document.getElementById('restore-confirm-btn').onclick = () => {
            const mode = document.querySelector('input[name="restore-mode"]:checked')?.value || 'merge';
            handleResolve(mode);
        };
        document.getElementById('restore-overlay').onclick = (e) => {
            if (e.target.id === 'restore-overlay') {
                handleResolve(null);
            }
        };

        // Focus confirm button
        document.getElementById('restore-confirm-btn').focus();
    });
};

/**
 * Show confirmation dialog
 */
export const showConfirmDialog = (title, message, confirmText = 'Confirm', cancelText = 'Cancel') => {
    return new Promise((resolve) => {
        const container = document.getElementById('modal-container');
        if (!container) {
            resolve(false);
            return;
        }

        container.innerHTML = `
            <div id="confirm-overlay" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div
                    id="confirm-dialog"
                    class="bg-gray-800 rounded-lg shadow-xl w-full max-w-md"
                    role="dialog"
                    aria-labelledby="confirm-title"
                    aria-modal="true"
                >
                    <div class="p-6">
                        <h3 id="confirm-title" class="text-lg font-semibold text-white mb-4">
                            ${sanitizeHTML(title)}
                        </h3>
                        <p class="text-gray-300 mb-6">
                            ${sanitizeHTML(message)}
                        </p>
                        <div class="flex justify-end gap-3">
                            <button
                                id="confirm-cancel-btn"
                                class="px-4 py-2 text-gray-300 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 rounded"
                            >
                                ${sanitizeHTML(cancelText)}
                            </button>
                            <button
                                id="confirm-confirm-btn"
                                class="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                            >
                                ${sanitizeHTML(confirmText)}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const handleResolve = (result) => {
            container.innerHTML = '';
            resolve(result);
        };

        document.getElementById('confirm-cancel-btn').onclick = () => handleResolve(false);
        document.getElementById('confirm-confirm-btn').onclick = () => handleResolve(true);
        document.getElementById('confirm-overlay').onclick = (e) => {
            if (e.target.id === 'confirm-overlay') {
                handleResolve(false);
            }
        };

        // Focus confirm button
        document.getElementById('confirm-confirm-btn').focus();
    });
};

/**
 * Render placeholder variables modal
 */
export const renderPlaceholderModal = (promptId, placeholders, cachedValues = {}) => {
    const container = document.getElementById('modal-container');
    if (!container) return;

    const today = formatDateTime(false);
    const now = formatDateTime(true);
    
    container.innerHTML = `
        <div id="placeholder-overlay" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div
                id="placeholder-dialog"
                class="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden"
                role="dialog"
                aria-labelledby="placeholder-title"
                aria-modal="true"
            >
                <div class="flex justify-between items-center p-6 border-b border-gray-700">
                    <h2 id="placeholder-title" class="text-xl font-semibold text-white">
                        Insert Variables
                    </h2>
                    <button
                        id="placeholder-close-btn"
                        class="p-2 text-gray-400 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 rounded"
                        aria-label="Close modal"
                    >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                
                <div class="p-6">
                    <div class="mb-4 text-sm text-gray-400">
                        <p><strong>${placeholders.length}</strong> variable${placeholders.length !== 1 ? 's' : ''} found</p>
                        <p class="mt-1">Syntax: <code class="bg-gray-700 px-1 rounded text-gray-300">{{name}}</code> or <code class="bg-gray-700 px-1 rounded text-gray-300">{{name|default}}</code></p>
                    </div>
                    
                    <form id="placeholder-form" class="space-y-4">
                        ${placeholders.map(placeholder => `
                            <div>
                                <label for="var-${placeholder.name}" class="block text-sm font-medium text-gray-300 mb-2">
                                    <code class="bg-gray-700 px-2 py-1 rounded text-gray-300">{{${placeholder.name}}}</code>
                                    ${placeholder.hasDefault ? `
                                        <span class="text-xs text-gray-500 ml-2">default: "${placeholder.defaultValue}"</span>
                                    ` : ''}
                                </label>
                                <input
                                    type="text"
                                    id="var-${placeholder.name}"
                                    name="${placeholder.name}"
                                    value="${sanitizeHTML(cachedValues[placeholder.name] || placeholder.defaultValue)}"
                                    placeholder="${placeholder.hasDefault ? placeholder.defaultValue : `Value for ${placeholder.name}`}"
                                    class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
                                >
                            </div>
                        `).join('')}
                        
                        <div class="bg-gray-700 rounded-lg p-3 text-sm text-gray-400">
                            <p><strong>Auto-values:</strong></p>
                            <p>• <code class="text-gray-300">today</code>: ${today}</p>
                            <p>• <code class="text-gray-300">now</code>: ${now}</p>
                        </div>
                        
                        <div class="flex justify-end gap-3 mt-6">
                            <button
                                type="button"
                                id="placeholder-cancel-btn"
                                class="px-4 py-2 text-gray-300 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                id="placeholder-insert-btn"
                                class="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
                            >
                                Insert & Copy
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

    // Store prompt ID for processing
    document.getElementById('placeholder-dialog').dataset.promptId = promptId;
    
    // Focus first input
    const firstInput = container.querySelector('input[type="text"]');
    if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
    }
};

/**
 * Render settings modal
 */
export const renderSettingsModal = (preferences, backups = []) => {
    const container = document.getElementById('modal-container');
    if (!container) return;

    container.innerHTML = `
        <div id="settings-overlay" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div
                id="settings-dialog"
                class="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
                role="dialog"
                aria-labelledby="settings-title"
                aria-modal="true"
            >
                <div class="flex justify-between items-center p-6 border-b border-gray-700">
                    <h2 id="settings-title" class="text-xl font-semibold text-white">
                        Settings
                    </h2>
                    <button
                        id="settings-close-btn"
                        class="p-2 text-gray-400 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 rounded"
                        aria-label="Close settings"
                    >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                
                <div class="max-h-[60vh] overflow-y-auto">
                    <!-- Auto-Backup Section -->
                    <div class="p-6 border-b border-gray-700">
                        <h3 class="text-lg font-medium text-white mb-4">Auto-Backup</h3>
                        
                        <div class="space-y-4">
                            <label class="flex items-center">
                                <input
                                    type="checkbox"
                                    id="auto-backup-enabled"
                                    ${preferences.autoBackupEnabled ? 'checked' : ''}
                                    class="mr-3 text-blue-600 focus:ring-blue-500 focus:ring-2"
                                >
                                <div>
                                    <span class="font-medium text-white">Enable auto-backup</span>
                                    <p class="text-sm text-gray-400">Automatically backup after changes</p>
                                </div>
                            </label>
                            
                            <div class="flex items-center gap-4">
                                <label for="backup-threshold" class="text-sm font-medium text-gray-300">
                                    Backup every
                                </label>
                                <input
                                    type="number"
                                    id="backup-threshold"
                                    min="1"
                                    max="100"
                                    value="${preferences.autoBackupThreshold}"
                                    class="w-20 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                                >
                                <span class="text-sm text-gray-300">changes</span>
                            </div>
                            
                            <div class="text-sm text-gray-400">
                                <p>Changes: ${preferences.changeCounter || 0} / ${preferences.autoBackupThreshold}</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Local Backups Section -->
                    <div class="p-6">
                        <h3 class="text-lg font-medium text-white mb-4">Local Backups</h3>
                        
                        ${backups.length > 0 ? `
                            <div class="space-y-3">
                                ${backups.map(backup => `
                                    <div class="bg-gray-700 rounded-lg p-4 flex justify-between items-center">
                                        <div>
                                            <div class="font-medium text-white">${backup.formattedDate}</div>
                                            <div class="text-sm text-gray-400">${backup.promptCount} prompts</div>
                                        </div>
                                        <div class="flex gap-2">
                                            <button
                                                class="backup-download-btn px-3 py-1 text-sm bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
                                                data-backup-id="${backup.id}"
                                            >
                                                Download
                                            </button>
                                            <button
                                                class="backup-restore-btn px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                                                data-backup-id="${backup.id}"
                                            >
                                                Restore
                                            </button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : `
                            <div class="text-center py-8 text-gray-400">
                                <svg class="mx-auto h-12 w-12 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                </svg>
                                <p>No local backups available</p>
                                <p class="text-sm mt-1">Backups will appear here after auto-backup triggers</p>
                            </div>
                        `}
                        
                        <div class="mt-4 text-xs text-gray-500">
                            <p>Local backups are stored in browser storage (max 3 items)</p>
                        </div>
                    </div>
                </div>
                
                <div class="flex justify-end gap-3 p-6 border-t border-gray-700">
                    <button
                        id="settings-save-btn"
                        class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    >
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    `;
};

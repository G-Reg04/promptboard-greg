/**
 * Render module - handles all UI rendering (app, cards, filters, toasts, modals)
 */

import { sanitizeHTML, truncate, getFirstLine, formatDate } from './utils.js';

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
                <div class="flex gap-2 flex-shrink-0">
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
                        class="edit-btn p-2 text-gray-400 hover:text-blue-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded"
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

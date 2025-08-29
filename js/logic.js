/**
 * Logic module - handles CRUD operations, search, filtering, and clipboard functionality
 */

import { getState, setState, uuid, now } from './storage.js';
import { sanitizeTags, parseTagsString, escapeRegex, copyToClipboard, simpleHash } from './utils.js';
import { showToast } from './render.js';

/**
 * Get all prompts from state
 */
export const getAllPrompts = () => {
    const state = getState();
    return state.prompts || [];
};

/**
 * Get prompt by ID
 */
export const getPromptById = (id) => {
    const prompts = getAllPrompts();
    return prompts.find(prompt => prompt.id === id);
};

/**
 * Create new prompt
 */
export const createPrompt = (data) => {
    const { title, content = '', tags = [] } = data;
    
    // Validate title
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
        throw new Error('Title is required');
    }

    const prompt = {
        id: uuid(),
        title: title.trim(),
        content: typeof content === 'string' ? content.trim() : '',
        tags: sanitizeTags(tags),
        createdAt: now(),
        updatedAt: now()
    };

    const state = getState();
    state.prompts = [...state.prompts, prompt];
    
    if (!setState(state)) {
        throw new Error('Failed to save prompt');
    }

    return prompt;
};

/**
 * Update existing prompt
 */
export const updatePrompt = (id, data) => {
    const state = getState();
    const promptIndex = state.prompts.findIndex(prompt => prompt.id === id);
    
    if (promptIndex === -1) {
        throw new Error('Prompt not found');
    }

    const { title, content, tags } = data;
    
    // Validate title
    if (title !== undefined) {
        if (!title || typeof title !== 'string' || title.trim().length === 0) {
            throw new Error('Title is required');
        }
    }

    const currentPrompt = state.prompts[promptIndex];
    const updatedPrompt = {
        ...currentPrompt,
        ...(title !== undefined && { title: title.trim() }),
        ...(content !== undefined && { content: typeof content === 'string' ? content.trim() : '' }),
        ...(tags !== undefined && { tags: sanitizeTags(tags) }),
        updatedAt: now()
    };

    state.prompts[promptIndex] = updatedPrompt;
    
    if (!setState(state)) {
        throw new Error('Failed to update prompt');
    }

    return updatedPrompt;
};

/**
 * Delete prompt by ID
 */
export const deletePrompt = (id) => {
    const state = getState();
    const initialLength = state.prompts.length;
    
    state.prompts = state.prompts.filter(prompt => prompt.id !== id);
    
    if (state.prompts.length === initialLength) {
        throw new Error('Prompt not found');
    }
    
    if (!setState(state)) {
        throw new Error('Failed to delete prompt');
    }

    return true;
};

/**
 * Search prompts by query
 */
export const searchPrompts = (prompts, query) => {
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
        return prompts;
    }

    const searchTerm = query.trim().toLowerCase();
    const searchRegex = new RegExp(escapeRegex(searchTerm), 'gi');

    return prompts.filter(prompt => {
        // Search in title
        if (prompt.title && searchRegex.test(prompt.title)) {
            return true;
        }

        // Search in content
        if (prompt.content && searchRegex.test(prompt.content)) {
            return true;
        }

        // Search in tags
        if (prompt.tags && prompt.tags.some(tag => searchRegex.test(tag))) {
            return true;
        }

        return false;
    });
};

/**
 * Filter prompts by tags (AND logic)
 */
export const filterPromptsByTags = (prompts, selectedTags) => {
    if (!selectedTags || selectedTags.length === 0) {
        return prompts;
    }

    return prompts.filter(prompt => {
        return selectedTags.every(selectedTag => 
            prompt.tags.some(promptTag => 
                promptTag.toLowerCase() === selectedTag.toLowerCase()
            )
        );
    });
};

/**
 * Get all unique tags with counts
 */
export const getAllTags = (prompts = null) => {
    const allPrompts = prompts || getAllPrompts();
    const tagCounts = {};

    allPrompts.forEach(prompt => {
        prompt.tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
    });

    return Object.entries(tagCounts)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
};

/**
 * Sort prompts by update date (newest first)
 */
export const sortPrompts = (prompts) => {
    return [...prompts].sort((a, b) => b.updatedAt - a.updatedAt);
};

/**
 * Copy prompt content to clipboard
 */
export const copyPromptToClipboard = async (id) => {
    const prompt = getPromptById(id);
    if (!prompt) {
        showToast('Prompt not found', 'error');
        return false;
    }

    if (!prompt.content) {
        showToast('No content to copy', 'warning');
        return false;
    }

    try {
        const success = await copyToClipboard(prompt.content);
        if (success) {
            showToast('Copied!', 'success', 2000);
            return true;
        } else {
            showToast('Failed to copy', 'error');
            return false;
        }
    } catch (error) {
        console.error('Copy failed:', error);
        showToast('Failed to copy', 'error');
        return false;
    }
};

/**
 * Process and filter prompts based on search and tag filters
 */
export const processPrompts = (searchQuery = '', selectedTags = []) => {
    let prompts = getAllPrompts();
    
    // Apply search filter
    if (searchQuery) {
        prompts = searchPrompts(prompts, searchQuery);
    }
    
    // Apply tag filters
    if (selectedTags.length > 0) {
        prompts = filterPromptsByTags(prompts, selectedTags);
    }
    
    // Sort by update date
    prompts = sortPrompts(prompts);
    
    return prompts;
};

/**
 * Validate prompt data
 */
export const validatePromptData = (data) => {
    const errors = [];

    if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
        errors.push('Title is required');
    }

    if (data.title && data.title.length > 200) {
        errors.push('Title must be less than 200 characters');
    }

    if (data.content && data.content.length > 50000) {
        errors.push('Content must be less than 50,000 characters');
    }

    if (data.tags) {
        if (!Array.isArray(data.tags)) {
            errors.push('Tags must be an array');
        } else if (data.tags.length > 20) {
            errors.push('Maximum 20 tags allowed');
        } else {
            data.tags.forEach((tag, index) => {
                if (typeof tag !== 'string') {
                    errors.push(`Tag ${index + 1} must be a string`);
                } else if (tag.length > 50) {
                    errors.push(`Tag "${tag}" is too long (max 50 characters)`);
                }
            });
        }
    }

    return errors;
};

/**
 * Batch operations for import
 */
export const batchCreatePrompts = (promptsData, mode = 'merge') => {
    const state = getState();
    const results = {
        created: 0,
        skipped: 0,
        errors: []
    };

    if (mode === 'replace') {
        state.prompts = [];
    }

    promptsData.forEach((promptData, index) => {
        try {
            // Validate prompt data
            const errors = validatePromptData(promptData);
            if (errors.length > 0) {
                results.errors.push(`Prompt ${index + 1}: ${errors.join(', ')}`);
                results.skipped++;
                return;
            }

            // Check for duplicates in merge mode
            if (mode === 'merge') {
                const contentHash = simpleHash(promptData.title + promptData.content);
                const duplicate = state.prompts.find(existing => {
                    const existingHash = simpleHash(existing.title + existing.content);
                    return existingHash === contentHash;
                });

                if (duplicate) {
                    results.skipped++;
                    return;
                }
            }

            // Create new prompt
            const prompt = {
                id: uuid(),
                title: promptData.title.trim(),
                content: promptData.content ? promptData.content.trim() : '',
                tags: sanitizeTags(promptData.tags || []),
                createdAt: promptData.createdAt || now(),
                updatedAt: now()
            };

            state.prompts.push(prompt);
            results.created++;

        } catch (error) {
            results.errors.push(`Prompt ${index + 1}: ${error.message}`);
            results.skipped++;
        }
    });

    if (results.created > 0) {
        if (!setState(state)) {
            throw new Error('Failed to save imported prompts');
        }
    }

    return results;
};

/**
 * Get statistics about the current prompt collection
 */
export const getPromptStats = () => {
    const prompts = getAllPrompts();
    const allTags = getAllTags(prompts);
    
    return {
        totalPrompts: prompts.length,
        totalTags: allTags.length,
        averageTagsPerPrompt: prompts.length > 0 
            ? Math.round((prompts.reduce((sum, p) => sum + p.tags.length, 0) / prompts.length) * 10) / 10 
            : 0,
        oldestPrompt: prompts.length > 0 
            ? Math.min(...prompts.map(p => p.createdAt)) 
            : null,
        newestPrompt: prompts.length > 0 
            ? Math.max(...prompts.map(p => p.updatedAt)) 
            : null
    };
};

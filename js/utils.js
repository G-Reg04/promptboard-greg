/**
 * Utility functions - debounce, sanitization, focus management, file operations
 */

/**
 * Debounce function calls
 */
export const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

/**
 * Sanitize HTML content to prevent XSS
 */
export const sanitizeHTML = (str) => {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
};

/**
 * Sanitize and normalize tags
 */
export const sanitizeTags = (tags) => {
    if (!Array.isArray(tags)) {
        return [];
    }
    
    return tags
        .map(tag => typeof tag === 'string' ? tag.trim().toLowerCase() : '')
        .filter(tag => tag.length > 0)
        .filter((tag, index, arr) => arr.indexOf(tag) === index); // Remove duplicates
};

/**
 * Parse comma-separated tags string
 */
export const parseTagsString = (str) => {
    if (!str || typeof str !== 'string') {
        return [];
    }
    
    return sanitizeTags(
        str.split(',')
           .map(tag => tag.trim())
           .filter(tag => tag.length > 0)
    );
};

/**
 * Focus trap utility for modals
 */
export const createFocusTrap = (element) => {
    const focusableElements = element.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    const handleTabKey = (e) => {
        if (e.key !== 'Tab') return;
        
        if (e.shiftKey) {
            if (document.activeElement === firstElement) {
                lastElement?.focus();
                e.preventDefault();
            }
        } else {
            if (document.activeElement === lastElement) {
                firstElement?.focus();
                e.preventDefault();
            }
        }
    };
    
    element.addEventListener('keydown', handleTabKey);
    
    // Focus first element
    firstElement?.focus();
    
    return () => {
        element.removeEventListener('keydown', handleTabKey);
    };
};

/**
 * Download file utility
 */
export const downloadFile = (content, filename, mimeType = 'text/plain') => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 100);
};

/**
 * Format timestamp to readable date
 */
export const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

/**
 * Format current date as YYYY-MM-DD
 */
export const formatDateTime = (includeTime = false) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    if (!includeTime) {
        return `${year}-${month}-${day}`;
    }
    
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
};

/**
 * Truncate text with ellipsis
 */
export const truncate = (text, maxLength = 100) => {
    if (!text || text.length <= maxLength) {
        return text;
    }
    return text.substring(0, maxLength).trim() + '...';
};

/**
 * Get first line of text
 */
export const getFirstLine = (text) => {
    if (!text) return '';
    return text.split('\n')[0].trim();
};

/**
 * Escape special regex characters
 */
export const escapeRegex = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Generate hash from string (simple hash for collision detection)
 */
export const simpleHash = (str) => {
    let hash = 0;
    if (str.length === 0) return hash;
    
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    
    return Math.abs(hash).toString(36);
};

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = () => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Copy text to clipboard with fallback
 */
export const copyToClipboard = async (text) => {
    try {
        // Modern Clipboard API
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return true;
        }
        
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const success = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        return success;
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        return false;
    }
};

/**
 * Parse placeholders from text content
 * Returns array of unique placeholders with their default values
 */
export const parsePlaceholders = (text) => {
    if (!text || typeof text !== 'string') {
        return [];
    }
    
    // Regex to match {{name}} and {{name|default}}
    const placeholderRegex = /\{\{([^}|]+)(\|([^}]*))?\}\}/g;
    const placeholders = new Map();
    
    let match;
    while ((match = placeholderRegex.exec(text)) !== null) {
        const name = match[1].trim();
        const defaultValue = match[3] || '';
        
        if (name && !placeholders.has(name)) {
            placeholders.set(name, {
                name,
                defaultValue,
                hasDefault: match[3] !== undefined
            });
        }
    }
    
    return Array.from(placeholders.values());
};

/**
 * Apply placeholder substitutions to text
 * Returns object with processed text and any missing placeholders
 */
export const applyPlaceholders = (text, values = {}) => {
    if (!text || typeof text !== 'string') {
        return { text: text || '', missing: [] };
    }
    
    const missing = [];
    const today = formatDateTime(false);
    const now = formatDateTime(true);
    
    // Add auto values if they exist as placeholders in text
    const autoValues = { ...values };
    if (text.includes('{{today}}')) {
        autoValues.today = today;
    }
    if (text.includes('{{now}}')) {
        autoValues.now = now;
    }
    
    const processedText = text.replace(/\{\{([^}|]+)(\|([^}]*))?\}\}/g, (match, name, _, defaultValue) => {
        const trimmedName = name.trim();
        
        if (autoValues.hasOwnProperty(trimmedName) && autoValues[trimmedName] !== '') {
            return autoValues[trimmedName];
        }
        
        if (defaultValue !== undefined) {
            return defaultValue;
        }
        
        missing.push(trimmedName);
        return match; // Keep original placeholder if no value provided
    });
    
    return {
        text: processedText,
        missing: [...new Set(missing)] // Remove duplicates
    };
};

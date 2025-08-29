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

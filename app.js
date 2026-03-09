/**
 * Simple Chat AI - Vanilla JavaScript Version
 * Webhook-based chat interface
 */

// ============================================
// Configuration
// ============================================

const CONFIG = {
    WEBHOOK_URL: (() => {
        const urlParam = new URLSearchParams(window.location.search).get('webhook');
        return urlParam || 'http://localhost:5678/webhook/chatapp';
    })(),
    MESSAGE_TYPES: {
        USER: 'user',
        ASSISTANT: 'assistant'
    },
    STORAGE_KEY: 'simple_chat_history'
};

// ============================================
// State Management
// ============================================

const state = {
    messages: [],
    isLoading: false,
    messageHistory: null,

    addMessage(role, content) {
        const message = {
            role,
            content,
            timestamp: new Date()
        };
        this.messages.push(message);
        this.saveHistory();
        return message;
    },

    clear() {
        this.messages = [];
        this.saveHistory();
    },

    saveHistory() {
        try {
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(this.messages));
        } catch (error) {
            console.warn('Failed to save history:', error);
        }
    },

    loadHistory() {
        try {
            const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
            if (saved) {
                this.messages = JSON.parse(saved);
            }
        } catch (error) {
            console.warn('Failed to load history:', error);
            this.messages = [];
        }
    }
};

// ============================================
// DOM Elements
// ============================================

const elements = {
    chatForm: document.getElementById('chatForm'),
    messageInput: document.getElementById('messageInput'),
    chatMessages: document.getElementById('chatMessages'),
    sendBtn: document.getElementById('sendBtn'),
    toast: document.getElementById('toast')
};

// ============================================
// Utilities
// ============================================

/**
 * Format timestamp to readable format
 */
function formatTime(date) {
    if (!(date instanceof Date)) {
        date = new Date(date);
    }
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    const toast = elements.toast;
    toast.textContent = message;
    toast.className = `toast show ${type}`;

    clearTimeout(toast.timeout);
    toast.timeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

/**
 * Clear welcome message
 */
function clearWelcomeMessage() {
    const welcome = document.querySelector('.welcome-message');
    if (welcome) {
        welcome.remove();
    }
}

/**
 * Create message element
 */
function createMessageElement(role, content, timestamp) {
    const isUser = role === CONFIG.MESSAGE_TYPES.USER;
    const avatar = isUser ? '👤' : '🤖';
    const roleText = isUser ? 'You' : 'Assistant';

    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${role}`;

    const messageTime = timestamp ? formatTime(timestamp) : formatTime(new Date());

    messageDiv.innerHTML = `
        <div class="message-avatar">${avatar}</div>
        <div class="message-content">
            <div class="message-role">${roleText}</div>
            <div class="message-bubble">${escapeHtml(content)}</div>
            <div class="message-time">${messageTime}</div>
        </div>
    `;

    return messageDiv;
}

/**
 * Create loading indicator
 */
function createLoadingElement() {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message message-assistant message-loading';
    messageDiv.id = 'loading-indicator';

    messageDiv.innerHTML = `
        <div class="message-avatar">🤖</div>
        <div class="message-content">
            <div class="message-role">Assistant</div>
            <div class="message-bubble">
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
            </div>
        </div>
    `;

    return messageDiv;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Scroll to bottom of chat
 */
function scrollToBottom() {
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

/**
 * Render all messages
 */
function renderMessages() {
    // Clear existing messages except welcome
    const messages = document.querySelectorAll('.message');
    messages.forEach(msg => msg.remove());

    if (state.messages.length === 0) {
        return;
    }

    clearWelcomeMessage();

    state.messages.forEach(msg => {
        const element = createMessageElement(msg.role, msg.content, msg.timestamp);
        elements.chatMessages.appendChild(element);
    });

    scrollToBottom();
}

/**
 * Add single message to UI
 */
function addMessageToUI(role, content, timestamp) {
    clearWelcomeMessage();

    const messageElement = createMessageElement(role, content, timestamp);
    elements.chatMessages.appendChild(messageElement);
    scrollToBottom();
}

/**
 * Show loading indicator
 */
function showLoadingIndicator() {
    const loadingElement = createLoadingElement();
    elements.chatMessages.appendChild(loadingElement);
    scrollToBottom();
}

/**
 * Remove loading indicator
 */
function removeLoadingIndicator() {
    const loader = document.getElementById('loading-indicator');
    if (loader) {
        loader.remove();
    }
}

/**
 * Set button disabled state
 */
function setButtonState(disabled) {
    elements.sendBtn.disabled = disabled;
    state.isLoading = disabled;
}

// ============================================
// API Communication
// ============================================

/**
 * Send message to webhook
 */
async function sendToWebhook(messageContent) {
    try {
        const response = await fetch(CONFIG.WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: messageContent,
                history: state.messages.map(msg => ({
                    role: msg.role,
                    content: msg.content
                }))
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
                errorText || `Webhook returned ${response.status}: ${response.statusText}`
            );
        }

        const contentType = response.headers.get('content-type') || '';
        let payload;

        if (contentType.includes('application/json')) {
            payload = await response.json();
        } else {
            payload = await response.text();
        }

        // Extract response content
        let assistantMessage = '';

        if (typeof payload === 'string') {
            assistantMessage = payload;
        } else if (payload && typeof payload === 'object') {
            assistantMessage =
                payload.message ||
                payload.response ||
                payload.output ||
                payload.result ||
                JSON.stringify(payload);
        } else {
            assistantMessage = String(payload);
        }

        return assistantMessage;

    } catch (error) {
        console.error('Webhook error:', error);
        throw error;
    }
}

// ============================================
// Event Handlers
// ============================================

/**
 * Handle form submission
 */
async function handleFormSubmit(e) {
    e.preventDefault();

    const messagesContent = elements.messageInput.value.trim();

    if (!messagesContent) {
        return;
    }

    // Clear input
    elements.messageInput.value = '';
    elements.messageInput.focus();

    // Add user message
    const userMsg = state.addMessage(CONFIG.MESSAGE_TYPES.USER, messagesContent);
    addMessageToUI(CONFIG.MESSAGE_TYPES.USER, messagesContent, userMsg.timestamp);

    // Set loading state
    setButtonState(true);
    showLoadingIndicator();

    try {
        // Send to webhook
        const assistantResponse = await sendToWebhook(messagesContent);

        // Remove loading indicator
        removeLoadingIndicator();

        // Add assistant message
        const assistantMsg = state.addMessage(CONFIG.MESSAGE_TYPES.ASSISTANT, assistantResponse);
        addMessageToUI(CONFIG.MESSAGE_TYPES.ASSISTANT, assistantResponse, assistantMsg.timestamp);

    } catch (error) {
        console.error('Error:', error);

        // Remove loading indicator
        removeLoadingIndicator();

        // Show error message
        const errorMsg = `Sorry, I couldn't get a response. Error: ${error.message}`;
        const assistantMsg = state.addMessage(CONFIG.MESSAGE_TYPES.ASSISTANT, errorMsg);
        addMessageToUI(CONFIG.MESSAGE_TYPES.ASSISTANT, errorMsg, assistantMsg.timestamp);

        // Show toast
        showToast('Failed to send message. Check webhook URL.', 'error');

    } finally {
        setButtonState(false);
        scrollToBottom();
    }
}

/**
 * Handle input key press
 */
function handleInputKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!state.isLoading) {
            elements.chatForm.dispatchEvent(new Event('submit'));
        }
    }
}

/**
 * Handle page visibility
 */
function handleVisibilityChange() {
    if (!document.hidden) {
        scrollToBottom();
    }
}

// ============================================
// Initialization
// ============================================

/**
 * Initialize the application
 */
function init() {
    console.log('Simple Chat AI - Vanilla Version');
    console.log('Webhook URL:', CONFIG.WEBHOOK_URL);

    // Load message history
    state.loadHistory();

    // Set up event listeners
    elements.chatForm.addEventListener('submit', handleFormSubmit);
    elements.messageInput.addEventListener('keypress', handleInputKeyPress);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Render any saved messages
    if (state.messages.length > 0) {
        renderMessages();
    }

    // Focus input
    elements.messageInput.focus();

    // Log info
    console.log('Messages loaded:', state.messages.length);
}

// ============================================
// Global Error Handler
// ============================================

window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    showToast('An error occurred. Check console for details.', 'error');
});

// ============================================
// Start Application
// ============================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// ============================================
// Utility Functions for Browser Console
// ============================================

/**
 * Exposed utility functions for debugging
 */
window.chatUtils = {
    /**
     * Clear all messages
     */
    clearMessages() {
        state.clear();
        elements.chatMessages.innerHTML = '<div class="welcome-message">\n' +
            '                    <div class="welcome-icon">🤖</div>\n' +
            '                    <h2>Welcome to Simple Chat AI</h2>\n' +
            '                    <p>Send a message to start chatting with the assistant</p>\n' +
            '                </div>';
        console.log('Messages cleared');
    },

    /**
     * Get current webhook URL
     */
    getWebhookUrl() {
        return CONFIG.WEBHOOK_URL;
    },

    /**
     * Set new webhook URL
     */
    setWebhookUrl(url) {
        CONFIG.WEBHOOK_URL = url;
        console.log('Webhook URL updated to:', url);
    },

    /**
     * Get message history
     */
    getHistory() {
        return state.messages;
    },

    /**
     * Export messages as JSON
     */
    exportMessages() {
        return JSON.stringify(state.messages, null, 2);
    },

    /**
     * Export messages as CSV
     */
    exportMessagesCSV() {
        let csv = 'Role,Content,Timestamp\n';
        state.messages.forEach(msg => {
            const content = msg.content.replace(/"/g, '""');
            csv += `"${msg.role}","${content}","${msg.timestamp}"\n`;
        });
        console.log(csv);
        copyToClipboard(csv);
        showToast('CSV copied to clipboard', 'success');
    },

    /**
     * Copy text to clipboard
     */
    copyToClipboard(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                showToast('Copied to clipboard', 'success');
            });
        }
    }
};

/**
 * Copy to clipboard helper
 */
function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text);
    } else if (window.clipboardData) {
        window.clipboardData.setData('Text', text);
    }
}

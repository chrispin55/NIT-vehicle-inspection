// Frontend Error Handler and User Feedback System
class ErrorHandler {
  constructor() {
    this.setupGlobalErrorHandlers();
    this.setupNetworkErrorHandling();
  }

  // Setup global error handlers
  setupGlobalErrorHandlers() {
    // Handle unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.handleError({
        type: 'JavaScript Error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError({
        type: 'Unhandled Promise Rejection',
        message: event.reason?.message || event.reason,
        reason: event.reason
      });
    });
  }

  // Setup network error handling
  setupNetworkErrorHandling() {
    // Override fetch to handle network errors globally
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        // Handle HTTP error status codes
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new NetworkError(
            errorData.message || `HTTP ${response.status}: ${response.statusText}`,
            response.status,
            errorData.error || 'Network Error'
          );
        }
        
        return response;
      } catch (error) {
        if (error instanceof NetworkError) {
          throw error;
        }
        throw new NetworkError(
          'Network connection failed',
          0,
          'Network Error'
        );
      }
    };
  }

  // Main error handler
  handleError(error) {
    console.error('Application Error:', error);
    
    // Log error for debugging
    this.logError(error);
    
    // Show user-friendly message
    this.showUserError(error);
    
    // Report error if in production
    if (window.location.hostname !== 'localhost') {
      this.reportError(error);
    }
  }

  // Log error to console with details
  logError(error) {
    const logData = {
      timestamp: new Date().toISOString(),
      type: error.type || 'Error',
      message: error.message,
      url: window.location.href,
      userAgent: navigator.userAgent,
      userId: this.getCurrentUserId(),
      // Add additional context based on error type
      ...(error.filename && { filename: error.filename }),
      ...(error.lineno && { lineno: error.lineno }),
      ...(error.colno && { colno: error.colno }),
      ...(error.stack && { stack: error.stack })
    };

    console.group(`🚨 ${error.type || 'Error'}`);
    console.error('Error Details:', logData);
    console.error('Full Error:', error);
    console.groupEnd();
  }

  // Show user-friendly error messages
  showUserError(error) {
    const userMessage = this.getUserFriendlyMessage(error);
    const toast = this.createToast(userMessage, this.getToastType(error));
    document.body.appendChild(toast);
    
    // Auto-remove toast after 5 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 5000);
  }

  // Get user-friendly error message
  getUserFriendlyMessage(error) {
    // Network errors
    if (error instanceof NetworkError) {
      switch (error.status) {
        case 400:
          return 'Invalid request. Please check your input and try again.';
        case 401:
          return 'Please log in to access this feature.';
        case 403:
          return 'You do not have permission to perform this action.';
        case 404:
          return 'The requested resource was not found.';
        case 409:
          return 'This record already exists.';
        case 422:
          return 'Invalid data provided. Please check your input.';
        case 500:
          return 'Server error occurred. Please try again later.';
        case 0:
          return 'Network connection failed. Please check your internet connection.';
        default:
          return error.message || 'An unexpected error occurred.';
      }
    }

    // JavaScript errors
    if (error.type === 'JavaScript Error') {
      return 'A JavaScript error occurred. The page may not function correctly.';
    }

    // Default error message
    return error.message || 'An unexpected error occurred. Please try again.';
  }

  // Get toast type based on error
  getToastType(error) {
    if (error instanceof NetworkError) {
      if (error.status >= 400 && error.status < 500) {
        return 'warning';
      } else {
        return 'error';
      }
    }
    return 'error';
  }

  // Create toast notification
  createToast(message, type = 'error') {
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    
    const icons = {
      error: '❌',
      warning: '⚠️',
      success: '✅',
      info: 'ℹ️'
    };

    toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;

    // Add styles if not already added
    this.addToastStyles();

    return toast;
  }

  // Add toast styles to document
  addToastStyles() {
    if (document.getElementById('toast-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'toast-styles';
    styles.textContent = `
      .toast-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        max-width: 500px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        border-left: 4px solid;
        animation: slideIn 0.3s ease-out;
      }

      .toast-error {
        border-left-color: #dc3545;
      }

      .toast-warning {
        border-left-color: #ffc107;
      }

      .toast-success {
        border-left-color: #28a745;
      }

      .toast-info {
        border-left-color: #17a2b8;
      }

      .toast-content {
        display: flex;
        align-items: center;
        padding: 12px 16px;
        gap: 12px;
      }

      .toast-icon {
        font-size: 18px;
        flex-shrink: 0;
      }

      .toast-message {
        flex: 1;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        color: #333;
      }

      .toast-close {
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        color: #666;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background-color 0.2s;
      }

      .toast-close:hover {
        background-color: #f0f0f0;
      }

      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
    `;

    document.head.appendChild(styles);
  }

  // Get current user ID for error tracking
  getCurrentUserId() {
    // Try to get user ID from localStorage or other storage
    return localStorage.getItem('userId') || 'anonymous';
  }

  // Report error to server (in production)
  async reportError(error) {
    try {
      const errorData = {
        type: error.type || 'Error',
        message: error.message,
        url: window.location.href,
        userAgent: navigator.userAgent,
        userId: this.getCurrentUserId(),
        timestamp: new Date().toISOString(),
        stack: error.stack,
        // Additional context
        ...(error.filename && { filename: error.filename }),
        ...(error.lineno && { lineno: error.lineno }),
        ...(error.colno && { colno: error.colno }),
        ...(error.status && { status: error.status }),
        ...(error.errorType && { errorType: error.errorType })
      };

      await fetch('/api/errors/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorData)
      });
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  }

  // Show success message
  showSuccess(message) {
    const toast = this.createToast(message, 'success');
    document.body.appendChild(toast);
    
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3000);
  }

  // Show info message
  showInfo(message) {
    const toast = this.createToast(message, 'info');
    document.body.appendChild(toast);
    
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 4000);
  }
}

// Custom Network Error class
class NetworkError extends Error {
  constructor(message, status, errorType) {
    super(message);
    this.name = 'NetworkError';
    this.status = status;
    this.errorType = errorType;
  }
}

// Initialize error handler
const errorHandler = new ErrorHandler();

// Export for use in other scripts
window.ErrorHandler = ErrorHandler;
window.errorHandler = errorHandler;
window.NetworkError = NetworkError;

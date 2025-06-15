// Content script to inject into web pages
(function() {
    'use strict';
    
    let isPageActive = true;
    let lastActivityTime = Date.now();
    let activityCheckInterval;
    
    // Monitor user activity
    function initializeActivityMonitoring() {
        // Track mouse movement, clicks, keyboard activity
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, updateActivity, true);
        });
        
        // Track page visibility
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // Check for inactivity every 30 seconds
        activityCheckInterval = setInterval(checkActivity, 30000);
        
        // Send initial page load event
        sendPageEvent('page_load');
    }
    
    function updateActivity() {
        lastActivityTime = Date.now();
        if (!isPageActive) {
            isPageActive = true;
            sendPageEvent('user_active');
        }
    }
    
    function checkActivity() {
        const timeSinceLastActivity = Date.now() - lastActivityTime;
        
        // Consider user inactive after 2 minutes of no activity
        if (timeSinceLastActivity > 120000 && isPageActive) {
            isPageActive = false;
            sendPageEvent('user_inactive');
        }
    }
    
    function handleVisibilityChange() {
        if (document.hidden) {
            isPageActive = false;
            sendPageEvent('page_hidden');
        } else {
            isPageActive = true;
            lastActivityTime = Date.now();
            sendPageEvent('page_visible');
        }
    }
    
    function sendPageEvent(eventType) {
        // Send event to background script
        try {
            chrome.runtime.sendMessage({
                type: 'page_event',
                event: eventType,
                url: window.location.href,
                title: document.title,
                timestamp: Date.now(),
                isActive: isPageActive
            });
        } catch (error) {
            // Extension context may be invalid, ignore
            console.debug('Could not send message to extension:', error);
        }
    }
    
    // Clean up on page unload
    window.addEventListener('beforeunload', function() {
        if (activityCheckInterval) {
            clearInterval(activityCheckInterval);
        }
        sendPageEvent('page_unload');
    });
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeActivityMonitoring);
    } else {
        initializeActivityMonitoring();
    }
    
})();

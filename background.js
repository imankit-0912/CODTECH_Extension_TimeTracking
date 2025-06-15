// Background service worker for tracking time
class ProductivityTracker {
  constructor() {
    this.currentTab = null;
    this.startTime = null;
    this.isTracking = false;
    this.websiteCategories = {
      productive: [
        'github.com', 'stackoverflow.com', 'codepen.io', 'repl.it',
        'leetcode.com', 'hackerrank.com', 'coursera.org', 'udemy.com',
        'khanacademy.org', 'docs.google.com', 'notion.so', 'trello.com'
      ],
      unproductive: [
        'facebook.com', 'twitter.com', 'instagram.com', 'tiktok.com',
        'youtube.com', 'netflix.com', 'reddit.com', 'pinterest.com',
        'snapchat.com', 'twitch.tv'
      ]
    };
    this.init();
  }

  init() {
    // Listen for tab changes
    chrome.tabs.onActivated.addListener((activeInfo) => {
      this.handleTabChange(activeInfo.tabId);
    });

    // Listen for tab updates (URL changes)
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.url && tab.active) {
        this.handleTabChange(tabId);
      }
    });

    // Listen for window focus changes
    chrome.windows.onFocusChanged.addListener((windowId) => {
      if (windowId === chrome.windows.WINDOW_ID_NONE) {
        this.stopTracking();
      } else {
        chrome.tabs.query({active: true, windowId: windowId}, (tabs) => {
          if (tabs.length > 0) {
            this.handleTabChange(tabs[0].id);
          }
        });
      }
    });

    // Start tracking current tab
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs.length > 0) {
        this.handleTabChange(tabs[0].id);
      }
    });
  }

  async handleTabChange(tabId) {
    // Stop current tracking
    if (this.isTracking) {
      await this.stopTracking();
    }

    // Get tab info and start new tracking
    chrome.tabs.get(tabId, (tab) => {
      if (tab && tab.url && !tab.url.startsWith('chrome://')) {
        this.startTracking(tab);
      }
    });
  }

  startTracking(tab) {
    this.currentTab = tab;
    this.startTime = Date.now();
    this.isTracking = true;
  }

  async stopTracking() {
    if (!this.isTracking || !this.currentTab || !this.startTime) {
      return;
    }

    const endTime = Date.now();
    const timeSpent = endTime - this.startTime;
    
    // Only track if spent more than 5 seconds
    if (timeSpent > 5000) {
      await this.saveTimeEntry(this.currentTab, timeSpent);
    }

    this.isTracking = false;
    this.currentTab = null;
    this.startTime = null;
  }

  async saveTimeEntry(tab, timeSpent) {
    const domain = this.extractDomain(tab.url);
    const category = this.categorizeWebsite(domain);
    
    const entry = {
      url: tab.url,
      domain: domain,
      title: tab.title,
      timeSpent: timeSpent,
      timestamp: Date.now(),
      category: category,
      date: new Date().toISOString().split('T')[0]
    };

    // Save to local storage
    const result = await chrome.storage.local.get(['timeEntries']);
    const timeEntries = result.timeEntries || [];
    timeEntries.push(entry);
    
    await chrome.storage.local.set({ timeEntries: timeEntries });

    // Sync with backend if available
    this.syncWithBackend(entry);
  }

  extractDomain(url) {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return 'unknown';
    }
  }

  categorizeWebsite(domain) {
    if (this.websiteCategories.productive.some(site => domain.includes(site))) {
      return 'productive';
    }
    if (this.websiteCategories.unproductive.some(site => domain.includes(site))) {
      return 'unproductive';
    }
    return 'neutral';
  }

  async syncWithBackend(entry) {
    try {
      const response = await fetch('http://localhost:3000/api/time-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry)
      });
      
      if (!response.ok) {
        console.log('Backend sync failed, data saved locally');
      }
    } catch (error) {
      console.log('Backend not available, data saved locally');
    }
  }
}

// Initialize the tracker
const tracker = new ProductivityTracker();
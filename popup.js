// Popup script for displaying stats
document.addEventListener('DOMContentLoaded', async function() {
    await loadStats();
});

async function loadStats() {
    try {
        const result = await chrome.storage.local.get(['timeEntries']);
        const timeEntries = result.timeEntries || [];
        
        // Filter today's entries
        const today = new Date().toISOString().split('T')[0];
        const todayEntries = timeEntries.filter(entry => entry.date === today);
        
        if (todayEntries.length === 0) {
            document.getElementById('loading').style.display = 'none';
            document.getElementById('content').style.display = 'block';
            return;
        }
        
        // Calculate stats
        const stats = calculateStats(todayEntries);
        
        // Update UI
        updateStatsDisplay(stats);
        updateTopSites(stats.topSites);
        
        document.getElementById('loading').style.display = 'none';
        document.getElementById('content').style.display = 'block';
        
    } catch (error) {
        console.error('Error loading stats:', error);
        document.getElementById('loading').innerHTML = '<p>Error loading data</p>';
    }
}

function calculateStats(entries) {
    const stats = {
        totalTime: 0,
        productiveTime: 0,
        unproductiveTime: 0,
        neutralTime: 0,
        siteStats: {},
        topSites: []
    };
    
    // Process each entry
    entries.forEach(entry => {
        stats.totalTime += entry.timeSpent;
        
        // Add to category totals
        switch(entry.category) {
            case 'productive':
                stats.productiveTime += entry.timeSpent;
                break;
            case 'unproductive':
                stats.unproductiveTime += entry.timeSpent;
                break;
            default:
                stats.neutralTime += entry.timeSpent;
        }
        
        // Add to site stats
        if (!stats.siteStats[entry.domain]) {
            stats.siteStats[entry.domain] = {
                domain: entry.domain,
                time: 0,
                category: entry.category
            };
        }
        stats.siteStats[entry.domain].time += entry.timeSpent;
    });
    
    // Get top sites
    stats.topSites = Object.values(stats.siteStats)
        .sort((a, b) => b.time - a.time)
        .slice(0, 5);
    
    return stats;
}

function updateStatsDisplay(stats) {
    // Update total time
    document.getElementById('totalTime').textContent = formatTime(stats.totalTime);
    
    // Update category times
    document.getElementById('productiveTime').textContent = formatTime(stats.productiveTime);
    document.getElementById('unproductiveTime').textContent = formatTime(stats.unproductiveTime);
    
    // Update progress bar
    if (stats.totalTime > 0) {
        const productivePercent = (stats.productiveTime / stats.totalTime) * 100;
        document.getElementById('productiveBar').style.width = productivePercent + '%';
    }
}

function updateTopSites(topSites) {
    const container = document.getElementById('topSites');
    
    if (topSites.length === 0) {
        return;
    }
    
    container.innerHTML = '';
    
    topSites.forEach(site => {
        const siteItem = document.createElement('div');
        siteItem.className = 'site-item';
        siteItem.innerHTML = `
            <span class="site-domain">
                <span class="category-indicator ${site.category}"></span>
                ${site.domain}
            </span>
            <span class="site-time">${formatTime(site.time)}</span>
        `;
        container.appendChild(siteItem);
    });
}

function formatTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
        return `${hours}h ${remainingMinutes}m`;
    } else if (minutes > 0) {
        return `${minutes}m`;
    } else {
        return `${seconds}s`;
    }
}

function openDashboard() {
    chrome.tabs.create({
        url: chrome.runtime.getURL('dashboard.html')
    });
}

async function exportData() {
    try {
        const result = await chrome.storage.local.get(['timeEntries']);
        const timeEntries = result.timeEntries || [];
        
        const dataStr = JSON.stringify(timeEntries, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        chrome.downloads.download({
            url: url,
            filename: `productivity-data-${new Date().toISOString().split('T')[0]}.json`
        });
        
    } catch (error) {
        console.error('Error exporting data:', error);
        alert('Error exporting data. Please try again.');
    }
}
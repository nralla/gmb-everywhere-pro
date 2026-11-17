// GMB Everywhere Pro — Service Worker (Background)
console.log('[GMB Pro] Background service worker started');

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'openPopup') {
        // Open extension popup when user clicks the toolbar button
        chrome.action.openPopup().catch(err => console.warn('Popup open failed:', err));
        return true; // Keep message channel open for async response
    }
    
    if (message.action === 'extractData' && sender.tab?.url?.includes('/maps/place/')) {
        // Trigger extraction on demand
        extractBusinessData(sender.tab.id).then(data => {
            sendResponse({ success: true, data });
        }).catch(err => {
            sendResponse({ success: false, error: err.message });
        });
        return true; // Keep channel open for async response
    }
});

// On install/setup
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('[GMB Pro] Installed!');
        // Set default values
        chrome.storage.local.set({
            version: '3.0-REA',
            lastUpdate: Date.now(),
            settings: {
                autoExtract: true,
                notifyOnNewReviews: true,
                exportFormat: 'json'
            }
        });
    } else if (details.reason === 'update') {
        console.log('[GMB Pro] Updated to v' + chrome.runtime.getManifest().version);
    }
});

// Extract business data helper (used by content script interactions)
async function extractBusinessData(tabId) {
    try {
        // Evaluate extraction code in the active tab
        const results = await chrome.scripting.executeScript({
            target: { tabId },
            func: () => {
                const data = {};
                
                // URL parsing
                const urlMatch = window.location.href.match(/place\/([^\/]+)/);
                if (urlMatch) {
                    data.placeIdRaw = decodeURIComponent(urlMatch[1]);
                    data.urlParams = Object.fromEntries(
                        new URL(window.location.href).searchParams.entries()
                    );
                }
                
                // Business name extraction via multiple selectors
                const nameSelectors = [
                    '[aria-label*="name"]',
                    '.V4w58e',
                    '.LUV9rb',
                    'h1'
                ];
                
                for (const sel of nameSelectors) {
                    const el = document.querySelector(sel);
                    if (el && el.textContent.trim().length > 2) {
                        data.businessName = el.textContent.trim();
                        break;
                    }
                }
                
                // Data attribute collection
                data.dataAttributes = {};
                document.querySelectorAll('*').forEach(el => {
                    Array.from(el.attributes).forEach(attr => {
                        if (attr.name.startsWith('data-')) {
                            if (!data.dataAttributes[attr.name]) {
                                data.dataAttributes[attr.name] = [];
                            }
                            data.dataAttributes[attr.name].push({
                                tag: el.tagName.toLowerCase(),
                                value: attr.value.substring(0, 300),
                                className: String(el.className || '').substring(0, 60)
                            });
                        }
                    });
                });
                
                // Review IDs
                data.reviewIds = [];
                document.querySelectorAll('[data-review-id]').forEach(el => {
                    const rid = el.getAttribute('data-review-id');
                    if (rid && !data.reviewIds.includes(rid)) {
                        data.reviewIds.push(rid.substring(0, 100));
                    }
                });
                
                return data;
            }
        });
        
        return results[0]?.result || {};
        
    } catch (err) {
        console.error('[GMB Pro] Extraction failed:', err);
        throw err;
    }
}

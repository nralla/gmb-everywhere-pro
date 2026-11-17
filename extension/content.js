// GMB Everywhere Pro — Content Script
// Deep DOM integration using reverse-engineered @data-* attributes
console.log('[GMB Pro] Content script loaded');

// Detect GMaps page and inject toolbar
(function() {
    // Wait for page to be ready
    if (document.readyState !== 'complete') {
        window.addEventListener('load', init);
    } else {
        init();
    }

    function init() {
        const url = window.location.href;
        
        // Only activate on place pages
        if (!url.includes('/maps/place/')) return;
        
        console.log('[GMB Pro] Detected place page:', url);
        
        // Create floating toolbar
        createToolbar();
        
        // Extract and display key data
        extractPlaceData();
        
        // Inject real-time observer for dynamic updates
        observeDOMChanges();
    }

    function createToolbar() {
        // Remove existing toolbar if any
        const existing = document.getElementById('__gmb_toolbar');
        if (existing) existing.remove();
        
        const toolbar = document.createElement('div');
        toolbar.id = '__gmb_toolbar';
        toolbar.innerHTML = `
            <div class="gmb-toolbar">
                <button id="gmb-trigger" class="gmb-btn-primary" title="Open GMB Dashboard">
                    📊 GMB Pro
                </button>
                <div id="gmb-status" class="gmb-badge gmb-loading">Analyzing...</div>
            </div>
        `;
        
        // Append to body
        document.body.appendChild(toolbar);
        
        // Style injection (dynamic since GMaps classes change per build)
        const style = document.createElement('style');
        style.textContent = `
            .gmb-toolbar {
                position: fixed;
                top: 80px;
                right: 20px;
                z-index: 99999;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .gmb-btn-primary {
                background: #1a73e8;
                color: white;
                border: none;
                border-radius: 8px;
                padding: 12px 20px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                transition: all 0.2s ease;
            }
            .gmb-btn-primary:hover {
                background: #1557b0;
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            }
            .gmb-badge {
                padding: 8px 14px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 500;
            }
            .gmb-loading { background: #fff3cd; color: #856404; }
            .gmb-success { background: #d4edda; color: #155724; }
            .gmb-error { background: #f8d7da; color: #721c24; }
        `;
        document.head.appendChild(style);
        
        // Bind click handler
        document.getElementById('gmb-trigger').addEventListener('click', () => {
            chrome.runtime.sendMessage({ action: 'openPopup' });
        });
    }

    function extractPlaceData() {
        try {
            const data = {};
            
            // 1. Parse Place ID from URL
            const urlMatch = window.location.href.match(/place\/([^\/]+)/);
            if (urlMatch) {
                data.placeIdRaw = decodeURIComponent(urlMatch[1]);
                data.urlParams = new URLSearchParams(new URL(window.location.href).search);
            }
            
            // 2. Extract business name from multiple selectors
            const nameSelectors = [
                '[aria-label*="name"]',
                '.V4w58e',
                '.LUV9rb',
                'h1',
                '[data-item-id="authority"]'
            ];
            
            for (const sel of nameSelectors) {
                const el = document.querySelector(sel);
                if (el && el.textContent.trim().length > 2) {
                    data.businessName = el.textContent.trim().substring(0, 200);
                    break;
                }
            }
            
            // 3. Extract ALL @data-* attributes systematically
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
            
            // 4. Extract review IDs for batch processing
            data.reviewIds = [];
            document.querySelectorAll('[data-review-id]').forEach(el => {
                const rid = el.getAttribute('data-review-id');
                if (rid && !data.reviewIds.includes(rid)) {
                    data.reviewIds.push(rid.substring(0, 100));
                }
            });
            
            // 5. Extract button actions
            data.buttons = [];
            document.querySelectorAll('[role="button"], button[data-value]').forEach(btn => {
                const label = btn.getAttribute('aria-label') || 
                             btn.textContent.trim().substring(0, 100) ||
                             btn.getAttribute('data-value') || '';
                if (label.length > 2) {
                    data.buttons.push(label);
                }
            });
            
            // 6. Extract category info
            data.categories = [];
            document.querySelectorAll('[data-item-id]').forEach(el => {
                const itemId = el.getAttribute('data-item-id');
                const text = el.textContent.trim().substring(0, 80);
                if (itemId && text) {
                    data.categories.push({ id: itemId, text });
                }
            });
            
            // 7. Store extracted data for popup
            chrome.storage.local.set({
                gmbExtracted: data,
                timestamp: Date.now()
            }, () => {
                if (chrome.runtime.lastError) {
                    console.warn('[GMB Pro] Storage error:', chrome.runtime.lastError.message);
                }
            });
            
            // Update status badge
            const statusEl = document.getElementById('gmb-status');
            if (statusEl) {
                statusEl.className = 'gmb-badge gmb-success';
                statusEl.textContent = `✅ Found ${data.reviewIds.length} reviews`;
            }
            
            console.log('[GMB Pro] Extraction complete:', JSON.stringify(data, null, 2));
            
        } catch (err) {
            console.error('[GMB Pro] Extraction failed:', err);
            const statusEl = document.getElementById('gmb-status');
            if (statusEl) {
                statusEl.className = 'gmb-badge gmb-error';
                statusEl.textContent = '❌ Error analyzing page';
            }
        }
    }

    function observeDOMChanges() {
        // Watch for dynamic content changes (reviews load lazily)
        const observer = new MutationObserver((mutations) => {
            let needsUpdate = false;
            
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    // Check if new elements were added that might contain data
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const els = node.querySelectorAll ? 
                                Array.from(node.querySelectorAll('[data-review-id], [data-item-id]')) : [];
                            if (els.length > 0) needsUpdate = true;
                        }
                    });
                }
            }
            
            if (needsUpdate) {
                // Debounced re-extraction
                clearTimeout(observer._debounceTimer);
                observer._debounceTimer = setTimeout(extractPlaceData, 1000);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
})();

// GMB Everywhere Pro — Popup Panel Functions (Part 2)
// Post Audit & Category Traffic modules

async function loadPostAuditPanel() {
    const statusEl = document.getElementById('post-status');
    
    chrome.storage.local.get(['postHistory'], (result) => {
        if (result.postHistory && result.postHistory.length > 0) {
            statusEl.textContent = `✅ ${result.postHistory.length} gönderi bulundu`;
            statusEl.className = 'status-success';
            renderPostHistory(result.postHistory);
        } else {
            statusEl.textContent = 'Henüz geçmiş veri yok — "Gönderi Analizi" butonunu çalıştırın';
            statusEl.className = 'status-info';
        }
    });
}

async function runPostAuditAnalysis() {
    const statusEl = document.getElementById('post-status');
    statusEl.textContent = '🔄 Gönderiler analiz ediliyor...';
    statusEl.className = 'status-loading';
    
    try {
        // In production, this would scrape actual GMB posts via Google Maps API
        // For demo purposes, we'll generate realistic post data
        
        const posts = generateMockPosts();
        
        // Save history
        chrome.storage.local.set({ postHistory: posts });
        
        statusEl.textContent = `✅ ${posts.length} gönderi analiz edildi`;
        statusEl.className = 'status-success';
        
        renderPostHistory(posts);
        
    } catch (err) {
        statusEl.textContent = `❌ ${err.message}`;
        statusEl.className = 'status-error';
    }
}

function generateMockPosts() {
    const templates = [
        { title: 'Yeni Hizmetimiz: Botaks', date: '2026-11-10', type: 'promotion' },
        { title: 'Saç Ekim Sonuçları', date: '2026-11-05', type: 'update' },
        { title: 'Havuz Temizliği Bilgisi', date: '2026-10-30', type: 'notice' },
        { title: 'Özel Fırsatlar 🎁', date: '2026-10-25', type: 'promotion' },
        { title: 'Misafir Karşılama Saatleri', date: '2026-10-20', type: 'info' },
        { title: 'Yeni Takım Üyeleri', date: '2026-10-15', type: 'update' },
        { title: 'Dondurma İkramları ❄️', date: '2026-10-10', type: 'special' },
        { title: 'Menü Güncellemesi', date: '2026-10-05', type: 'update' },
    ];
    
    return templates.map(t => ({
        ...t,
        content: `${t.title} hakkında detaylı açıklama. Gerçek uygulamada burası GMaps'ten çekilecek.`,
        engagementScore: Math.floor(Math.random() * 100),
        hashtags: ['#antalya', '#saçekim', '#botaks'][Math.floor(Math.random() * 3)]
    }));
}

function renderPostHistory(posts) {
    const containerEl = document.getElementById('post-history-container');
    if (!containerEl) return;
    
    const byMonth = {};
    posts.forEach(p => {
        const month = p.date.substring(0, 7);
        if (!byMonth[month]) byMonth[month] = [];
        byMonth[month].push(p);
    });
    
    const monthlyCounts = Object.entries(byMonth).map(([m, ps]) => ({ month: m, count: ps.length }));
    
    containerEl.innerHTML = `
        <div class="post-summary">
            <h4>Gönderi Dağılımı (Son 30 Gün)</h4>
            <div class="post-bar-chart">
                ${monthlyCounts.map(m => `
                    <div class="bar-item">
                        <div class="bar-label">${m.month}</div>
                        <div class="bar-track">
                            <div class="bar-fill" style="width:${(m.count/monthsMax(monthlyCounts))*100}%"></div>
                        </div>
                        <div class="bar-value">${m.count}</div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="post-cards">
            ${posts.slice(0, 5).map((p, i) => `
                <div class="post-card">
                    <span class="post-date">${p.date}</span>
                    <strong>${p.title}</strong>
                    <small class="post-type">${getTypeLabel(p.type)}</small>
                </div>
            `).join('')}
        </div>
    `;
}

function monthsMax(months) {
    return Math.max(...months.map(m => m.count), 1);
}

function getTypeLabel(type) {
    const labels = {
        promotion: '📢 Tanıtım',
        update: '🔄 Güncelleme', 
        notice: 'ℹ️ Bildirim',
        special: '✨ Özel',
        info: '📋 Bilgi'
    };
    return labels[type] || type;
}

async function loadCategoryPanel() {
    const statusEl = document.getElementById('category-status');
    statusEl.textContent = 'Kategorileri tarıyorum...';
    statusEl.className = 'status-loading';
    
    setTimeout(() => {
        statusEl.textContent = '✅ Kategori verisi hazır';
        statusEl.className = 'status-success';
        renderCategoryData();
    }, 800);
}

async function getCategoryTrafficVolume() {
    const categoryInput = document.getElementById('category-input')?.value;
    
    if (!categoryInput) {
        alert('Bir kategori seçin!');
        return;
    }
    
    const statusEl = document.getElementById('category-status');
    statusEl.textContent = '🔄 Trafik hacmi hesaplanıyor...';
    statusEl.className = 'status-loading';
    
    try {
        // In production, this would query Google Ads Keyword Planner or similar
        // Simulated traffic volumes based on category type
        
        const categoryVolumes = {
            'dermatolog': { 
                searches: 48000 + Math.floor(Math.random() * 5000),
                nearMe: 12000 + Math.floor(Math.random() * 2000),
                openNow: 8000 + Math.floor(Math.random() * 1000),
                difficulty: Math.round(0.3 + Math.random() * 0.5)
            },
            'güzellik merkezi': {
                searches: 72000 + Math.floor(Math.random() * 8000),
                nearMe: 18000 + Math.floor(Math.random() * 3000),
                openNow: 14000 + Math.floor(Math.random() * 2000),
                difficulty: Math.round(0.4 + Math.random() * 0.4)
            },
            'saç ekim kliniği': {
                searches: 36000 + Math.floor(Math.random() * 4000),
                nearMe: 9000 + Math.floor(Math.random() * 1000),
                openNow: 6000 + Math.floor(Math.random() * 800),
                difficulty: Math.round(0.2 + Math.random() * 0.3)
            },
            'estetik doktor': {
                searches: 54000 + Math.floor(Math.random() * 6000),
                nearMe: 15000 + Math.floor(Math.random() * 2000),
                openNow: 11000 + Math.floor(Math.random() * 1500),
                difficulty: Math.round(0.35 + Math.random() * 0.4)
            }
        };
        
        const catKey = categoryInput.toLowerCase();
        const volume = categoryVolumes[catKey] || categoryVolumes['güzellik merkezi'];
        
        const results = {
            category: categoryInput,
            searches: volume.searches,
            nearMe: volume.nearMe,
            openNow: volume.openNow,
            difficulty: volume.difficulty,
            timestamp: Date.now()
        };
        
        // Display results
        displayCategoryResults(results);
        
        statusEl.textContent = `✅ ${volume.searches.toLocaleString()} aylık arama`;
        statusEl.className = 'status-success';
        
    } catch (err) {
        statusEl.textContent = `❌ ${err.message}`;
        statusEl.className = 'status-error';
    }
}

function displayCategoryResults(data) {
    const containerEl = document.getElementById('category-results');
    if (!containerEl) return;
    
    containerEl.innerHTML = `
        <div class="category-grid">
            <div class="cat-stat">
                <span class="cat-label">Aylık Arama</span>
                <span class="cat-value">${data.searches.toLocaleString()}</span>
            </div>
            <div class="cat-stat">
                <span class="cat-label">Near Me</span>
                <span class="cat-value">${data.nearMe.toLocaleString()}</span>
            </div>
            <div class="cat-stat">
                <span class="cat-label">Open Now</span>
                <span class="cat-value">${data.openNow.toLocaleString()}</span>
            </div>
            <div class="cat-stat">
                <span class="cat-label">Zorluk</span>
                <span class="cat-value" style="color:${data.difficulty > 0.7 ? '#dc3545' : '#28a745'}">
                    ${(data.difficulty * 100).toFixed(0)}%
                </span>
            </div>
        </div>
        
        <div class="category-chart">
            <canvas id="traffic-canvas" width="300" height="200"></canvas>
        </div>
        
        <script>
            // Draw simple bar chart on canvas
            window.addEventListener('load', () => {
                const canvas = document.getElementById('traffic-canvas');
                if (!canvas) return;
                
                const ctx = canvas.getContext('2d');
                const w = canvas.width;
                const h = canvas.height;
                
                // Background grid
                ctx.strokeStyle = '#e0e0e0';
                ctx.lineWidth = 1;
                for (let y = 0; y < h; y += 40) {
                    ctx.beginPath();
                    ctx.moveTo(0, y);
                    ctx.lineTo(w, y);
                    ctx.stroke();
                }
                
                // Bars
                const categories = ['Searches', 'Near Me', 'Open Now'];
                const values = [${data.searches}, ${data.nearMe}, ${data.openNow}];
                const maxVal = Math.max(...values);
                
                const barWidth = (w / 4) - 20;
                
                categories.forEach((label, i) => {
                    const x = (i + 1) * (w / 4) - barWidth/2;
                    const barHeight = (values[i] / maxVal) * (h - 30);
                    
                    // Bar gradient
                    const gradient = ctx.createLinearGradient(x, h - barHeight - 15, x, h - 15);
                    gradient.addColorStop(0, '#1a73e8');
                    gradient.addColorStop(1, '#4fc3f7');
                    
                    ctx.fillStyle = gradient;
                    ctx.fillRect(x, h - barHeight - 15, barWidth, barHeight);
                    
                    // Label
                    ctx.fillStyle = '#333';
                    ctx.font = '11px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(label, x + barWidth/2, h - 2);
                    
                    // Value
                    ctx.fillStyle = '#fff';
                    ctx.fillText(values[i].toLocaleString(), x + barWidth/2, h - barHeight - 5);
                });
            });
        </script>
    `;
}

function renderCategoryData() {
    // Pre-populate the form with common categories
    const selectEl = document.getElementById('category-select');
    if (selectEl) {
        selectEl.innerHTML = `
            <option value="dermatolog">Dermatolog</option>
            <option value="güzellik merkezi">Güzellik Merkezi</option>
            <option value="saç ekim kliniği">Saç Ekim Kliniği</option>
            <option value="estetik doktor">Estetik Doktor</option>
        `;
        selectEl.value = 'güzellik merkezi';
    }
}

function exportAllData() {
    // Gather all local storage data
    chrome.storage.local.get(null, (allData) => {
        const jsonData = JSON.stringify(allData, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // Trigger download
        const a = document.createElement('a');
        a.href = url;
        a.download = 'gmb-everywhere-export-' + new Date().toISOString().split('T')[0] + '.json';
        a.click();
        
        URL.revokeObjectURL(url);
    });
}

// Helper functions that were missed from Part 1
async function loadSummaryPanel() {
    const nameEl = document.getElementById('biz-name');
    const placeIdEl = document.getElementById('place-id');
    const reviewCountEl = document.getElementById('review-count');
    const categoryListEl = document.getElementById('category-list');
    
    if (nameEl) nameEl.textContent = window._extracted.businessName || 'Bilinmiyor';
    if (placeIdEl) placeIdEl.textContent = window._extracted.placeIdRaw || 'Çekilemedi';
    if (reviewCountEl) reviewCountEl.textContent = (window._extracted.reviewIds?.length || 0);
    if (categoryListEl) {
        const cats = window._extracted.categories || [];
        categoryListEl.innerHTML = cats.map(c => `<span class="cat-tag">${c.text}</span>`).join(' ');
    }
}

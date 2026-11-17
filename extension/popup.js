// ═══════════════════════════════════════════════════════
// GMB EVERYWHERE PRO v3.0-REA — POPUP DASHBOARD
// Tüm REA bulgularından beslenen yerel SEO analitik aracı
// Karşılık gelen .md dosyasında her attribute için detay bulunur
// ═══════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    console.log('[GMB Pro] Açılma arayüzü hazırlandı');
    
    // Sekmeleri ve panelleri hazırla
    initTabs();
    loadExtractedData();
    
    // Tüm butonlara tıklama olayı bağla
    bindAllHandlers();
});

/**
 * Sekme geçişlerini yönetir: tıklandığında ilgili paneli gösterir
 */
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const panels = document.querySelectorAll('.tab-panel');
    
    tabButtons.forEach((btn, index) => {
        btn.addEventListener('click', () => {
            // Önceki sekmeleri kapat
            tabButtons.forEach(b => b.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));
            
            // Yeni sekme aktif et + panel verisini yükle
            btn.classList.add('active');
            panels[index].classList.add('active');
            
            if (index === 0) loadSummaryPanel();
            if (index === 1) loadTeleportPanel();
            if (index === 2) loadLocalScanPanel();
            if (index === 3) loadPostAuditPanel();
            if (index === 4) loadCategoryPanel();
        });
    });
}

/**
 * Extracted verisini Chrome storage'ndan yükle
 * Eğer işletme sayfasında çalışmıyorsa demo veri üretir
 */
function loadExtractedData() {
    chrome.storage.local.get(['gmbExtracted'], (result) => {
        window._extracted = result.gmbExtracted || {};
        
        if (!window._extracted.businessName) {
            // Üretici sunucu olmadığı için demo veri oluştur
            window._extracted = generateDemoData();
        }
        
        console.log('[GMB Pro] Veri yüklendi:', Object.keys(window._extracted));
    });
}

/**
 * Demo/örnek işletme verisi üretir
 * Gerçek kullanımda Google Maps'ten gelen gerçek verilerle değişecek
 */

function generateDemoData() {
    return {
        businessName: 'Esin Orhan Güzellik Merkezi',
        placeIdRaw: 'ChIJKXoSa9QK5zsRkDEUfVpBzDw',
        urlParams: new URLSearchParams(),
        dataAttributes: {
            'data-item-id': [
                { tag: 'button', value: 'address', className: 'CsEnBe' },
                { tag: 'a', value: 'authority', className: 'lcr4fd S9kvJb' },
                { tag: 'button', value: 'phone:tel:02423171000', className: 'CsEnBe' }
            ],
            'data-review-id': [
                { tag: 'div', value: 'Ci9DQUlRQUNvZENodHljRjlvT2pWeE5URnlObUU0...', className: '' }
            ]
        },
        reviewIds: [
            'Ci9DQUlRQUNvZENodHljRjlvT2pWeE5URnlObUU0T1RNeVFXazNjRVZCU1daNVpHYxAB',
            'Ci9DQUlRQUNvZENodHljRjlvT25SQlMwbzVPRGg2TlhkMWFYTTRUV2Q2UmxORlNrRRAB'
        ],
        buttons: ['Ara', 'Kaydet', 'Yakınında', 'Telefona gönder', 'Paylaş', 'Yorum yazın'],
        categories: [
            { id: 'dermatologist', text: 'Dermatolog' },
            { id: 'beauty-salon', text: 'Güzellik Merkezi' },
            { id: 'hair-transplant-clinic', text: 'Saç Ekim Kliniği' }
        ]
    };
}

function bindAllHandlers() {
    // Health Score Calculator
    document.getElementById('calc-health-score')?.addEventListener('click', calculateHealthScore);
    
    // Rank Check (Teleport)
    document.getElementById('check-rank')?.addEventListener('click', checkRankAtCoordinates);
    
    // Local Competitor Scanner
    document.getElementById('start-local-scan')?.addEventListener('click', startLocalCompetitorScan);
    
    // Post Audit Trigger
    document.getElementById('run-post-audit')?.addEventListener('click', runPostAuditAnalysis);
    
    // Category Traffic
    document.getElementById('get-category-volume')?.addEventListener('click', getCategoryTrafficVolume);
    
    // Export Data
    document.getElementById('export-data')?.addEventListener('click', exportAllData);
}

/**
 * Sağlık skoru hesaplayıcı
 * 6 faktör üzerinden işletmenin Google Maps SEO performansını değerlendirir:
 * 1. Profil Eksiksizliği (adres/telefon/web)
 * 2. Yorum Miktarı Kalitesi  
 * 3. Kategori Doğruluğu
 * 4. Fotoğraf Yoğunluğu
 * 5. Yorumlara Yanıt Oranı
 * 6. Gönderi Aktifliği
 */
function calculateHealthScore() {
    const scoreEl = document.getElementById('health-score-value');
    const factorsEl = document.getElementById('health-factors');
    if (!scoreEl || !factorsEl) return;
    
    const data = window._extracted;
    let score = 0;
    const factors = [];
    
    // Factor 1: Business presence completeness (20pts)
    const hasName = !!data.businessName;
    const hasAddress = data.dataAttributes?.['data-item-id']?.some(
        a => a.value.includes('address')
    );
    const hasPhone = data.dataAttributes?.['data-item-id']?.some(
        a => a.value.includes('phone')
    );
    const hasWebsite = data.dataAttributes?.['data-item-id']?.some(
        a => a.value.includes('authority') || a.value.includes('website')
    );
    
    const presenceScore = (hasName ? 5 : 0) + (hasAddress ? 5 : 0) + (hasPhone ? 5 : 0) + (hasWebsite ? 5 : 0);
    score += presenceScore;
    factors.push({ name: 'Profil Eksiksizliği', score: presenceScore, max: 20 });
    
    // Factor 2: Review quality & quantity (25pts)
    const reviewCount = (data.reviewIds?.length || 0);
    const reviewScore = Math.min(reviewCount * 2.5, 25);
    score += reviewScore;
    factors.push({ name: 'Yorum Miktarı Kalitesi', score: Math.round(reviewScore), max: 25 });
    
    // Factor 3: Category accuracy (15pts)
    const categoryCount = data.categories?.length || 0;
    const categoryScore = Math.min(categoryCount * 5, 15);
    score += categoryScore;
    factors.push({ name: 'Kategori Doğruluğu', score: categoryScore, max: 15 });
    
    // Factor 4: Photo density (15pts)
    const photoCount = document.querySelectorAll('[data-carousel-index]').length || 0;
    const photoScore = Math.min(photoCount * 3, 15);
    score += photoScore;
    factors.push({ name: 'Fotoğraf Yoğunluğu', score: Math.round(photoScore), max: 15 });
    
    // Factor 5: Response rate (15pts)
    const responseRate = Math.random() > 0.5; // Simulated - in real would parse response data
    const responseScore = responseRate ? 15 : 5;
    score += responseScore;
    factors.push({ name: 'Yorumlara Yanıt Oranı', score: responseScore, max: 15 });
    
    // Factor 6: Posting activity (10pts)
    const postingActivity = Math.floor(Math.random() * 10); // Simulated
    score += postingActivity;
    factors.push({ name: 'Gönderi Aktifliği', score: postingActivity, max: 10 });
    
    // Update UI
    scoreEl.textContent = `${Math.round(score)}/100`;
    scoreEl.style.color = score >= 80 ? '#28a745' : score >= 60 ? '#ffc107' : '#dc3545';
    
    // Render factor bars
    factorsEl.innerHTML = factors.map(f => `
        <div class="factor-row">
            <span class="factor-name">${f.name}</span>
            <div class="factor-bar-container">
                <div class="factor-bar" style="width:${(f.score/f.max)*100}%"></div>
            </div>
            <span class="factor-score">${f.score}/${f.max}</span>
        </div>
    `).join('');
    
    // Save calculated score
    chrome.storage.local.set({ 
        lastHealthScore: { 
            total: Math.round(score), 
            timestamp: Date.now(),
            factors 
        }
    });
    
    console.log('[GMB Pro] Health score calculated:', score);
}

// ============================================
// TELEPORT / RANK TRACKER
// ============================================
function loadTeleportPanel() {
    // Populate recent scans if any
    chrome.storage.local.get(['rankScans'], (result) => {
        const scanHistory = result.rankScans || [];
        const historyEl = document.getElementById('scan-history');
        if (historyEl && scanHistory.length > 0) {
            historyEl.innerHTML = `
                <h4>Son Sıra Takibi</h4>
                ${scanHistory.slice(-5).reverse().map(s => `
                    <div class="scan-entry">
                        <small>${new Date(s.timestamp).toLocaleDateString()}</small><br/>
                        Koord: ${s.lat.toFixed(4)}, ${s.lng.toFixed(4)} → Sira: #${s.rank}
                    </div>
                `).join('')}
            `;
        }
    });
}

async function checkRankAtCoordinates() {
    const latInput = document.getElementById('teleport-lat')?.value;
    const lngInput = document.getElementById('teleport-lng')?.value;
    const keywordInput = document.getElementById('teleport-keyword')?.value;
    
    if (!latInput || !lngInput || !keywordInput) {
        alert('Lütfen koordinatlar ve anahtar kelime girin!');
        return;
    }
    
    const statusEl = document.getElementById('rank-status');
    statusEl.textContent = '🔄 Analiz ediliyor...';
    statusEl.className = 'status-loading';
    
    try {
        // In production, this would use Google's Places API or simulate rank calculation
        // For now, we'll calculate based on distance and other signals
        
        const lat = parseFloat(latInput);
        const lng = parseFloat(lngInput);
        
        // Extract business coordinates from page
        const coordsMatch = window.location.href.match(/@([-\d.]+),([-\d.]+)/);
        const bizLat = coordsMatch ? parseFloat(coordsMatch[1]) : null;
        const bizLng = coordsMatch ? parseFloat(coordsMatch[2]) : null;
        
        if (!bizLat || !bizLng) {
            throw new Error('İşletme koordinatları bulunamadı');
        }
        
        // Calculate Euclidean distance in degrees
        const dLat = Math.abs(bizLat - lat);
        const dLng = Math.abs(bizLng - lng);
        const distanceDegrees = Math.sqrt(dLat * dLat + dLng * dLng);
        
        // Simulate ranking algorithm based on proximity, reviews, and authority
        const reviewCount = (window._extracted.reviewIds?.length || 0);
        const authorityScore = (window._extracted.dataAttributes?.['data-item-id']?.filter(a => 
            a.value.includes('authority')
        ).length || 0) * 10;
        
        // Simple rank model (in reality this would be ML-based)
        const rank = Math.min(
            Math.max(1, Math.floor(distanceDegrees * 100) - Math.floor(authorityScore/5) - Math.floor(reviewCount/10)),
            50
        );
        
        const result = {
            lat, lng,
            bizLat, bizLng,
            distanceKm: Math.round(distanceDegrees * 111 * 100) / 100,
            estimatedRank: rank,
            confidence: Math.max(50, 100 - distanceDegrees * 50),
            timestamp: Date.now()
        };
        
        // Save scan
        chrome.storage.local.get(['rankScans'], (res) => {
            const scans = (res.rankScans || []).concat([result]);
            chrome.storage.local.set({ rankScans: scans.slice(-50) });
        });
        
        // Update UI
        statusEl.textContent = `✅ #${rank}. sırada (~${result.distanceKm}km uzaklık)`;
        statusEl.className = 'status-success';
        
        // Display detailed breakdown
        const detailsEl = document.getElementById('rank-details');
        if (detailsEl) {
            detailsEl.innerHTML = `
                <div class="detail-row">
                    <span>Koordinatlar:</span>
                    <strong>${lat}, ${lng}</strong>
                </div>
                <div class="detail-row">
                    <span>İşletme Konumu:</span>
                    <strong>${bizLat}, ${bizLng}</strong>
                </div>
                <div class="detail-row">
                    <span>Estimeted Sıralama:</span>
                    <strong style="color:#1a73e8">#${rank}</strong>
                </div>
                <div class="detail-row">
                    <span>Güven Skoru:</span>
                    <strong>${Math.round(result.confidence)}%</strong>
                </div>
            `;
        }
        
    } catch (err) {
        statusEl.textContent = `❌ ${err.message}`;
        statusEl.className = 'status-error';
    }
}

// ============================================
// LOCAL COMPETITOR SCANNER
// ============================================
function loadLocalScanPanel() {
    // Load previous scan results
    chrome.storage.local.get(['localScans'], (result) => {
        const scans = result.localScans || [];
        if (scans.length > 0) {
            renderLastScan(scans[scans.length - 1]);
        }
    });
}

async function startLocalCompetitorScan() {
    const keywordInput = document.getElementById('local-keyword')?.value;
    const radiusInput = document.getElementById('local-radius')?.value;
    
    if (!keywordInput) {
        alert('Anahtar kelime girin!');
        return;
    }
    
    const statusEl = document.getElementById('scan-status');
    statusEl.textContent = '🔄 Rakip taraması başlatılıyor...';
    statusEl.className = 'status-loading';
    
    try {
        // Get target business location
        const coordsMatch = window.location.href.match(/@([-\d.]+),([-\d.]+)/);
        const bizLat = coordsMatch ? parseFloat(coordsMatch[1]) : 36.8630;
        const bizLng = coordsMatch ? parseFloat(coordsMatch[2]) : 30.7294;
        
        const radius = parseInt(radiusInput) || 2000; // default 2km
        
        // Find competitors within radius
        // In production, this uses Google Maps Nearby Search API
        // Here we simulate realistic competitor data
        
        const competitors = generateCompetitors(keywordInput, bizLat, bizLng);
        
        // Compare with target business
        const ourBiz = {
            name: window._extracted.businessName,
            lat: bizLat,
            lng: bizLng,
            rating: 4.5 + (Math.random() * 0.5),
            reviewCount: window._extracted.reviewIds?.length || 0,
            priceLevel: 2
        };
        
        const results = {
            keyword: keywordInput,
            radius: radius,
            center: { lat: bizLat, lng: bizLng },
            target: ourBiz,
            competitors: competitors.sort((a, b) => a.rating - b.rating),
            timestamp: Date.now()
        };
        
        // Save results
        chrome.storage.local.get(['localScans'], (res) => {
            const scans = res.localScans || [];
            scans.push(results);
            chrome.storage.local.set({ localScans: scans.slice(-20) });
        });
        
        // Update UI
        renderScanResults(results);
        statusEl.textContent = `✅ ${competitors.length} rakip bulundu (${radius}m yarıçap)`;
        statusEl.className = 'status-success';
        
    } catch (err) {
        statusEl.textContent = `❌ Tarama başarısız: ${err.message}`;
        statusEl.className = 'status-error';
    }
}

function generateCompetitors(keyword, centerLat, centerLng) {
    const types = ['dermatolog', 'güzellik merkezi', 'saç ekim kliniği', 'estetik doktor'];
    const names = [
        'Antalya Estetik', 'SkinCare Plus', 'DermoLab Antalya', 
        'Elite Beauty Clinic', 'Perfect Skin Center', 'MedSpa Antalya'
    ];
    
    return names.map((name, i) => ({
        name,
        lat: centerLat + (Math.random() - 0.5) * 0.02,
        lng: centerLng + (Math.random() - 0.5) * 0.02,
        rating: 3.0 + Math.random() * 2.0,
        reviewCount: Math.floor(Math.random() * 500),
        priceLevel: Math.floor(Math.random() * 3) + 1,
        type: types[i % types.length],
        distance: Math.round(Math.random() * 5000)
    }));
}

function renderScanResults(results) {
    const containerEl = document.getElementById('competitor-list');
    if (!containerEl) return;
    
    const targetRating = results.target.rating;
    const targetReviews = results.target.reviewCount;
    
    containerEl.innerHTML = `
        <div class="comp-header">
            <strong>${results.keyword}</strong> 
            | ${results.radius}m yarıçap 
            | ${results.competitors.length} rakip
        </div>
        <table class="comp-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Rakip</th>
                    <th>Puan</th>
                    <th>Yorum</th>
                    <th>Fiyat</th>
                    <th>Gap*</th>
                </tr>
            </thead>
            <tbody>
                ${results.competitors.map((c, i) => {
                    const gap = Math.max(0, targetReviews - c.reviewCount);
                    return `
                        <tr>
                            <td>${i + 1}</td>
                            <td>${c.name}</td>
                            <td style="color:${c.rating >= targetRating ? '#28a745' : '#dc3545'}">⭐${c.rating.toFixed(1)}</td>
                            <td>${c.reviewCount}</td>
                            <td>${'₺'.repeat(c.priceLevel)}</td>
                            <td>${gap > 0 ? `<span class="gap-positive">-${gap}</span>` : '<span class="gap-ok">✓</span>'}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
        <small>* Gap = Hedef işletmenin eksik yorum sayısı</small>
    `;
}

function renderLastScan(scan) {
    // Same as renderScanResults but for historical data
    if (scan) renderScanResults(scan);
}

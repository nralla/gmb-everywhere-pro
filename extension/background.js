// ═══════════════════════════════════════════════════════
// GMB EVERYWHERE PRO v3.1-TR — ARKA PLAN HİZMET ÇALIŞANI
// İleti yönlendirme, kurulum ve veri çekme yardımcıları
// ═══════════════════════════════════════════════════════
console.log('[GMB Pro] Arka plan hizmeti başlatıldı');

/**
 * İçerik komut dosyalarından gelen mesajları dinler
 * - openPopup: Toolbar butonuna tıklayınca popup açar
 * - extractData: İşletme verisini anında çeker
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'openPopup') {
        // Kullanıcı toolbar'a tıklayınca popup açılır
        chrome.action.openPopup().catch(err => console.warn('Açılma aracı açılamadı:', err));
        return true; // Asenkron yanıt için kanal açık tutulur
    }
    
    if (message.action === 'extractData' && sender.tab?.url?.includes('/maps/place/')) {
        // İstenildiğinde işletme verisi çıkarımı tetiklenir
        extractBusinessData(sender.tab.id).then(data => {
            sendResponse({ success: true, data });
        }).catch(err => {
            sendResponse({ success: false, error: err.message });
        });
        return true; // Asenkron yanıt için kanal açık tutulur
    }
});

/**
 * Eklenti kurulduğunda veya güncellendiğinde çalışır
 * Varsayılan ayarları ve sürüm bilgisini depolar
 */
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('[GMB Pro] Yükleme tamamlandı!');
        // Varsayılan değerleri ayarla
        chrome.storage.local.set({
            version: '3.1-TR',
            lastUpdate: Date.now(),
            settings: {
                autoExtract: true,         // Otomatik veri çekimi aktif
                notifyOnNewReviews: true,  // Yeni yorum bildirimleri açık
                exportFormat: 'json'       // Dışa aktarma formatı
            }
        });
    } else if (details.reason === 'update') {
        console.log('[GMB Pro] Güncelleme: v' + chrome.runtime.getManifest().version);
    }
});

/**
 * İşletme verisi çıkarma yardımcısı
 * Content script'ten çağrıldığında Google Maps sayfasındaki verileri çeker
 * REA analizinde keşfedilen @data-* özniteliklerini sistematik olarak toplar
 */
async function extractBusinessData(tabId) {
    try {
        // Aktif sekmede çıkarma kodunu çalıştır
        const results = await chrome.scripting.executeScript({
            target: { tabId },
            func: () => {
                const data = {};
                
                // URL'den Place ID parse et
                const urlMatch = window.location.href.match(/place\/([^\/]+)/);
                if (urlMatch) {
                    data.placeIdRaw = decodeURIComponent(urlMatch[1]);
                    data.urlParams = Object.fromEntries(
                        new URL(window.location.href).searchParams.entries()
                    );
                }
                
                // Birden fazla CSS seçicisiyle işletme ismini bul
                const nameSelectors = [
                    '[aria-label*="name"]',     // ARIA etiketli isim
                    '.V4w58e',                  // GMaps ana başlık sınıfı
                    '.LUV9rb',                  // Alternatif başlık
                    'h1'                        // Son çare: h1 etiketi
                ];
                
                for (const sel of nameSelectors) {
                    const el = document.querySelector(sel);
                    if (el && el.textContent.trim().length > 2) {
                        data.businessName = el.textContent.trim();
                        break;
                    }
                }
                
                // Tüm @data-* özniteliklerini topla
                // REA bulgularına göre: 25 farklı @data-* türü tespit edildi
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
                
                // Review ID'lerini topla (protobuf-encoded base64 stringler)
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
        console.error('[GMB Pro] Veri çıkarma başarısız:', err);
        throw err;
    }
}

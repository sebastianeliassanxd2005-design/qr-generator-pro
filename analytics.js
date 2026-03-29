// Analytics Page - Main Logic

let currentQrForModal = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadAnalytics();
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('modalClose').addEventListener('click', () => {
        document.getElementById('analyticsModal').classList.add('hidden');
    });
    
    // Close modal on outside click
    document.getElementById('analyticsModal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('analyticsModal')) {
            document.getElementById('analyticsModal').classList.add('hidden');
        }
    });
}

function loadAnalytics() {
    const savedQrs = getSavedQrs();
    
    // Update overview stats
    updateOverviewStats(savedQrs);
    
    // Render QR cards
    renderQrCards(savedQrs);
}

function getSavedQrs() {
    const saved = localStorage.getItem('qrGenerator_savedQrs');
    return saved ? JSON.parse(saved) : [];
}

function updateOverviewStats(savedQrs) {
    const totalQrs = savedQrs.length;
    const totalDownloads = savedQrs.reduce((sum, qr) => sum + (qr.scans || 0), 0);
    const avgScans = totalQrs > 0 ? Math.round(totalDownloads / totalQrs) : 0;
    
    // Find most popular
    let mostPopular = '-';
    if (savedQrs.length > 0) {
        const popular = savedQrs.reduce((max, qr) => (qr.scans || 0) > (max.scans || 0) ? qr : max, savedQrs[0]);
        mostPopular = popular.scans || 0;
    }
    
    // Animate counters
    animateCounter('totalQrs', totalQrs);
    animateCounter('totalDownloads', totalDownloads);
    animateCounter('avgScans', avgScans);
    document.getElementById('mostPopular').textContent = mostPopular;
}

function animateCounter(elementId, target) {
    const element = document.getElementById(elementId);
    const duration = 1000;
    const start = parseInt(element.textContent) || 0;
    const increment = target / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
}

function renderQrCards(savedQrs) {
    const container = document.getElementById('savedQrsGrid');
    
    if (savedQrs.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="3" y="3" width="7" height="7" rx="1"/>
                    <rect x="14" y="3" width="7" height="7" rx="1"/>
                    <rect x="3" y="14" width="7" height="7" rx="1"/>
                </svg>
                <h3>No tienes QRs guardados</h3>
                <p>Crea tu primer código QR personalizado</p>
                <a href="index.html">Crear QR Ahora</a>
            </div>
        `;
        return;
    }
    
    container.innerHTML = savedQrs.map((qr, index) => `
        <div class="saved-qr-card" data-id="${qr.id}">
            <div class="saved-qr-header">
                <div class="qr-thumbnail" id="thumbnail-${qr.id}"></div>
                <div class="saved-qr-info">
                    <div class="qr-content">${escapeHtml(truncateString(qr.content, 35))}</div>
                    <div class="qr-date">${formatDate(qr.createdAt)}</div>
                    <span class="qr-type">${getQrType(qr.content)}</span>
                </div>
            </div>
            <div class="saved-qr-stats">
                <div class="saved-qr-stat">
                    <span class="stat-number">${qr.scans || 0}</span>
                    <span class="stat-text">Descargas</span>
                </div>
                <div class="saved-qr-stat">
                    <span class="stat-number">${qr.lastScan ? '✓' : '-'}</span>
                    <span class="stat-text">Actividad</span>
                </div>
            </div>
            <div class="saved-qr-actions">
                <button class="btn-download-qr" onclick="downloadQr('${qr.id}')">Descargar</button>
                <button class="btn-view-analytics" onclick="viewAnalytics('${qr.id}')">Ver Más</button>
                <button class="btn-delete-qr" onclick="deleteQr('${qr.id}')">Eliminar</button>
            </div>
        </div>
    `).join('');
    
    // Render thumbnails
    savedQrs.forEach(qr => {
        const thumbnail = new QRCodeStyling({
            width: 80,
            height: 80,
            type: 'canvas',
            data: qr.content,
            dotsOptions: { color: '#000000', type: 'rounded' },
            backgroundOptions: { color: '#ffffff' },
            cornersSquareOptions: { type: 'extra-rounded' }
        });
        const container = document.getElementById(`thumbnail-${qr.id}`);
        if (container) thumbnail.append(container);
    });
}

function getQrType(content) {
    if (content.startsWith('WIFI:')) return 'WiFi';
    if (content.startsWith('mailto:')) return 'Email';
    if (content.startsWith('tel:')) return 'Teléfono';
    if (content.startsWith('http')) return 'URL';
    return 'Texto';
}

function downloadQr(id) {
    const savedQrs = getSavedQrs();
    const qr = savedQrs.find(q => q.id === id);
    
    if (!qr) return;
    
    const qrCode = new QRCodeStyling(qr.options);
    qrCode.download({
        name: `qr-code-${id}`,
        extension: 'png'
    });
    
    // Track download
    trackScan(id);
    
    showToast('¡Descarga iniciada!');
}

function viewAnalytics(id) {
    const savedQrs = getSavedQrs();
    const qr = savedQrs.find(q => q.id === id);
    
    if (!qr) return;
    
    currentQrForModal = qr;
    
    // Render QR large
    const qrLarge = new QRCodeStyling({
        width: 150,
        height: 150,
        type: 'canvas',
        data: qr.content,
        dotsOptions: qr.options.dotsOptions,
        backgroundOptions: qr.options.backgroundOptions,
        cornersSquareOptions: qr.options.cornersSquareOptions
    });
    
    const container = document.getElementById('modalQrLarge');
    container.innerHTML = '';
    qrLarge.append(container);
    
    // Fill info
    document.getElementById('modalQrContent').textContent = truncateString(qr.content, 50);
    document.getElementById('modalQrCreated').textContent = formatDate(qr.createdAt);
    document.getElementById('modalQrType').textContent = getQrType(qr.content);
    document.getElementById('modalTotalScans').textContent = qr.scans || 0;
    document.getElementById('modalLastActivity').textContent = qr.lastScan ? formatDate(qr.lastScan) : '-';
    
    // Activity bar
    const maxScans = Math.max(...savedQrs.map(q => q.scans || 0));
    const percentage = maxScans > 0 ? ((qr.scans || 0) / maxScans) * 100 : 0;
    document.getElementById('activityBar').style.width = percentage + '%';
    
    document.getElementById('analyticsModal').classList.remove('hidden');
}

function deleteQr(id) {
    if (!confirm('¿Estás seguro de eliminar este QR?')) return;
    
    let savedQrs = getSavedQrs();
    savedQrs = savedQrs.filter(qr => qr.id !== id);
    localStorage.setItem('qrGenerator_savedQrs', JSON.stringify(savedQrs));
    
    showToast('QR eliminado');
    loadAnalytics();
}

function trackScan(id) {
    let savedQrs = getSavedQrs();
    const index = savedQrs.findIndex(qr => qr.id === id);
    
    if (index !== -1) {
        savedQrs[index].scans = (savedQrs[index].scans || 0) + 1;
        savedQrs[index].lastScan = new Date().toISOString();
        localStorage.setItem('qrGenerator_savedQrs', JSON.stringify(savedQrs));
        loadAnalytics();
    }
}

// Utility Functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function truncateString(str, maxLength) {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength) + '...';
}

function formatDate(isoString) {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showToast(message) {
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Make functions available globally
window.downloadQr = downloadQr;
window.viewAnalytics = viewAnalytics;
window.deleteQr = deleteQr;

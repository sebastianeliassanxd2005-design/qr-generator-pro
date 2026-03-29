// QR Generator Pro - Main Application Logic

// State
let currentQrCode = null;
let currentQrData = null;
let logoImage = null;
let downloadFormat = 'png';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('QR Generator Pro - Iniciando...');
    initApp();
});

function initApp() {
    // Get all DOM elements
    const elements = {
        qrUrlInput: document.getElementById('qrUrl'),
        generateBtn: document.getElementById('generateBtn'),
        previewContainer: document.getElementById('previewContainer'),
        downloadOptions: document.getElementById('downloadOptions'),
        downloadBtn: document.getElementById('downloadBtn'),
        analyticsPreview: document.getElementById('analyticsPreview'),
        savedQrsContainer: document.getElementById('savedQrs'),
        qrColorInput: document.getElementById('qrColor'),
        bgColorInput: document.getElementById('bgColor'),
        useGradientInput: document.getElementById('useGradient'),
        gradientInputs: document.getElementById('gradientInputs'),
        gradientColor1Input: document.getElementById('gradientColor1'),
        gradientColor2Input: document.getElementById('gradientColor2'),
        logoUpload: document.getElementById('logoUpload'),
        logoPreview: document.getElementById('logoPreview'),
        logoPreviewImg: document.getElementById('logoPreviewImg'),
        removeLogoBtn: document.getElementById('removeLogo'),
        sizeInputs: document.getElementsByName('qrSize'),
        errorCorrectionInput: document.getElementById('errorCorrection'),
        typeBtns: document.querySelectorAll('.type-btn'),
        wifiOptions: document.getElementById('wifiOptions'),
        wifiSsidInput: document.getElementById('wifiSsid'),
        wifiPasswordInput: document.getElementById('wifiPassword'),
        wifiEncryptionInput: document.getElementById('wifiEncryption'),
        scanCountEl: document.getElementById('scanCount'),
        lastScanEl: document.getElementById('lastScan'),
        totalQrEl: document.getElementById('totalQr'),
        viewAnalyticsBtn: document.getElementById('viewAnalyticsBtn')
    };

    console.log('Elementos encontrados:', {
        generateBtn: !!elements.generateBtn,
        qrUrlInput: !!elements.qrUrlInput,
        previewContainer: !!elements.previewContainer,
        typeBtns: elements.typeBtns.length
    });

    // Initialize
    loadSavedQrs();
    updateTotalQrCount();
    setupEventListeners(elements);
}

function setupEventListeners(el) {
    console.log('Configurando event listeners...');

    // Generate button
    if (el.generateBtn) {
        el.generateBtn.addEventListener('click', () => generateQR(el));
    }

    // Download button
    if (el.downloadBtn) {
        el.downloadBtn.addEventListener('click', () => downloadQR(el));
    }

    // Type selector
    el.typeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            el.typeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const type = btn.dataset.type;

            // Actualizar label y placeholder según el tipo
            const qrInputLabel = document.getElementById('qrInputLabel');
            const qrInputSmall = document.getElementById('qrInputSmall');
            
            const labels = {
                url: { label: 'URL *', placeholder: 'https://tu-sitio.com', small: 'Ingresa una dirección web completa' },
                text: { label: 'Texto *', placeholder: 'Escribe tu mensaje aquí', small: 'El texto se mostrará directamente al escanear' },
                email: { label: 'Email *', placeholder: 'ejemplo@correo.com', small: 'Se abrirá la app de correo automáticamente' },
                phone: { label: 'Teléfono *', placeholder: '+54 9 11 1234 5678', small: 'Se abrirá el marcador telefónico' },
                wifi: { label: 'Red WiFi *', placeholder: 'Nombre de la red', small: 'Los dispositivos se conectarán automáticamente' }
            };

            if (qrInputLabel) qrInputLabel.textContent = labels[type]?.label || 'URL o Contenido *';
            if (qrInputSmall) qrInputSmall.textContent = labels[type]?.small || '';
            
            if (el.qrUrlInput) {
                el.qrUrlInput.placeholder = labels[type]?.placeholder || 'https://tu-sitio.com';
            }

            if (type === 'wifi') {
                if (el.wifiOptions) el.wifiOptions.classList.remove('hidden');
            } else {
                if (el.wifiOptions) el.wifiOptions.classList.add('hidden');
            }
        });
    });

    // Gradient toggle
    if (el.useGradientInput) {
        el.useGradientInput.addEventListener('change', () => {
            if (el.gradientInputs) {
                if (el.useGradientInput.checked) {
                    el.gradientInputs.classList.remove('hidden');
                } else {
                    el.gradientInputs.classList.add('hidden');
                }
            }
        });
    }

    // Logo upload
    if (el.logoUpload) {
        el.logoUpload.addEventListener('change', (e) => handleLogoUpload(e, el));
    }

    // Remove logo
    if (el.removeLogoBtn && el.logoPreview) {
        el.removeLogoBtn.addEventListener('click', () => removeLogo(el));
    }

    // Format selector
    document.querySelectorAll('.format-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.format-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            downloadFormat = btn.dataset.format;
        });
    });

    // Analytics button
    if (el.viewAnalyticsBtn) {
        el.viewAnalyticsBtn.addEventListener('click', () => {
            window.location.href = 'analytics.html';
        });
    }

    // Enter key
    if (el.qrUrlInput) {
        el.qrUrlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') generateQR(el);
        });
    }
}

function getPlaceholder(type) {
    const placeholders = {
        url: 'https://tu-sitio.com',
        text: 'Escribe tu texto aquí',
        email: 'ejemplo@correo.com',
        phone: '+54 9 11 1234 5678'
    };
    return placeholders[type] || '';
}

function handleLogoUpload(e, el) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
        showToast('El archivo debe ser menor a 500KB');
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        logoImage = event.target.result;
        if (el.logoPreviewImg) el.logoPreviewImg.src = logoImage;
        if (el.logoPreview) el.logoPreview.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}

function removeLogo(el) {
    logoImage = null;
    if (el.logoUpload) el.logoUpload.value = '';
    if (el.logoPreview) el.logoPreview.classList.add('hidden');
}

function getContentValue(el) {
    const activeType = document.querySelector('.type-btn.active')?.dataset.type || 'url';

    if (activeType === 'wifi') {
        const ssid = el.wifiSsidInput?.value.trim() || '';
        const password = el.wifiPasswordInput?.value.trim() || '';
        const encryption = el.wifiEncryptionInput?.value || 'WPA';

        if (!ssid) {
            showToast('Ingresa el nombre de la red WiFi');
            return '';
        }

        return `WIFI:T:${encryption};S:${ssid};P:${password};;`;
    }

    if (activeType === 'email') {
        const email = el.qrUrlInput?.value.trim() || '';
        // El usuario ve solo el email, el QR incluye mailto: internamente
        return `mailto:${email}`;
    }

    if (activeType === 'phone') {
        const phone = el.qrUrlInput?.value.trim() || '';
        // El usuario ve solo el teléfono, el QR incluye tel: internamente
        return `tel:${phone}`;
    }

    return el.qrUrlInput?.value.trim() || '';
}

function generateQR(el) {
    const content = getContentValue(el);

    if (!content || content.trim() === '') {
        showToast('Por favor ingresa una URL o contenido');
        if (el.qrUrlInput) el.qrUrlInput.focus();
        return;
    }

    if (el.generateBtn) el.generateBtn.classList.add('loading');

    // Get settings
    const size = parseInt(Array.from(el.sizeInputs).find(r => r.checked)?.value || '512');
    const errorCorrection = el.errorCorrectionInput?.value || 'M';
    const qrColor = el.qrColorInput?.value || '#000000';
    const bgColor = el.bgColorInput?.value || '#ffffff';
    const useGradient = el.useGradientInput?.checked || false;
    const gradientColor1 = el.gradientColor1Input?.value || '#667eea';
    const gradientColor2 = el.gradientColor2Input?.value || '#764ba2';

    // Build QR options
    const qrOptions = {
        width: size,
        height: size,
        type: 'canvas',
        data: content,
        image: logoImage,
        dotsOptions: {
            color: qrColor,
            type: 'rounded'
        },
        backgroundOptions: {
            color: bgColor,
        },
        cornersSquareOptions: {
            type: 'extra-rounded'
        },
        imageOptions: {
            crossOrigin: 'anonymous',
            margin: 5,
            imageSize: 0.4
        },
        errorCorrectionLevel: errorCorrection
    };

    // Handle gradient
    if (useGradient) {
        qrOptions.dotsOptions = {
            type: 'gradient',
            gradient: {
                type: 'linear',
                rotation: 45,
                colorStops: [
                    { offset: 0, color: gradientColor1 },
                    { offset: 1, color: gradientColor2 }
                ]
            }
        };
    }

    // Generate QR
    setTimeout(() => {
        currentQrCode = new QRCodeStyling(qrOptions);
        currentQrData = {
            content: content,
            options: qrOptions,
            createdAt: new Date().toISOString(),
            scans: 0,
            lastScan: null,
            id: generateId()
        };

        // Render to preview
        if (el.previewContainer) {
            el.previewContainer.innerHTML = '';
            currentQrCode.append(el.previewContainer);
        }

        // Show download options
        if (el.downloadOptions) el.downloadOptions.classList.remove('hidden');

        // Save QR
        saveQr(currentQrData);

        // Update analytics
        if (el.analyticsPreview) {
            el.analyticsPreview.classList.remove('hidden');
            updateAnalyticsDisplay(el, currentQrData);
        }

        if (el.generateBtn) el.generateBtn.classList.remove('loading');
        updateTotalQrCount();

        showToast('¡QR generado exitosamente!');
    }, 300);
}

function downloadQR(el) {
    if (!currentQrCode) return;

    const filename = `qr-code-${Date.now()}`;

    currentQrCode.download({
        name: filename,
        extension: downloadFormat
    });

    // Track download as a scan
    if (currentQrData) {
        trackScan(currentQrData.id);
    }

    showToast('¡Descarga iniciada!');
}

// Local Storage Functions
function saveQr(qrData) {
    let savedQrs = getSavedQrs();

    // Check if same content exists, update it
    const existingIndex = savedQrs.findIndex(qr => qr.content === qrData.content);
    if (existingIndex !== -1) {
        savedQrs[existingIndex] = { ...qrData, scans: savedQrs[existingIndex].scans, lastScan: savedQrs[existingIndex].lastScan };
    } else {
        savedQrs.unshift(qrData);
    }

    // Keep only last 50 QRs
    savedQrs = savedQrs.slice(0, 50);

    localStorage.setItem('qrGenerator_savedQrs', JSON.stringify(savedQrs));
    loadSavedQrs();
}

function getSavedQrs() {
    const saved = localStorage.getItem('qrGenerator_savedQrs');
    return saved ? JSON.parse(saved) : [];
}

function loadSavedQrs() {
    const savedQrs = getSavedQrs();
    const savedQrsContainer = document.getElementById('savedQrs');

    if (!savedQrsContainer) return;

    if (savedQrs.length === 0) {
        savedQrsContainer.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="3" y="3" width="7" height="7" rx="1"/>
                    <rect x="14" y="3" width="7" height="7" rx="1"/>
                    <rect x="3" y="14" width="7" height="7" rx="1"/>
                </svg>
                <p>Tus QRs generados aparecerán aquí</p>
            </div>
        `;
        return;
    }

    savedQrsContainer.innerHTML = savedQrs.map(qr => `
        <div class="saved-qr-card" data-id="${qr.id}">
            <div class="saved-qr-header">
                <div id="qr-preview-${qr.id}"></div>
                <div class="saved-qr-info">
                    <p><strong>${escapeHtml(truncateString(qr.content, 30))}</strong></p>
                    <p>${formatDate(qr.createdAt)}</p>
                </div>
            </div>
            <div class="saved-qr-stats">
                <span class="saved-qr-stat"><strong>${qr.scans || 0}</strong> scans</span>
                <span class="saved-qr-stat"><strong>${qr.lastScan ? 'Sí' : 'No'}</strong> activity</span>
            </div>
            <div class="saved-qr-actions">
                <button class="btn-download-qr" onclick="downloadSavedQr('${qr.id}')">Descargar</button>
                <button class="btn-delete-qr" onclick="deleteQr('${qr.id}')">Eliminar</button>
            </div>
        </div>
    `).join('');

    // Render mini QR previews
    savedQrs.forEach(qr => {
        const preview = new QRCodeStyling({
            width: 80,
            height: 80,
            type: 'canvas',
            data: qr.content,
            dotsOptions: { color: '#000000', type: 'rounded' },
            backgroundOptions: { color: '#ffffff' },
            cornersSquareOptions: { type: 'extra-rounded' }
        });
        const container = document.getElementById(`qr-preview-${qr.id}`);
        if (container) preview.append(container);
    });
}

function downloadSavedQr(id) {
    const savedQrs = getSavedQrs();
    const qr = savedQrs.find(q => q.id === id);

    if (!qr) return;

    const qrCode = new QRCodeStyling(qr.options);
    qrCode.download({
        name: `qr-code-${id}`,
        extension: 'png'
    });

    trackScan(id);
    showToast('¡Descarga iniciada!');
}

function deleteQr(id) {
    if (!confirm('¿Estás seguro de eliminar este QR?')) return;

    let savedQrs = getSavedQrs();
    savedQrs = savedQrs.filter(qr => qr.id !== id);
    localStorage.setItem('qrGenerator_savedQrs', JSON.stringify(savedQrs));
    loadSavedQrs();
    updateTotalQrCount();
    showToast('QR eliminado');
}

function trackScan(id) {
    let savedQrs = getSavedQrs();
    const index = savedQrs.findIndex(qr => qr.id === id);

    if (index !== -1) {
        savedQrs[index].scans = (savedQrs[index].scans || 0) + 1;
        savedQrs[index].lastScan = new Date().toISOString();
        localStorage.setItem('qrGenerator_savedQrs', JSON.stringify(savedQrs));
        loadSavedQrs();

        // Update current display if same QR
        if (currentQrData && currentQrData.id === id) {
            const el = {
                scanCountEl: document.getElementById('scanCount'),
                lastScanEl: document.getElementById('lastScan')
            };
            updateAnalyticsDisplay(el, savedQrs[index]);
        }
    }
}

function updateAnalyticsDisplay(el, qrData) {
    if (el.scanCountEl) el.scanCountEl.textContent = qrData.scans || 0;
    if (el.lastScanEl) el.lastScanEl.textContent = qrData.lastScan ? formatDate(qrData.lastScan) : '-';
}

function updateTotalQrCount() {
    const savedQrs = getSavedQrs();
    const total = savedQrs.reduce((sum, qr) => sum + (qr.scans || 0), 0);
    const totalQrEl = document.getElementById('totalQr');

    if (totalQrEl) {
        animateCounter(totalQrEl, total);
    }
}

function animateCounter(element, target) {
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

// Utility Functions
function generateId() {
    return 'qr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

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
    // Remove existing toast
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

// Make functions available globally for onclick handlers
window.downloadSavedQr = downloadSavedQr;
window.deleteQr = deleteQr;

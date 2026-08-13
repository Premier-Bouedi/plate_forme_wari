const NUMERO_WHATSAPP_TRANSFERT = '212614717917';

function normalizePhone(phone) {
    return String(phone || NUMERO_WHATSAPP_TRANSFERT).replace(/\D/g, '');
}

function formatPhoneDisplay(phone) {
    const p = normalizePhone(phone);
    if (p === '212614717917') return '+212 614 717 917';
    if (p.startsWith('212')) return '+' + p.replace(/(\d{3})(\d{3})(\d{3})(\d+)/, '$1 $2 $3 $4');
    return '+' + p;
}

function isMobileDevice() {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function openWhatsAppTarget(phone, text) {
    const p = normalizePhone(phone);
    const encoded = encodeURIComponent(text);

    if (isMobileDevice()) {
        window.location.href = `whatsapp://send?phone=${p}&text=${encoded}`;
        return;
    }

    window.open(`https://web.whatsapp.com/send?phone=${p}&text=${encoded}`, '_blank');
}

async function prepareWhatsAppImage(file) {
    if (typeof createImageBitmap === 'function') {
        try {
            const bitmap = await createImageBitmap(file);
            return canvasFromBitmap(bitmap);
        } catch (err) {
            // fallback below
        }
    }

    if (file.type.startsWith('image/')) {
        try {
            const dataUrl = await readFileAsDataURL(file);
            const img = await loadImage(dataUrl);
            return canvasFromImage(img);
        } catch (err) {
            // fallback below
        }
    }

    if (file.type === 'image/jpeg' && file.size <= 8 * 1024 * 1024) {
        return new File([file], 'preuve-transaction.jpg', {
            type: 'image/jpeg',
            lastModified: Date.now()
        });
    }

    throw new Error('Impossible de préparer l\'image');
}

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

async function canvasFromBitmap(bitmap) {
    const maxSize = 1600;
    let width = bitmap.width;
    let height = bitmap.height;

    if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize / width, maxSize / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height);
    return canvasToJpegFile(canvas);
}

async function canvasFromImage(img) {
    const maxSize = 1600;
    let width = img.naturalWidth || img.width;
    let height = img.naturalHeight || img.height;

    if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize / width, maxSize / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').drawImage(img, 0, 0, width, height);
    return canvasToJpegFile(canvas);
}

function canvasToJpegFile(canvas) {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                reject(new Error('Conversion image impossible'));
                return;
            }
            resolve(new File([blob], 'preuve-transaction.jpg', {
                type: 'image/jpeg',
                lastModified: Date.now()
            }));
        }, 'image/jpeg', 0.88);
    });
}

async function dataUrlToFile(dataUrl) {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    return new File([blob], 'preuve-transaction.jpg', {
        type: blob.type || 'image/jpeg',
        lastModified: Date.now()
    });
}

async function copyImageToClipboard(file) {
    const jpegFile = file.type === 'image/jpeg'
        ? file
        : await prepareWhatsAppImage(file);

    if (!window.ClipboardItem || !navigator.clipboard?.write) {
        throw new Error('Clipboard non disponible');
    }

    await navigator.clipboard.write([
        new ClipboardItem({ 'image/jpeg': jpegFile })
    ]);
    return true;
}

function downloadImageFile(file) {
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name || 'preuve-transaction.jpg';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function tryNativeShare(shareData) {
    if (!navigator.share) return null;

    if (navigator.canShare && !navigator.canShare(shareData)) {
        return null;
    }

    try {
        await navigator.share(shareData);
        return true;
    } catch (err) {
        if (err.name === 'AbortError') return false;
        return null;
    }
}

function showWhatsAppPhotoHelp(phone, method) {
    const displayPhone = formatPhoneDisplay(phone);

    if (method === 'share') {
        alert(
            'Photo + message prêts.\n\n' +
            '1. Choisissez WhatsApp\n' +
            `2. Envoyez au numéro ${displayPhone}\n` +
            '3. Vérifiez que la photo est bien jointe avant d\'envoyer'
        );
        return;
    }

    if (method === 'clipboard') {
        alert(
            'Photo copiée.\n\n' +
            `1. WhatsApp s'ouvre vers ${displayPhone}\n` +
            '2. Cliquez dans la zone de message\n' +
            '3. Collez la photo : Ctrl+V\n' +
            '4. Envoyez le message'
        );
        return;
    }

    if (method === 'download') {
        alert(
            'Photo téléchargée.\n\n' +
            `1. WhatsApp s'ouvre vers ${displayPhone}\n` +
            '2. Cliquez sur 📎 (trombone)\n' +
            '3. Joignez le fichier preuve-transaction.jpg\n' +
            '4. Envoyez le message'
        );
    }
}

async function sendWhatsAppWithScreenshot({ phone, text, file }) {
    phone = normalizePhone(phone);
    const displayPhone = formatPhoneDisplay(phone);

    if (!file) {
        openWhatsAppTarget(phone, text);
        return { method: 'text' };
    }

    let imageFile;
    try {
        imageFile = await prepareWhatsAppImage(file);
    } catch (err) {
        openWhatsAppTarget(phone, text + '\n\n(Joignez la photo manuellement dans WhatsApp.)');
        alert('Impossible de préparer la photo. Joignez l\'image avec 📎 dans WhatsApp.');
        return { method: 'manual' };
    }

    const shareText = `${text}\n\n📞 ${displayPhone}`;

    const shareAttempts = [
        { files: [imageFile], text: shareText, title: 'Preuve de transaction' },
        { files: [imageFile], text: text },
        { files: [imageFile], title: 'Preuve de transaction' }
    ];

    for (const shareData of shareAttempts) {
        const shared = await tryNativeShare(shareData);
        if (shared === true) {
            showWhatsAppPhotoHelp(phone, 'share');
            return { method: 'share' };
        }
        if (shared === false) return { method: 'cancelled' };
    }

    try {
        await copyImageToClipboard(imageFile);
        openWhatsAppTarget(phone, text);
        showWhatsAppPhotoHelp(phone, 'clipboard');
        return { method: 'clipboard' };
    } catch (err) {
        downloadImageFile(imageFile);
        openWhatsAppTarget(phone, text);
        showWhatsAppPhotoHelp(phone, 'download');
        return { method: 'download' };
    }
}

async function sendToWhatsAppTransfert(text, file) {
    return sendWhatsAppWithScreenshot({
        phone: NUMERO_WHATSAPP_TRANSFERT,
        text,
        file
    });
}

async function sendToWhatsAppNumber(phone, text, file) {
    return sendWhatsAppWithScreenshot({ phone, text, file });
}

function closeBootstrapModal(modalId) {
    const modal = bootstrap?.Modal?.getInstance(document.getElementById(modalId));
    if (modal) modal.hide();
}

const _screenshotFiles = {};

function setupScreenshotCapture({ galleryInputId, cameraInputId, previewId, filenameId }) {
    const galleryInput = galleryInputId ? document.getElementById(galleryInputId) : null;
    const cameraInput = cameraInputId ? document.getElementById(cameraInputId) : null;
    const preview = document.getElementById(previewId);
    const filenameEl = filenameId ? document.getElementById(filenameId) : null;
    const storageKey = `${galleryInputId || ''}:${cameraInputId || ''}`;

    function handleFile(file) {
        if (!file || !file.type.startsWith('image/')) return;

        _screenshotFiles[storageKey] = file;
        _screenshotFile = file;

        if (preview) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.src = e.target.result;
                preview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }

        if (filenameEl) {
            filenameEl.textContent = file.name || 'Photo sélectionnée';
            filenameEl.style.display = 'block';
        }
    }

    if (galleryInput) {
        galleryInput.addEventListener('change', () => {
            if (cameraInput) cameraInput.value = '';
            handleFile(galleryInput.files[0]);
        });
    }

    if (cameraInput) {
        cameraInput.addEventListener('change', () => {
            if (galleryInput) galleryInput.value = '';
            handleFile(cameraInput.files[0]);
        });
    }
}

let _screenshotFile = null;

function getScreenshotFile(galleryInputId, cameraInputId) {
    const storageKey = `${galleryInputId || ''}:${cameraInputId || ''}`;
    if (_screenshotFiles[storageKey]) return _screenshotFiles[storageKey];
    if (_screenshotFile) return _screenshotFile;

    const galleryFile = document.getElementById(galleryInputId)?.files?.[0];
    const cameraFile = document.getElementById(cameraInputId)?.files?.[0];
    return galleryFile || cameraFile || null;
}

async function getScreenshotFileAsync(galleryInputId, cameraInputId, previewId = 'screenshotPreview') {
    const directFile = getScreenshotFile(galleryInputId, cameraInputId);
    if (directFile) return directFile;

    const preview = document.getElementById(previewId);
    if (preview?.src?.startsWith('data:image')) {
        try {
            return await dataUrlToFile(preview.src);
        } catch (err) {
            return null;
        }
    }

    return null;
}

function hasScreenshot(galleryInputId, cameraInputId, previewId = 'screenshotPreview') {
    if (getScreenshotFile(galleryInputId, cameraInputId)) return true;
    const preview = document.getElementById(previewId);
    return Boolean(preview?.src?.startsWith('data:image') && preview.style.display !== 'none');
}

async function sendTransactionWhatsApp({ phone, text, galleryInputId, cameraInputId, previewId }) {
    const file = await getScreenshotFileAsync(galleryInputId, cameraInputId, previewId);
    if (!file) {
        alert('Veuillez ajouter une capture d\'écran ou une photo avant d\'envoyer.');
        return { method: 'missing-photo' };
    }

    return sendWhatsAppWithScreenshot({
        phone: phone || NUMERO_WHATSAPP_TRANSFERT,
        text,
        file
    });
}

function resetScreenshotCapture({ galleryInputId, cameraInputId, previewId, filenameId }) {
    const storageKey = `${galleryInputId || ''}:${cameraInputId || ''}`;
    delete _screenshotFiles[storageKey];
    _screenshotFile = null;

    const galleryInput = document.getElementById(galleryInputId);
    const cameraInput = document.getElementById(cameraInputId);
    const preview = document.getElementById(previewId);
    const filenameEl = filenameId ? document.getElementById(filenameId) : null;

    if (galleryInput) galleryInput.value = '';
    if (cameraInput) cameraInput.value = '';
    if (preview) {
        preview.style.display = 'none';
        preview.removeAttribute('src');
    }
    if (filenameEl) {
        filenameEl.textContent = '';
        filenameEl.style.display = 'none';
    }
}

function setupScreenshotPreview(inputId, previewId) {
    setupScreenshotCapture({
        galleryInputId: inputId,
        cameraInputId: null,
        previewId,
        filenameId: null
    });
}

function resetScreenshotInput(inputId, previewId) {
    resetScreenshotCapture({
        galleryInputId: inputId,
        cameraInputId: null,
        previewId,
        filenameId: null
    });
}

function triggerScreenshotCamera(cameraInputId) {
    document.getElementById(cameraInputId)?.click();
}

function triggerScreenshotGallery(galleryInputId) {
    document.getElementById(galleryInputId)?.click();
}

function triggerScreenshotChoice(galleryInputId, cameraInputId) {
    if (isMobileDevice()) {
        const menu = document.getElementById('screenshotChoiceMenu');
        if (menu) {
            menu.dataset.gallery = galleryInputId;
            menu.dataset.camera = cameraInputId;
            menu.classList.add('open');
            return;
        }
    }

    triggerScreenshotGallery(galleryInputId);
}

function pickScreenshotSource(type) {
    const menu = document.getElementById('screenshotChoiceMenu');
    if (!menu) return;

    const galleryInputId = menu.dataset.gallery;
    const cameraInputId = menu.dataset.camera;
    menu.classList.remove('open');

    if (type === 'camera') triggerScreenshotCamera(cameraInputId);
    else triggerScreenshotGallery(galleryInputId);
}

function closeScreenshotMenu() {
    document.getElementById('screenshotChoiceMenu')?.classList.remove('open');
}

function bindWhatsAppSendButton({
    buttonId,
    galleryInputId,
    cameraInputId,
    previewId,
    nameInputId,
    onBeforeModal
}) {
    const button = document.getElementById(buttonId);
    if (!button) return;

    button.addEventListener('click', (event) => {
        const nameInput = nameInputId ? document.getElementById(nameInputId) : null;
        if (nameInput && !nameInput.value.trim()) {
            event.preventDefault();
            event.stopPropagation();
            alert('Veuillez indiquer votre nom et prénom avant d\'envoyer.');
            nameInput.focus();
            return;
        }

        if (!hasScreenshot(galleryInputId, cameraInputId, previewId)) {
            event.preventDefault();
            event.stopPropagation();
            alert('Veuillez ajouter une capture d\'écran ou une photo avant d\'envoyer.');
            return;
        }

        if (typeof onBeforeModal === 'function') {
            onBeforeModal();
        }
    });
}

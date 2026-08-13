const NUMERO_WHATSAPP_TRANSFERT = '212614717917';

function normalizePhone(phone) {
    return String(phone || NUMERO_WHATSAPP_TRANSFERT).replace(/\D/g, '');
}

function isMobileDevice() {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function openWhatsAppChat(phone, text) {
    const p = normalizePhone(phone);
    window.open(`https://wa.me/${p}?text=${encodeURIComponent(text)}`, '_blank');
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

            const blob = await new Promise((resolve, reject) => {
                canvas.toBlob((result) => {
                    if (result) resolve(result);
                    else reject(new Error('Conversion image impossible'));
                }, 'image/jpeg', 0.88);
            });

            return new File([blob], 'preuve-transaction.jpg', {
                type: 'image/jpeg',
                lastModified: Date.now()
            });
        } catch (err) {
            // Fallback below for older browsers
        }
    }

    if (file.type === 'image/jpeg' && file.size <= 5 * 1024 * 1024) {
        return new File([file], 'preuve-transaction.jpg', {
            type: 'image/jpeg',
            lastModified: Date.now()
        });
    }

    throw new Error('Impossible de préparer l\'image');
}

async function copyImageToClipboard(file) {
    const jpegBlob = file.type === 'image/jpeg'
        ? file
        : await prepareWhatsAppImage(file);

    if (!window.ClipboardItem || !navigator.clipboard?.write) {
        throw new Error('Clipboard non disponible');
    }

    await navigator.clipboard.write([
        new ClipboardItem({ 'image/jpeg': jpegBlob })
    ]);
    return true;
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

async function sendWhatsAppWithScreenshot({ phone, text, file }) {
    phone = normalizePhone(phone);

    if (!file) {
        openWhatsAppTarget(phone, text);
        return { method: 'text' };
    }

    let imageFile;
    try {
        imageFile = await prepareWhatsAppImage(file);
    } catch (err) {
        openWhatsAppTarget(phone, text + '\n\n(Joignez la photo manuellement dans WhatsApp.)');
        alert('Impossible de préparer la photo. WhatsApp va s\'ouvrir : joignez l\'image avec 📎.');
        return { method: 'manual' };
    }

    const shareText = `${text}\n\n📞 Destinataire : +${phone}`;

    // 1. Photo + message (idéal mobile)
    let shared = await tryNativeShare({
        files: [imageFile],
        text: shareText,
        title: 'Preuve de transaction'
    });
    if (shared === true) {
        if (isMobileDevice()) {
            alert('Choisissez WhatsApp, puis envoyez au numéro +212 614 717 917');
        }
        return { method: 'share' };
    }
    if (shared === false) return { method: 'cancelled' };

    // 2. Photo + message sans titre
    shared = await tryNativeShare({ files: [imageFile], text: text });
    if (shared === true) return { method: 'share' };
    if (shared === false) return { method: 'cancelled' };

    // 3. Photo seule → WhatsApp puis choix du contact
    shared = await tryNativeShare({ files: [imageFile], title: 'Preuve de transaction' });
    if (shared === true) {
        alert(
            'Photo partagée.\n\n' +
            'Dans WhatsApp, choisissez le contact :\n+212 614 717 917\n\n' +
            'Collez ensuite le message si besoin.'
        );
        openWhatsAppTarget(phone, text);
        return { method: 'share-file' };
    }
    if (shared === false) return { method: 'cancelled' };

    // 4. Ordinateur : copier la photo + ouvrir WhatsApp Web
    try {
        await copyImageToClipboard(imageFile);
        openWhatsAppTarget(phone, text);
        alert(
            '✅ Photo copiée !\n\n' +
            '1. WhatsApp s\'ouvre vers +212 614 717 917\n' +
            '2. Cliquez dans la zone de message\n' +
            '3. Collez la photo : Ctrl+V (ou clic droit → Coller)\n' +
            '4. Envoyez le message'
        );
        return { method: 'clipboard' };
    } catch (err) {
        openWhatsAppTarget(phone, text);
        alert(
            'WhatsApp va s\'ouvrir.\n\n' +
            'Joignez la photo avec l\'icône 📎 dans la conversation +212 614 717 917.'
        );
        return { method: 'manual' };
    }
}

async function sendToWhatsAppTransfert(text, file) {
    return sendWhatsAppWithScreenshot({
        phone: NUMERO_WHATSAPP_TRANSFERT,
        text,
        file
    });
}

function closeBootstrapModal(modalId) {
    const modal = bootstrap?.Modal?.getInstance(document.getElementById(modalId));
    if (modal) modal.hide();
}

let _screenshotFile = null;

function setupScreenshotCapture({ galleryInputId, cameraInputId, previewId, filenameId }) {
    const galleryInput = galleryInputId ? document.getElementById(galleryInputId) : null;
    const cameraInput = cameraInputId ? document.getElementById(cameraInputId) : null;
    const preview = document.getElementById(previewId);
    const filenameEl = filenameId ? document.getElementById(filenameId) : null;

    function handleFile(file) {
        if (!file || !file.type.startsWith('image/')) return;

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

function getScreenshotFile(galleryInputId, cameraInputId) {
    if (_screenshotFile) return _screenshotFile;

    const galleryFile = document.getElementById(galleryInputId)?.files?.[0];
    const cameraFile = document.getElementById(cameraInputId)?.files?.[0];
    return galleryFile || cameraFile || null;
}

function resetScreenshotCapture({ galleryInputId, cameraInputId, previewId, filenameId }) {
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

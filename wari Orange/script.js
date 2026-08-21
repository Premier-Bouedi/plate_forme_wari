let sens = "GM";

const FRAIS_ENVOI = 0.05;
const FRAIS_RECEPTION = 0.10;
const TAUX_MG = 61.0425;
const NUMERO_WHATSAPP = "212614717917";
// Configuration Formspree & ImgBB API Key
const FORM_ENDPOINT = "https://formspree.io/f/mnparjvv";
const IMGBB_API_KEY = "fe238cff0086b1f5ed53697c422f8262";

const btnGM = document.getElementById('btnGM');
const btnMG = document.getElementById('btnMG');
const amount = document.getElementById('amount');
const inputUnit = document.getElementById('inputUnit');
const result = document.getElementById('result');
const resultUnit = document.getElementById('resultUnit');
const info = document.getElementById('info');
const flagAccent = document.getElementById('flagAccent');

if (btnGM) btnGM.onclick = () => setSens("GM");
if (btnMG) btnMG.onclick = () => setSens("MG");

function setSens(dir) {
    sens = dir;
    if (btnGM) btnGM.classList.toggle('active', dir == "GM");
    if (btnMG) btnMG.classList.toggle('active', dir == "MG");
    if (inputUnit) inputUnit.innerText = dir == "GM" ? "FCFA" : "Dhs";
    if (resultUnit) resultUnit.innerText = dir == "GM" ? "Dhs" : "FCFA";
    if (flagAccent) flagAccent.className = "flag-accent " + (dir == "GM" ? "cm" : "mg");
    effectuerCalcul();
}

function effectuerCalcul() {
    let montantBrut = parseFloat(amount.value) || 0;
    if (montantBrut <= 0) {
        result.value = "";
        info.innerText = "";
        return;
    }

    let res, details;

    if (sens == "GM") {
        const montantApresEnvoi = montantBrut * (1 - FRAIS_ENVOI);
        const montantEnDhs = montantApresEnvoi / TAUX_MG;
        res = montantEnDhs * (1 - FRAIS_RECEPTION);
        details = `${montantBrut.toLocaleString('fr-FR')} FCFA − 5% = ${Math.round(montantApresEnvoi).toLocaleString('fr-FR')} FCFA → ${montantEnDhs.toFixed(2)} Dhs − 10% = ${res.toFixed(2)} Dhs reçu`;
        result.value = res.toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + " Dhs";
    } else {
        const montantApresEnvoi = montantBrut * (1 - FRAIS_ENVOI);
        const montantEnFCFA = montantApresEnvoi * TAUX_MG;
        res = montantEnFCFA * (1 - FRAIS_RECEPTION);
        details = `${montantBrut.toFixed(2)} Dhs − 5% = ${montantApresEnvoi.toFixed(2)} Dhs → ${Math.round(montantEnFCFA).toLocaleString('fr-FR')} FCFA − 10% = ${Math.round(res).toLocaleString('fr-FR')} FCFA reçu`;
        result.value = Math.round(res).toLocaleString('fr-FR') + " FCFA";
    }

    info.innerText = details;
}

if (amount) amount.addEventListener("input", effectuerCalcul);

function buildWhatsAppMessage(imageUrl = null) {
    let msg = `*TRANSFERT ORANGE MONEY WARI EXPRESS*\n\n`;
    msg += `*Nom:* ${document.getElementById('nom').value || 'Non renseigné'}\n`;
    msg += `*Ref OM:* ${document.getElementById('ref').value || 'Non renseigné'}\n`;
    msg += `*Sens:* ${sens == "GM" ? "Cameroun → Maroc" : "Maroc → Cameroun"}\n`;
    msg += `*Montant Envoyé:* ${amount.value || 0} ${inputUnit.innerText}\n`;
    msg += `*Montant Reçu Estimé:* ${result.value || '0'}\n`;
    msg += `*Frais:* 5% Envoi + 10% Réception\n`;
    if (imageUrl) {
        msg += `*Justificatif:* ${imageUrl}\n`;
    }
    msg += `--------------------------------\n`;
    msg += `Merci de valider la transaction Orange Money`;
    return msg;
}

document.addEventListener('DOMContentLoaded', function() {
    const fileUpload = document.getElementById('fileUpload');
    const dropZone = document.getElementById('dropZone');
    const filePreview = document.getElementById('filePreview');
    const previewImg = document.getElementById('previewImg');
    const previewPdf = document.getElementById('previewPdf');
    const fileNameEl = document.getElementById('fileName');
    const fileSizeEl = document.getElementById('fileSize');
    const uploadError = document.getElementById('uploadError');
    const removeFileBtn = document.getElementById('removeFileBtn');
    const MAX_SIZE = 5 * 1024 * 1024;
    let currentFile = null;

    if (fileUpload) {
        fileUpload.addEventListener('change', function(e) {
            const file = e.target.files[0];
            uploadError.textContent = '';
            if (file) {
                if (file.size > MAX_SIZE) {
                    uploadError.textContent = 'Fichier trop volumineux (max 5Mo).';
                    fileUpload.value = '';
                    currentFile = null;
                    return;
                }
                currentFile = file;
                fileNameEl.textContent = file.name;
                fileSizeEl.textContent = (file.size / 1024 / 1024).toFixed(2) + ' Mo';
                dropZone.style.display = 'none';
                filePreview.style.display = 'flex';
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        previewImg.src = e.target.result;
                        previewImg.style.display = 'block';
                        previewPdf.style.display = 'none';
                    };
                    reader.readAsDataURL(file);
                } else {
                    previewImg.style.display = 'none';
                    previewPdf.style.display = 'flex';
                }
            }
        });
    }

    if (removeFileBtn) {
        removeFileBtn.addEventListener('click', function() {
            fileUpload.value = '';
            currentFile = null;
            dropZone.style.display = 'flex';
            filePreview.style.display = 'none';
            uploadError.textContent = '';
        });
    }

    function openWhatsApp(message) {
        const url = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(message)}`;
        window.location.href = url;
    }

    const btnSend = document.getElementById('btnSendWhatsApp');
    if (btnSend) {
        btnSend.addEventListener('click', async function() {
            const originalHTML = btnSend.innerHTML;
            let uploadedImageUrl = null;

            if (currentFile) {
                try {
                    btnSend.innerText = "Upload de la capture...";
                    btnSend.disabled = true;

                    if (IMGBB_API_KEY) {
                        const imgData = new FormData();
                        imgData.append('image', currentFile);
                        const imgRes = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
                            method: 'POST',
                            body: imgData
                        });
                        const imgJson = await imgRes.json();
                        if (imgJson && imgJson.data && imgJson.data.url) {
                            uploadedImageUrl = imgJson.data.url;
                        }
                    }

                    if (FORM_ENDPOINT) {
                        const formData = new FormData();
                        formData.append('nom', nom?.value || 'Non renseigné');
                        formData.append('reference', document.getElementById('ref')?.value || 'Non renseigné');
                        formData.append('service', 'Orange Money');
                        formData.append('montant', amount?.value || '0');
                        formData.append('justificatif', currentFile);
                        if (uploadedImageUrl) formData.append('image_url', uploadedImageUrl);

                        fetch(FORM_ENDPOINT, {
                            method: 'POST',
                            body: formData,
                            headers: { 'Accept': 'application/json' }
                        }).catch(err => console.log('Erreur Formspree:', err));
                    }
                } catch (err) {
                    console.log('Erreur upload justificatif:', err);
                } finally {
                    btnSend.innerHTML = originalHTML;
                    btnSend.disabled = false;
                }
            }

            const message = buildWhatsAppMessage(uploadedImageUrl);
            openWhatsApp(message);
        });
    }

    const btnContact = document.getElementById('btnContactSupport');
    if (btnContact) {
        btnContact.addEventListener('click', function() {
            openWhatsApp("Bonjour, j'ai besoin d'aide concernant mon transfert Orange Money. Merci.");
        });
    }
    // Aide
    const btnAide = document.getElementById('btnAide');
    if (btnAide) {
        btnAide.onclick = () => {
            alert("Aide Orange Money:\n\n1. Choisissez le sens (Cameroun ↔ Maroc)\n2. Copiez le numéro Orange Money\n3. Entrez le montant à envoyer\n4. Remplissez votre nom et référence\n5. Ajoutez un justificatif (optionnel)\n6. Cliquez sur 'Envoyer via WhatsApp'");
        };
    }
});

function copyText(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
        const originalText = btn.innerText;
        btn.innerText = "Copié !";
        btn.style.background = "var(--orange)";
        btn.style.color = "white";
        setTimeout(() => {
            btn.innerText = originalText;
            btn.style.background = "";
            btn.style.color = "";
        }, 2000);
    });
}

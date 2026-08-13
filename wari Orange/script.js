let sens = "GM";

const FRAIS_ENVOI = 0.05;
const FRAIS_RECEPTION = 0.10;
const TAUX_MG = 61.0425;
const NUMERO_WHATSAPP = "212614717917";

const SCREENSHOT_OPTS = {
    galleryInputId: 'mainScreenshot',
    cameraInputId: 'mainCamera',
    previewId: 'screenshotPreview',
    filenameId: 'screenshotFilename'
};

setupScreenshotCapture(SCREENSHOT_OPTS);

bindWhatsAppSendButton({
    buttonId: 'wa',
    galleryInputId: 'mainScreenshot',
    cameraInputId: 'mainCamera',
    previewId: 'screenshotPreview',
    nameInputId: 'nom',
    onBeforeModal: () => {
        document.getElementById('modalQuestionBody').style.display = 'block';
        document.getElementById('modalDetailsBody').style.display = 'none';
        document.getElementById('modalRef').value = '';
    }
});

btnGM.onclick = () => setSens("GM");
btnMG.onclick = () => setSens("MG");

function setSens(dir) {
    sens = dir;
    btnGM.classList.toggle('active', dir == "GM");
    btnMG.classList.toggle('active', dir == "MG");
    inputUnit.innerText = dir == "GM" ? "FCFA" : "Dhs";
    resultUnit.innerText = dir == "GM" ? "Dhs" : "FCFA";
    flagAccent.className = "flag-accent " + (dir == "GM" ? "cm" : "mg");
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

amount.addEventListener("input", effectuerCalcul);

document.getElementById('modalBtnNon').onclick = async () => {
    let msg = `*DEMANDE ORANGE MONEY WARI EXPRESS*\n\n`;
    msg += `*Statut:* Je souhaite effectuer une transaction Orange Money.\n`;
    msg += `*Êtes-vous en ligne ?*\n\n`;
    msg += `*Nom:* ${document.getElementById('nom').value || 'Non renseigné'}\n`;
    msg += `*Sens:* ${sens == "GM" ? "Cameroun → Maroc" : "Maroc → Cameroun"}\n`;
    msg += `*Montant Envoyé:* ${amount.value || 0} ${inputUnit.innerText}\n`;
    msg += `*Montant Reçu Estimé:* ${result.value || '0'}\n`;
    msg += `*Frais:* 5% Envoi + 10% Réception\n`;
    msg += `--------------------------------`;

    const sendResult = await sendTransactionWhatsApp({
        text: msg,
        galleryInputId: 'mainScreenshot',
        cameraInputId: 'mainCamera',
        previewId: 'screenshotPreview'
    });
    if (sendResult.method === 'cancelled' || sendResult.method === 'missing-photo') return;

    closeBootstrapModal('transactionModal');
};

document.getElementById('modalBtnOui').onclick = () => {
    document.getElementById('modalQuestionBody').style.display = 'none';
    document.getElementById('modalDetailsBody').style.display = 'block';
};

document.getElementById('modalBtnSend').onclick = async () => {
    let refVal = document.getElementById('modalRef').value;

    let msg = `*TRANSFERT ORANGE MONEY WARI EXPRESS*\n\n`;
    msg += `*Statut:* Transaction Orange Money effectuée.\n`;
    msg += `*Nom:* ${document.getElementById('nom').value || 'Non renseigné'}\n`;
    if (refVal) msg += `*Ref OM:* ${refVal}\n`;
    msg += `*Capture SMS Orange:* Jointe avec ce message.\n`;
    msg += `*Sens:* ${sens == "GM" ? "Cameroun → Maroc" : "Maroc → Cameroun"}\n`;
    msg += `*Montant Envoyé:* ${amount.value || 0} ${inputUnit.innerText}\n`;
    msg += `*Montant Reçu Estimé:* ${result.value || '0'}\n`;
    msg += `*Frais:* 5% Envoi + 10% Réception\n`;
    msg += `--------------------------------\n`;
    msg += `Merci de valider la transaction Orange Money`;

    const sendResult = await sendTransactionWhatsApp({
        text: msg,
        galleryInputId: 'mainScreenshot',
        cameraInputId: 'mainCamera',
        previewId: 'screenshotPreview'
    });

    if (sendResult.method === 'cancelled' || sendResult.method === 'missing-photo') return;

    closeBootstrapModal('transactionModal');
};

btnAide.onclick = () => {
    alert("Aide Orange Money:\n\nFrais: 5% à l'envoi + 10% à la réception.\n\n1. Choisissez le sens\n2. Copiez le numéro Orange Money\n3. Entrez le montant\n4. Ajoutez capture + nom\n5. Envoyez sur WhatsApp");
};

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

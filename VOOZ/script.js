let sens = "GM";

const FRAIS_ENVOI = 0;
const FRAIS_RECEPTION = 0.13;
const TAUX_GM = 0.0145;
const TAUX_MG = 61.0425;
const NUMERO_WHATSAPP = "212614717917";

btnGM.onclick = () => setSens("GM");
btnMG.onclick = () => setSens("MG");

function setSens(dir) {
    sens = dir;
    btnGM.classList.toggle('active', dir == "GM");
    btnMG.classList.toggle('active', dir == "MG");
    inputUnit.innerText = dir == "GM" ? "FCFA" : "Dhs";
    resultUnit.innerText = dir == "GM" ? "Dhs" : "FCFA";
    flagAccent.className = "flag-accent " + (dir == "GM" ? "gm" : "mg");
    effectuerCalcul();
}

function effectuerCalcul() {
    let montant = parseFloat(amount.value) || 0;
    if (montant <= 0) {
        result.value = "";
        info.innerText = "";
        return;
    }

    let res = 0;
    let details = "";

    if (sens == "GM") {
        const montantApresEnvoi = montant * (1 - FRAIS_ENVOI);
        const montantEnDhs = montantApresEnvoi * TAUX_GM;
        res = montantEnDhs * (1 - FRAIS_RECEPTION);
        details = `${montant.toLocaleString('fr-FR')} FCFA → ${montantEnDhs.toFixed(2)} Dhs − 13% = ${res.toFixed(2)} Dhs reçu`;
        result.value = res.toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + " Dhs";
    } else {
        const montantApresEnvoi = montant * (1 - FRAIS_ENVOI);
        const montantEnFCFA = montantApresEnvoi * TAUX_MG;
        res = montantEnFCFA * (1 - FRAIS_RECEPTION);
        details = `${montant.toFixed(2)} Dhs → ${Math.round(montantEnFCFA).toLocaleString('fr-FR')} FCFA − 13% = ${Math.round(res).toLocaleString('fr-FR')} FCFA reçu`;
        result.value = Math.round(res).toLocaleString('fr-FR') + " FCFA";
    }

    info.innerText = "Envoi gratuit · Réception 13% · " + details;
}

amount.addEventListener("input", effectuerCalcul);

function buildWhatsAppMessage() {
    let msg = `*NOUVELLE TRANSACTION WAVE MONEY*\n\n`;
    msg += `*Nom:* ${nom.value || 'Non renseigné'}\n`;
    msg += `*Ref:* ${document.getElementById('ref').value || 'Non renseigné'}\n`;
    msg += `*Sens:* ${sens == "GM" ? "Sénégal → Maroc" : "Maroc → Sénégal"}\n`;
    msg += `*Montant Envoyé:* ${amount.value || 0} ${inputUnit.innerText}\n`;
    msg += `*Montant Reçu Estimé:* ${result.value || '0'}\n`;
    msg += `*Frais:* Envoi gratuit · Réception 13%\n`;
    msg += `--------------------------------\n`;
    msg += `Merci de valider la transaction Wave Money`;
    return msg;
}

setupDualWhatsAppButtons({
    sansButtonId: 'waSans',
    avecButtonId: 'waAvec',
    nameInputId: 'nom',
    refInputId: 'ref',
    phone: NUMERO_WHATSAPP,
    downloadPrefix: 'Preuve_Wave',
    getMessage: buildWhatsAppMessage,
    galleryInputId: 'mainScreenshot',
    cameraInputId: 'mainCamera',
    previewId: 'screenshotPreview',
    filenameId: 'screenshotFilename'
});

btnAide.onclick = () => {
    alert("Aide Wave Money:\n\n1. Choisissez le sens\n2. Copiez le numéro\n3. Entrez le montant\n4. Ajoutez nom + ref + capture\n5. Choisissez « sans image » ou « avec image » sur WhatsApp");
};

function copyText(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
        const originalText = btn.innerText;
        btn.innerText = "Copié !";
        btn.style.background = "var(--or)";
        btn.style.color = "var(--violet)";
        setTimeout(() => {
            btn.innerText = originalText;
            btn.style.background = "";
            btn.style.color = "";
        }, 2000);
    });
}

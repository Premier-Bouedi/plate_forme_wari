let sens = "GM";

const FRAIS_ENVOI = 0;
const FRAIS_RECEPTION = 0.13;
const REF_FCFA = 100000;
const REF_DHS = 1450;
const TAUX_GM = REF_DHS / (REF_FCFA * (1 - FRAIS_RECEPTION));
const TAUX_MG = REF_FCFA / (REF_DHS * (1 - FRAIS_RECEPTION));
const NUMERO_WHATSAPP = "212614717917";

const btnGM = document.getElementById('btnGM');
const btnMG = document.getElementById('btnMG');
const amount = document.getElementById('amount');
const inputUnit = document.getElementById('inputUnit');
const result = document.getElementById('result');
const resultUnit = document.getElementById('resultUnit');
const info = document.getElementById('info');
const flagAccent = document.getElementById('flagAccent');
const nom = document.getElementById('nom');
const btnAide = document.getElementById('btnAide');

if (btnGM) btnGM.addEventListener('click', () => setSens('GM'));
if (btnMG) btnMG.addEventListener('click', () => setSens('MG'));

function setSens(dir) {
    sens = dir;
    if (btnGM) btnGM.classList.toggle('active', dir == "GM");
    if (btnMG) btnMG.classList.toggle('active', dir == "MG");
    if (inputUnit) inputUnit.innerText = dir == "GM" ? "FCFA" : "Dhs";
    if (resultUnit) resultUnit.innerText = dir == "GM" ? "Dhs" : "FCFA";
    if (flagAccent) flagAccent.className = "flag-accent " + (dir == "GM" ? "gm" : "mg");
    effectuerCalcul();
}

function effectuerCalcul() {
    if (!amount || !result || !info || !inputUnit || !resultUnit) {
        return;
    }

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
        details = `${montant.toLocaleString('fr-FR')} FCFA → ${montantEnDhs.toFixed(2)} Dhs − 13% réception = ${res.toFixed(2)} Dhs reçu`;
        result.value = res.toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + " Dhs";
    } else {
        const montantApresEnvoi = montant * (1 - FRAIS_ENVOI);
        const montantEnFCFA = montantApresEnvoi * TAUX_MG;
        res = montantEnFCFA * (1 - FRAIS_RECEPTION);
        details = `${montant.toFixed(2)} Dhs → ${Math.round(montantEnFCFA).toLocaleString('fr-FR')} FCFA − 13% réception = ${Math.round(res).toLocaleString('fr-FR')} FCFA reçu`;
        result.value = Math.round(res).toLocaleString('fr-FR') + " FCFA";
    }

    info.innerText = "Envoi gratuit · Réception 13% · " + details;
}

if (amount) {
    amount.addEventListener("input", effectuerCalcul);
}

function buildWhatsAppMessage() {
    let msg = `*TRANSACTION AIRTEL MONEY WARI EXPRESS*\n\n`;
    msg += `*Nom:* ${nom?.value || 'Non renseigné'}\n`;
    msg += `*Ref:* ${document.getElementById('ref').value || 'Non renseigné'}\n`;
    msg += `*Sens:* ${sens == "GM" ? "Gabon → Maroc" : "Maroc → Gabon"}\n`;
    msg += `*Montant Envoyé:* ${amount.value || 0} ${inputUnit.innerText}\n`;
    msg += `*Montant Reçu Estimé:* ${result.value || '0'}\n`;
    msg += `*Frais:* Envoi gratuit · Réception 13%\n`;
    msg += `--------------------------------\n`;
    msg += `Merci de valider la transaction Airtel Money`;
    return msg;
}

setupDualWhatsAppButtons({
    sansButtonId: 'waSans',
    avecButtonId: 'waAvec',
    nameInputId: 'nom',
    refInputId: 'ref',
    phone: NUMERO_WHATSAPP,
    downloadPrefix: 'Preuve_Airtel',
    getMessage: buildWhatsAppMessage,
    galleryInputId: 'mainScreenshot',
    cameraInputId: 'mainCamera',
    previewId: 'screenshotPreview',
    filenameId: 'screenshotFilename'
});

if (btnAide) {
    btnAide.addEventListener('click', () => {
        alert("Aide Wari Express Airtel Money:\n\n1. Choisissez le sens\n2. Copiez le numéro\n3. Entrez le montant\n4. Ajoutez nom + ref + capture\n5. Choisissez « sans image » ou « avec image » sur WhatsApp");
    });
}

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

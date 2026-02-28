(function () {
    'use strict';

    const S = {
        container: "padding:30px; font-family: sans-serif; color:#1e293b; background:white;",
        header: "border-bottom:3px solid #0ea5e9; padding-bottom:15px; margin-bottom:25px; display:flex; justify-content:space-between;",
        title: "margin:0; color:#0ea5e9; font-size:24px;",
        card: "background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; margin-bottom:20px;",
        grid: "display:grid; grid-template-columns: 1fr 1fr; gap:15px;",
        label: "font-size:12px; color:#64748b; text-transform:uppercase;",
        value: "font-size:16px; font-weight:600; color:#0f172a;",
        highlight: "background:#0ea5e9; color:white; padding:20px; border-radius:12px; text-align:center; margin-bottom:20px;"
    };

    function generer(el, filename) {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:9999;display:flex;align-items:center;justify-content:center;color:white;';
        overlay.innerHTML = 'Génération du PDF...';
        document.body.appendChild(overlay);

        // On s'assure que l'élément est dans le DOM pour html2canvas
        el.style.position = 'absolute';
        el.style.left = '-10000px';
        document.body.appendChild(el);

        const opt = {
            margin: 10,
            filename: filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // Délai pour garantir que le rendu HTML est fini
        setTimeout(() => {
            html2pdf().set(opt).from(el).save().then(() => {
                document.body.removeChild(el);
                document.body.removeChild(overlay);
            }).catch(err => {
                console.error(err);
                document.body.removeChild(overlay);
            });
        }, 500);
    }

    window.exportPDCReport = function (d) {
        // Sécurité : on vérifie si les données existent ou on met 0 par défaut
        const safeGet = (val) => (val !== undefined && val !== null) ? val : 0;

        const el = document.createElement('div');
        el.innerHTML = `
        <div style="${S.container}">
            <div style="${S.header}">
                <h1 style="${S.title}">Rapport Pertes de Charge</h1>
            </div>
            <div style="${S.highlight}">
                <div style="font-size:14px;">PERTE DE CHARGE TOTALE</div>
                <div style="font-size:42px; font-weight:bold;">${safeGet(d.pdcTotale).toFixed(3)} bar</div>
            </div>
            <div style="${S.card}">
                <div style="${S.grid}">
                    <div><div style="${S.label}">Débit</div><div style="${S.value}">${safeGet(d.debit)} m³/h</div></div>
                    <div><div style="${S.label}">Diamètre</div><div style="${S.value}">${safeGet(d.diametre)} mm</div></div>
                    <div><div style="${S.label}">Vitesse</div><div style="${S.value}">${safeGet(d.vitesse).toFixed(2)} m/s</div></div>
                    <div><div style="${S.label}">Longueur</div><div style="${S.value}">${safeGet(d.longueur)} m</div></div>
                </div>
            </div>
        </div>`;
        generer(el, 'rapport.pdf');
    };

    window.exportNPSHReport = function (d) {
        const safeGet = (val) => (val !== undefined && val !== null) ? val : 0;
        const el = document.createElement('div');
        el.innerHTML = `<div style="${S.container}"><h1>Rapport NPSH</h1><p>NPSHd: ${safeGet(d.npshd).toFixed(2)} m</p></div>`;
        generer(el, 'npsh.pdf');
    };
})();
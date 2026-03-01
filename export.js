// ─── export.js — Version "Iframe Isolation" (Ultra-FIABLE) ──────────────────
(function () {
    'use strict';

    function today() {
        return new Date().toLocaleDateString('fr-FR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }

    const n = (v) => (typeof v === 'number' && !isNaN(v) ? v : 0);

    // Styles CSS sous forme de chaîne pour l'injection dans l'iframe
    const styles = `
        body { margin: 0; padding: 40px; font-family: Arial, sans-serif; background: white; }
        .container { width: 700px; margin: auto; }
        .header { border-bottom: 3px solid #0ea5e9; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center; }
        .title { margin: 0; color: #0ea5e9; font-size: 26px; font-weight: bold; }
        .highlight { background: #0ea5e9; color: white; padding: 30px; border-radius: 16px; text-align: center; margin-bottom: 30px; }
        .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
        .row { display: flex; flex-wrap: wrap; gap: 20px; }
        .item { flex: 1; min-width: 140px; }
        .label { font-size: 11px; color: #64748b; text-transform: uppercase; margin-bottom: 4px; font-weight: bold; }
        .value { font-size: 17px; font-weight: 600; color: #0f172a; }
        .footer { font-size: 11px; color: #94a3b8; margin-top: 50px; border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center; }
    `;

    function generer(contentHTML, filename) {
        // 1. Overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.9);z-index:100000;display:flex;align-items:center;justify-content:center;color:white;font-family:sans-serif;';
        overlay.innerHTML = '<b>GÉNÉRATION DU RAPPORT...</b>';
        document.body.appendChild(overlay);

        // 2. Création d'une iframe invisible pour isoler le rendu
        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'position:absolute;width:800px;height:1200px;top:-5000px;left:-5000px;';
        document.body.appendChild(iframe);

        const doc = iframe.contentDocument || iframe.contentWindow.document;
        doc.open();
        doc.write(`
            <html>
                <head><style>${styles}</style></head>
                <body><div class="container">${contentHTML}</div></body>
            </html>
        `);
        doc.close();

        const opt = {
            margin: 10,
            filename: filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false, scrollY: 0 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // 3. On attend que l'iframe soit prête
        setTimeout(() => {
            html2pdf().set(opt).from(doc.body).save()
                .then(() => {
                    document.body.removeChild(iframe);
                    document.body.removeChild(overlay);
                })
                .catch(err => {
                    console.error(err);
                    document.body.removeChild(overlay);
                });
        }, 800);
    }

    window.exportPDCReport = function (d) {
        if (!d) return;
        const html = `
            <div class="header">
                <h1 class="title">Rapport Pertes de Charge</h1>
                <div style="text-align:right; font-size:12px; color:#64748b;">${today()}</div>
            </div>
            <div class="highlight">
                <div style="font-size:14px; opacity:0.9; margin-bottom:5px;">PERTE DE CHARGE TOTALE</div>
                <div style="font-size:48px; font-weight:900;">${n(d.pdcTotale).toFixed(3)} bar</div>
            </div>
            <div class="card">
                <div class="row">
                    <div class="item"><div class="label">Débit</div><div class="value">${n(d.debit)} m³/h</div></div>
                    <div class="item"><div class="label">Diamètre</div><div class="value">${n(d.diametre)} mm</div></div>
                    <div class="item"><div class="label">Vitesse</div><div class="value">${n(d.vitesse).toFixed(2)} m/s</div></div>
                </div>
            </div>
            <div class="card">
                <div class="row">
                    <div class="item"><div class="label">PDC Linéaire</div><div class="value">${n(d.pdcLineaire).toFixed(3)} bar</div></div>
                    <div class="item"><div class="label">PDC Singulière</div><div class="value">${n(d.pdcSinguliere).toFixed(3)} bar</div></div>
                </div>
            </div>
            <div class="footer">Document généré via Pertes de Charge App</div>
        `;
        generer(html, 'rapport-pdc.pdf');
    };

    window.exportNPSHReport = function (d) {
        if (!d) return;
        const marge = n(d.npshd) - n(d.npshr);
        const html = `
            <div class="header"><h1 class="title">Analyse NPSH</h1></div>
            <div class="highlight" style="background:${marge > 0.5 ? '#10b981' : '#ef4444'}">
                <div style="font-size:14px; opacity:0.9;">MARGE DE SÉCURITÉ</div>
                <div style="font-size:48px; font-weight:900;">${marge.toFixed(2)} m</div>
            </div>
            <div class="card">
                <div class="row">
                    <div class="item"><div class="label">NPSH Disponible</div><div class="value">${n(d.npshd).toFixed(2)} m</div></div>
                    <div class="item"><div class="label">NPSH Requis</div><div class="value">${n(d.npshr).toFixed(2)} m</div></div>
                </div>
            </div>
        `;
        generer(html, 'analyse-npsh.pdf');
    };
})();
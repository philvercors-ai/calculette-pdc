// ─── export.js — Version Finale (Correctif Page Blanche & toFixed) ──────────
(function () {
    'use strict';

    // Aide pour la date
    function today() {
        return new Date().toLocaleDateString('fr-FR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }

    // Sécurité : évite le crash si une valeur est undefined ou null
    const n = (v) => (typeof v === 'number' && !isNaN(v) ? v : 0);

    // Styles Inline robustes (plus fiables que Tailwind pour l'export PDF)
    const S = {
        container: "padding:40px; font-family: Arial, sans-serif; color:#1e293b; background:white; min-height:1100px; width:750px; box-sizing:border-box;",
        header: "border-bottom:3px solid #0ea5e9; padding-bottom:15px; margin-bottom:25px; display:flex; justify-content:space-between; align-items:center;",
        title: "margin:0; color:#0ea5e9; font-size:26px; font-weight:bold;",
        highlight: "background:#0ea5e9; color:white; padding:30px; border-radius:16px; text-align:center; margin-bottom:30px;",
        card: "background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; margin-bottom:20px;",
        row: "display:flex; flex-wrap:wrap; gap:20px;",
        item: "flex:1; min-width:140px;",
        label: "font-size:11px; color:#64748b; text-transform:uppercase; margin-bottom:4px; font-weight:bold;",
        value: "font-size:17px; font-weight:600; color:#0f172a;",
        footer: "font-size:11px; color:#94a3b8; margin-top:50px; border-top:1px solid #e2e8f0; padding-top:15px; text-align:center;"
    };

    function generer(htmlContent, filename) {
        // 1. Overlay de chargement
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.95);z-index:100000;display:flex;align-items:center;justify-content:center;color:white;font-family:sans-serif;font-weight:bold;';
        overlay.innerHTML = 'GÉNÉRATION DU PDF...';
        document.body.appendChild(overlay);

        // 2. Préparation de l'élément de capture
        const el = document.createElement('div');
        el.innerHTML = htmlContent;
        // IMPORTANT : Doit être dans le DOM pour que html2canvas calcule la hauteur, 
        // mais on le met en opacité 0 pour ne pas gêner l'utilisateur.
        el.style.cssText = 'position:absolute; left:0; top:0; z-index:-1; opacity:0; pointer-events:none;';
        document.body.appendChild(el);

        const opt = {
            margin: 0,
            filename: filename,
            image: { type: 'jpeg', quality: 1 },
            html2canvas: { 
                scale: 2, 
                useCORS: true, 
                logging: false,
                scrollY: 0,
                windowWidth: 800
            },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // 3. Petit délai pour laisser le temps au navigateur de "peindre" l'élément
        setTimeout(() => {
            html2pdf().set(opt).from(el).save()
                .then(() => {
                    document.body.removeChild(el);
                    document.body.removeChild(overlay);
                })
                .catch(err => {
                    console.error("Erreur PDF:", err);
                    document.body.removeChild(overlay);
                });
        }, 600);
    }

    // --- Rapport Pertes de Charge ---
    window.exportPDCReport = function (d) {
        if (!d) return;
        const html = `
        <div style="${S.container}">
            <div style="${S.header}">
                <h1 style="${S.title}">Rapport Pertes de Charge</h1>
                <div style="text-align:right; font-size:12px; color:#64748b;">${today()}</div>
            </div>

            <div style="${S.highlight}">
                <div style="font-size:14px; opacity:0.9; margin-bottom:5px;">PERTE DE CHARGE TOTALE</div>
                <div style="font-size:48px; font-weight:900;">${n(d.pdcTotale).toFixed(3)} <span style="font-size:20px;">bar</span></div>
            </div>

            <div style="${S.card}">
                <div style="${S.row}">
                    <div style="${S.item}"><div style="${S.label}">Débit</div><div style="${S.value}">${n(d.debit)} m³/h</div></div>
                    <div style="${S.item}"><div style="${S.label}">Diamètre</div><div style="${S.value}">${n(d.diametre)} mm</div></div>
                    <div style="${S.item}"><div style="${S.label}">Vitesse</div><div style="${S.value}">${n(d.vitesse).toFixed(2)} m/s</div></div>
                </div>
            </div>

            <div style="${S.card}">
                <div style="${S.row}">
                    <div style="${S.item}"><div style="${S.label}">PDC Linéaire</div><div style="${S.value}">${n(d.pdcLineaire).toFixed(3)} bar</div></div>
                    <div style="${S.item}"><div style="${S.label}">PDC Singulière</div><div style="${S.value}">${n(d.pdcSinguliere).toFixed(3)} bar</div></div>
                </div>
            </div>

            <div style="${S.footer}">Généré par Pertes de Charge App</div>
        </div>`;
        generer(html, 'rapport-pertes-de-charge.pdf');
    };

    // --- Rapport NPSH ---
    window.exportNPSHReport = function (d) {
        if (!d) return;
        const marge = n(d.npshd) - n(d.npshr);
        const html = `
        <div style="${S.container}">
            <div style="${S.header}">
                <h1 style="${S.title}">Analyse NPSH</h1>
                <div style="font-size:12px; color:#64748b;">${today()}</div>
            </div>

            <div style="background:${marge > 0.5 ? '#10b981' : '#ef4444'}; color:white; padding:40px; border-radius:16px; text-align:center; margin-bottom:30px;">
                <div style="font-size:14px; opacity:0.9;">MARGE DE SÉCURITÉ</div>
                <div style="font-size:48px; font-weight:900;">${marge.toFixed(2)} m</div>
            </div>

            <div style="${S.card}">
                <div style="${S.row}">
                    <div style="${S.item}"><div style="${S.label}">NPSH Disponible</div><div style="${S.value}">${n(d.npshd).toFixed(2)} m</div></div>
                    <div style="${S.item}"><div style="${S.label}">NPSH Requis</div><div style="${S.value}">${n(d.npshr).toFixed(2)} m</div></div>
                </div>
            </div>
        </div>`;
        generer(html, 'analyse-npsh.pdf');
    };

})();
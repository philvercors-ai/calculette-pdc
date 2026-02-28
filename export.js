// ─── export.js — Génération de rapports PDF (Corrigé) ────────────────────────
(function () {
    'use strict';

    function today() {
        return new Date().toLocaleDateString('fr-FR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }

    // Styles inline pour garantir le rendu sans dépendre de Tailwind au moment de l'export
    const S = {
        container: "padding:30px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color:#1e293b; background:white;",
        header: "border-bottom:3px solid #0ea5e9; padding-bottom:15px; margin-bottom:25px; display:flex; justify-content:space-between; align-items:center;",
        title: "margin:0; color:#0ea5e9; font-size:24px; font-weight:bold;",
        card: "background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; margin-bottom:20px;",
        grid: "display:grid; grid-template-columns: 1fr 1fr; gap:15px;",
        label: "font-size:12px; color:#64748b; margin-bottom:4px; text-transform:uppercase; letter-spacing:0.5px;",
        value: "font-size:16px; font-weight:600; color:#0f172a;",
        highlight: "background:#0ea5e9; color:white; padding:20px; border-radius:12px; text-align:center; margin-bottom:20px;",
        info: "font-size:11px; color:#94a3b8; margin-top:30px; border-top:1px solid #e2e8f0; padding-top:10px; text-align:center;"
    };

    function generer(el, filename) {
        // 1. Overlay de chargement
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.85);z-index:99999;display:flex;align-items:center;justify-content:center;color:white;font-family:sans-serif;flex-direction:column;';
        overlay.innerHTML = '<div style="margin-bottom:15px;width:40px;height:40px;border:4px solid #f3f3f3;border-top:4px solid #3498db;border-radius:50%;animation:spin 1s linear infinite;"></div><div>Génération du PDF...</div><style>@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}</style>';
        document.body.appendChild(overlay);

        // 2. Préparation de l'élément (Hors écran pour éviter les conflits de scroll)
        el.style.position = 'absolute';
        el.style.left = '-9999px';
        el.style.top = '0';
        el.style.width = '750px'; // Proche du format A4 standard
        el.style.background = 'white';
        document.body.appendChild(el);

        const opt = {
            margin: 10,
            filename: filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
                scale: 2, 
                useCORS: true, 
                letterRendering: true,
                scrollY: 0,
                windowWidth: 800
            },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // 3. Petit délai pour laisser le moteur de rendu traiter l'élément injecté
        setTimeout(() => {
            html2pdf().set(opt).from(el).save()
                .then(() => {
                    document.body.removeChild(el);
                    document.body.removeChild(overlay);
                })
                .catch(err => {
                    console.error("Erreur PDF:", err);
                    document.body.removeChild(overlay);
                    alert("Erreur lors de la génération du PDF.");
                });
        }, 600); 
    }

    // --- Template PDC ---
    function buildPDCHTML(d) {
        return `
        <div style="${S.container}">
            <div style="${S.header}">
                <div>
                    <h1 style="${S.title}">Rapport de Calcul</h1>
                    <div style="font-size:12px; color:#64748b;">Généré le ${today()}</div>
                </div>
                <div style="text-align:right; font-weight:bold; color:#0ea5e9;">App Pertes de Charge</div>
            </div>

            <div style="${S.highlight}">
                <div style="font-size:14px; opacity:0.9;">PERTE DE CHARGE TOTALE</div>
                <div style="font-size:42px; font-weight:bold;">${d.pdcTotale.toFixed(3)} <span style="font-size:18px;">bar</span></div>
            </div>

            <div style="${S.card}">
                <h3 style="margin:0 0 15px 0; color:#0ea5e9; font-size:14px; text-transform:uppercase;">Données de l'installation</h3>
                <div style="${S.grid}">
                    <div><div style="${S.label}">Fluide</div><div style="${S.value}">${d.fluide}</div></div>
                    <div><div style="${S.label}">Débit</div><div style="${S.value}">${d.debit} m³/h</div></div>
                    <div><div style="${S.label}">Diamètre Int.</div><div style="${S.value}">${d.diametre} mm</div></div>
                    <div><div style="${S.label}">Longueur</div><div style="${S.value}">${d.longueur} m</div></div>
                </div>
            </div>

            <div style="${S.card}">
                <h3 style="margin:0 0 15px 0; color:#0ea5e9; font-size:14px; text-transform:uppercase;">Résultats Hydrauliques</h3>
                <div style="${S.grid}">
                    <div><div style="${S.label}">Vitesse</div><div style="${S.value}">${d.vitesse.toFixed(2)} m/s</div></div>
                    <div><div style="${S.label}">Régime</div><div style="${S.value}">${d.regime}</div></div>
                    <div><div style="${S.label}">PDC Linéaire</div><div style="${S.value}">${d.pdcLineaire.toFixed(3)} bar</div></div>
                    <div><div style="${S.label}">PDC Singulière</div><div style="${S.value}">${d.pdcSinguliere.toFixed(3)} bar</div></div>
                </div>
            </div>

            <div style="${S.info}">Calcul basé sur les formules de Darcy-Weisbach et Colebrook-White.</div>
        </div>`;
    }

    // --- Template NPSH ---
    function buildNPSHTML(d) {
        const securite = (d.npshd - d.npshr).toFixed(2);
        const estOk = (d.npshd - d.npshr) > 0.5;

        return `
        <div style="${S.container}">
            <div style="${S.header}">
                <h1 style="${S.title}">Analyse NPSH</h1>
                <div style="font-size:12px; color:#64748b;">${today()}</div>
            </div>

            <div style="background:${estOk ? '#10b981' : '#ef4444'}; color:white; padding:20px; border-radius:12px; text-align:center; margin-bottom:20px;">
                <div style="font-size:14px; opacity:0.9;">MARGE DE SÉCURITÉ</div>
                <div style="font-size:42px; font-weight:bold;">${securite} <span style="font-size:18px;">m</span></div>
                <div style="font-weight:bold; margin-top:5px;">${estOk ? 'CONFORME' : 'RISQUE DE CAVITATION'}</div>
            </div>

            <div style="${S.card}">
                <div style="${S.grid}">
                    <div><div style="${S.label}">NPSH Disponible (NPSHd)</div><div style="${S.value}">${d.npshd.toFixed(2)} m</div></div>
                    <div><div style="${S.label}">NPSH Requis (NPSHr)</div><div style="${S.value}">${d.npshr.toFixed(2)} m</div></div>
                </div>
            </div>

            <div style="${S.info}">Une marge > 0.5m est recommandée pour éviter la cavitation.</div>
        </div>`;
    }

    // API Publique
    window.exportPDCReport = function (data) {
        const el = document.createElement('div');
        el.innerHTML = buildPDCHTML(data);
        generer(el, 'rapport-pdc.pdf');
    };

    window.exportNPSHReport = function (data) {
        const el = document.createElement('div');
        el.innerHTML = buildNPSHTML(data);
        generer(el, 'rapport-npsh.pdf');
    };

})();
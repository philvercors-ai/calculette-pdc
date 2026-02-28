// ─── export.js — Génération de rapports PDF (Version Corrigée & Robuste) ─────
(function () {
    'use strict';

    // Aide pour la date
    function today() {
        return new Date().toLocaleDateString('fr-FR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }

    // Styles inline pour éviter les problèmes avec Tailwind au moment de l'export
    const S = {
        container: "padding:30px; font-family: 'Helvetica', 'Arial', sans-serif; color:#1e293b; background:white;",
        header: "border-bottom:3px solid #0ea5e9; padding-bottom:15px; margin-bottom:25px; display:flex; justify-content:space-between; align-items:center;",
        title: "margin:0; color:#0ea5e9; font-size:24px; font-weight:bold;",
        card: "background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; margin-bottom:20px;",
        grid: "display:grid; grid-template-columns: 1fr 1fr; gap:15px;",
        label: "font-size:12px; color:#64748b; margin-bottom:4px; text-transform:uppercase; letter-spacing:0.5px;",
        value: "font-size:16px; font-weight:600; color:#0f172a;",
        highlight: "background:#0ea5e9; color:white; padding:20px; border-radius:12px; text-align:center; margin-bottom:20px;",
        info: "font-size:11px; color:#94a3b8; margin-top:30px; border-top:1px solid #e2e8f0; padding-top:10px; text-align:center;"
    };

    // Fonction de génération avec gestion du délai de rendu
    function generer(el, filename) {
        // Overlay de chargement
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.9);z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;color:white;font-family:sans-serif;';
        overlay.innerHTML = '<div style="margin-bottom:15px;width:40px;height:40px;border:4px solid #f3f3f3;border-top:4px solid #3498db;border-radius:50%;animation:spin 1s linear infinite;"></div><div>Génération du PDF...</div><style>@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}</style>';
        document.body.appendChild(overlay);

        // Positionnement de l'élément à capturer (hors écran)
        el.style.position = 'absolute';
        el.style.left = '-10000px';
        el.style.top = '0';
        el.style.width = '750px'; 
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

        // Délai pour laisser le temps au moteur de rendu de calculer les styles
        setTimeout(() => {
            html2pdf().set(opt).from(el).save()
                .then(() => {
                    document.body.removeChild(el);
                    document.body.removeChild(overlay);
                })
                .catch(err => {
                    console.error("Erreur génération PDF:", err);
                    document.body.removeChild(overlay);
                });
        }, 700); 
    }

    // Sécurité pour éviter l'erreur .toFixed() sur des valeurs indéfinies
    const n = (val) => (typeof val === 'number' ? val : 0);

    // --- Template PDC ---
    function buildPDCHTML(d) {
        return `
        <div style="${S.container}">
            <div style="${S.header}">
                <div>
                    <h1 style="${S.title}">Rapport Pertes de Charge</h1>
                    <div style="font-size:12px; color:#64748b;">Généré le ${today()}</div>
                </div>
            </div>

            <div style="${S.highlight}">
                <div style="font-size:14px; opacity:0.9;">PERTE DE CHARGE TOTALE</div>
                <div style="font-size:42px; font-weight:bold;">${n(d.pdcTotale).toFixed(3)} <span style="font-size:18px;">bar</span></div>
            </div>

            <div style="${S.card}">
                <div style="${S.grid}">
                    <div><div style="${S.label}">Débit</div><div style="${S.value}">${n(d.debit)} m³/h</div></div>
                    <div><div style="${S.label}">Diamètre Int.</div><div style="${S.value}">${n(d.diametre)} mm</div></div>
                    <div><div style="${S.label}">Vitesse</div><div style="${S.value}">${n(d.vitesse).toFixed(2)} m/s</div></div>
                    <div><div style="${S.label}">Longueur</div><div style="${S.value}">${n(d.longueur)} m</div></div>
                </div>
            </div>

            <div style="${S.card}">
                <div style="${S.grid}">
                    <div><div style="${S.label}">PDC Linéaire</div><div style="${S.value}">${n(d.pdcLineaire).toFixed(3)} bar</div></div>
                    <div><div style="${S.label}">PDC Singulière</div><div style="${S.value}">${n(d.pdcSinguliere).toFixed(3)} bar</div></div>
                </div>
            </div>

            <div style="${S.info}">Document généré via Pertes de Charge App</div>
        </div>`;
    }

    // --- Template NPSH ---
    function buildNPSHTML(d) {
        const marge = n(d.npshd) - n(d.npshr);
        const color = marge > 0.5 ? '#10b981' : '#ef4444';

        return `
        <div style="${S.container}">
            <div style="${S.header}">
                <h1 style="${S.title}">Analyse NPSH</h1>
                <div style="font-size:12px; color:#64748b;">${today()}</div>
            </div>

            <div style="background:${color}; color:white; padding:20px; border-radius:12px; text-align:center; margin-bottom:20px;">
                <div style="font-size:14px; opacity:0.9;">MARGE DE SÉCURITÉ</div>
                <div style="font-size:42px; font-weight:bold;">${marge.toFixed(2)} <span style="font-size:18px;">m</span></div>
                <div style="font-weight:bold; margin-top:5px;">${marge > 0.5 ? 'OK - PAS DE CAVITATION' : 'ATTENTION - RISQUE'}</div>
            </div>

            <div style="${S.card}">
                <div style="${S.grid}">
                    <div><div style="${S.label}">NPSH Disponible</div><div style="${S.value}">${n(d.npshd).toFixed(2)} m</div></div>
                    <div><div style="${S.label}">NPSH Requis</div><div style="${S.value}">${n(d.npshr).toFixed(2)} m</div></div>
                </div>
            </div>

            <div style="${S.info}">Une marge > 0.5m est recommandée.</div>
        </div>`;
    }

    // ── API PUBLIQUE ──
    window.exportPDCReport = function (data) {
        try {
            const el = document.createElement('div');
            el.innerHTML = buildPDCHTML(data);
            generer(el, 'rapport-pdc.pdf');
        } catch (e) {
            console.error("Erreur export PDC:", e);
            alert("Erreur lors de la préparation du rapport.");
        }
    };

    window.exportNPSHReport = function (data) {
        try {
            const el = document.createElement('div');
            el.innerHTML = buildNPSHTML(data);
            generer(el, 'rapport-npsh.pdf');
        } catch (e) {
            console.error("Erreur export NPSH:", e);
            alert("Erreur lors de la préparation du rapport.");
        }
    };

})();
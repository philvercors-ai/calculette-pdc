// ─── export.js — Génération de rapports PDF ────────────────────────────────
(function () {
    'use strict';

    function today() {
        return new Date().toLocaleDateString('fr-FR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }

    function regimeColor(regime) {
        if (regime === 'Laminaire')   return '#16a34a';
        if (regime === 'Transitoire') return '#ea580c';
        return '#0284c7';
    }

    function nomMateriau(valeur, materiaux) {
        return Object.entries(materiaux).find(([, v]) => v === valeur)?.[0] ?? valeur;
    }

    // ── CSS injecté dans l'iframe (évite les conflits avec Tailwind/React) ────
    const BASE_STYLES = `
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: ui-sans-serif, system-ui, Arial, sans-serif; background: white; font-size: 13px; color: #0f172a; padding: 24px; }
        .header  { background: #0ea5e9; color: white; padding: 20px 24px; border-radius: 12px; margin-bottom: 16px; }
        .h-title { font-size: 20px; font-weight: 900; letter-spacing: -0.02em; margin-bottom: 4px; }
        .h-sub   { font-size: 12px; opacity: 0.85; margin-bottom: 6px; }
        .h-info  { font-size: 13px; font-weight: 600; }
        .card    { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 12px; }
        .c-label { font-weight: 800; color: #0ea5e9; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 10px; }
        .dark    { background: #1e293b; color: white; border-radius: 12px; padding: 20px 24px; margin-bottom: 12px; }
        .d-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.55; margin-bottom: 2px; }
        .d-value { font-size: 32px; font-weight: 900; color: #7dd3fc; margin: 6px 0; }
        .grid2   { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px; }
        .grid3   { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-top: 12px; }
        .cell    { background: rgba(255,255,255,0.08); border-radius: 8px; padding: 10px 12px; }
        .cl      { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.5; margin-bottom: 2px; }
        .cv      { font-weight: 700; font-size: 15px; }
        .cellW   { background: #f8fafc; border-radius: 8px; padding: 10px 12px; }
        .sl      { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.65; margin-bottom: 2px; }
        .sv      { font-weight: 700; font-size: 15px; }
        .sv-unit { font-weight: 400; font-size: 12px; color: #64748b; }
        .divider { border: none; border-top: 1px solid rgba(255,255,255,0.15); margin: 12px 0; }
        .divL    { border: none; border-top: 1px solid #e2e8f0; margin: 10px 0; }
        .t-head  { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .t-num   { font-weight: 800; color: #0ea5e9; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
        .t-mat   { color: #64748b; font-size: 12px; }
        .t-dims  { color: #475569; font-size: 12px; }
        .t-note  { font-size: 11px; color: #94a3b8; text-align: right; margin-top: 6px; }
        .badge   { display: inline-block; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 100px; }
        .info    { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 12px 16px; margin-top: 12px; font-size: 11px; color: #1e40af; line-height: 1.6; }
        .info strong { text-transform: uppercase; font-size: 10px; }
        .marge-row { display: flex; justify-content: space-between; align-items: center; }
        .npsh-meta { font-size: 11px; opacity: 0.4; margin-top: 12px; line-height: 1.6; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { padding: 6px 8px; text-align: left; font-size: 10px; text-transform: uppercase; color: #64748b; background: #f1f5f9; }
        td { padding: 5px 8px; border-bottom: 1px solid #e2e8f0; }
    `;

    // ── Rendu via iframe isolé (évite toute interférence avec le DOM principal) ──
    function generer(contentHTML, filename) {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.85);z-index:100000;display:flex;align-items:center;justify-content:center;font-family:ui-sans-serif,sans-serif;';
        overlay.innerHTML = '<div style="background:white;padding:24px 32px;border-radius:16px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.4);"><div style="font-size:14px;font-weight:700;color:#0ea5e9;margin-bottom:4px;">Génération du rapport PDF...</div><div style="font-size:12px;color:#64748b;">Veuillez patienter</div></div>';
        document.body.appendChild(overlay);

        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'position:fixed;top:0;left:0;width:820px;height:0;opacity:0;pointer-events:none;border:none;';
        document.body.appendChild(iframe);

        const doc = iframe.contentDocument || iframe.contentWindow.document;
        doc.open();
        doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><style>${BASE_STYLES}</style></head><body>${contentHTML}</body></html>`);
        doc.close();

        setTimeout(() => {
            html2pdf()
                .set({
                    margin:      [8, 8, 8, 8],
                    filename:    filename,
                    image:       { type: 'jpeg', quality: 0.97 },
                    html2canvas: { scale: 2, useCORS: true, logging: false, scrollX: 0, scrollY: 0 },
                    jsPDF:       { unit: 'mm', format: 'a4', orientation: 'portrait' }
                })
                .from(doc.body)
                .save()
                .then(() => {
                    document.body.removeChild(iframe);
                    document.body.removeChild(overlay);
                })
                .catch(err => {
                    console.error('PDF error:', err);
                    document.body.removeChild(iframe);
                    document.body.removeChild(overlay);
                });
        }, 600);
    }

    // ── Template PDC ──────────────────────────────────────────────────────────
    function buildPDCHTML({ debit, troncons, resultats, materiaux }) {
        const lignesTroncons = troncons.map((t, i) => {
            const r = resultats.parTroncon.find(x => x.id === t.id);
            const mat = nomMateriau(t.materiau, materiaux);

            let alerteHTML = '';
            if (r.vitesse < 0.5)
                alerteHTML = `<span class="badge" style="background:#ea580c22;color:#ea580c;border:1px solid #ea580c55;">⚠ Vitesse faible</span> `;
            else if (r.vitesse > 3)
                alerteHTML = `<span class="badge" style="background:#dc262622;color:#dc2626;border:1px solid #dc262655;">⚠ Vitesse élevée</span> `;

            return `
            <div class="card">
                <div class="t-head">
                    <span class="t-num">Tronçon ${i + 1}</span>
                    <span class="t-mat">${mat} — k = ${t.materiau} mm</span>
                </div>
                <div class="t-dims">Ø <strong>${t.diametre} mm</strong> &nbsp;|&nbsp; L <strong>${t.longueur} m</strong></div>
                <hr class="divL">
                <div class="grid2">
                    <div class="cellW"><div class="sl">Perte de charge</div><div class="sv">${r.perte.toFixed(3)} <span class="sv-unit">mCE</span></div></div>
                    <div class="cellW"><div class="sl">Vitesse</div><div class="sv">${r.vitesse.toFixed(2)} <span class="sv-unit">m/s</span></div></div>
                    <div class="cellW"><div class="sl">Reynolds</div><div class="sv">${r.Re.toLocaleString('fr-FR')}</div></div>
                    <div class="cellW"><div class="sl">Régime</div><div style="font-weight:800;font-size:14px;color:${regimeColor(r.regime)};">${r.regime}</div></div>
                </div>
                <div class="t-note">${alerteHTML}<span>Linéaire : ${r.unitaire.toFixed(2)} mm/m</span></div>
            </div>`;
        }).join('');

        const moy = (resultats.parTroncon.reduce((s, r) => s + r.unitaire, 0) / resultats.parTroncon.length).toFixed(1);

        return `
        <div class="header">
            <div class="h-title">CALCULATEUR PDC</div>
            <div class="h-sub">Rapport généré le ${today()}</div>
            <div class="h-info">Débit global : ${parseFloat(debit).toFixed(1)} m³/h &nbsp;|&nbsp; ${troncons.length} tronçon${troncons.length > 1 ? 's' : ''} en série</div>
        </div>

        ${lignesTroncons}

        <div class="dark">
            <div class="d-label">Perte de charge totale réseau</div>
            <div class="d-value">${resultats.perteTotal.toFixed(3)} <span style="font-size:18px;font-weight:500;">mCE</span></div>
            <div class="grid3">
                <div class="cell"><div class="cl">Débit</div><div class="cv">${parseFloat(debit).toFixed(1)} m³/h</div></div>
                <div class="cell"><div class="cl">Tronçons</div><div class="cv">${troncons.length}</div></div>
                <div class="cell"><div class="cl">Linéaire moy.</div><div class="cv">${moy} mm/m</div></div>
            </div>
        </div>

        <div class="info">
            <strong>Paramètres de calcul</strong><br>
            Loi : Darcy-Weisbach (Friction : Swamee-Jain) &nbsp;|&nbsp;
            Fluide : Eau à 20 °C (ν = 1.004 × 10⁻⁶ m²/s) &nbsp;|&nbsp;
            Laminaire si Re &lt; 2 300 → f = 64/Re &nbsp;|&nbsp;
            Réseau série — même débit dans tous les tronçons
        </div>`;
    }

    // ── Template NPSH ─────────────────────────────────────────────────────────
    function buildNPSHHTML({ aspirQ, aspirD, aspirL, aspirMat, raccords, raccordsList, hz, temp, altitude, npshr, npshResult, materiaux }) {
        const mat = nomMateriau(aspirMat, materiaux);

        const lignesRaccords = raccords.map(r => {
            const rc = raccordsList[r.nomIdx];
            return `<tr>
                <td>${rc.nom}</td>
                <td style="text-align:center;">ξ = ${rc.xi}</td>
                <td style="text-align:center;font-weight:700;">× ${r.quantite}</td>
            </tr>`;
        }).join('');

        let margeHTML = '';
        if (npshResult.margeNPSH !== null) {
            const m = npshResult.margeNPSH;
            const [color, label] = m > 0.5  ? ['#4ade80', '✓ Sécurisé']
                                 : m > 0    ? ['#fb923c', '⚠ Limite — vérifier']
                                 :            ['#f87171', '⚠ RISQUE CAVITATION'];
            margeHTML = `
                <hr class="divider">
                <div class="marge-row">
                    <div>
                        <div class="d-label">Marge NPSHd − NPSHr</div>
                        <span class="badge" style="background:${color}22;color:${color};border:1px solid ${color}55;">${label}</span>
                    </div>
                    <div style="font-size:24px;font-weight:900;color:${color};">${m >= 0 ? '+' : ''}${m.toFixed(3)} m</div>
                </div>`;
        }

        return `
        <div class="header">
            <div class="h-title">CALCULATEUR PDC — NPSH</div>
            <div class="h-sub">Rapport généré le ${today()}</div>
        </div>

        <div class="card">
            <div class="c-label">Conduite d'aspiration</div>
            <div class="grid3">
                <div class="cellW"><div class="sl">Débit</div><div class="sv">${parseFloat(aspirQ).toFixed(1)} <span class="sv-unit">m³/h</span></div></div>
                <div class="cellW"><div class="sl">Ø Intérieur</div><div class="sv">${aspirD} <span class="sv-unit">mm</span></div></div>
                <div class="cellW"><div class="sl">Longueur</div><div class="sv">${aspirL} <span class="sv-unit">m</span></div></div>
            </div>
            <div style="font-size:12px;color:#64748b;margin-top:8px;">Matériau : <strong style="color:#334155;">${mat}</strong> — k = ${aspirMat} mm</div>
        </div>

        <div class="card">
            <div class="c-label">Singularités aspiration</div>
            <table>
                <thead><tr><th>Raccord</th><th style="text-align:center;">Coeff. ξ</th><th style="text-align:center;">Qté</th></tr></thead>
                <tbody>${lignesRaccords || '<tr><td colspan="3" style="color:#94a3b8;text-align:center;padding:8px;">Aucune singularité</td></tr>'}</tbody>
            </table>
            <div style="font-size:11px;color:#94a3b8;margin-top:6px;text-align:right;">
                Hf singulières : ${npshResult.HfSing.toFixed(3)} m &nbsp;|&nbsp; V aspiration : ${npshResult.V.toFixed(2)} m/s
            </div>
        </div>

        <div class="card">
            <div class="c-label">Conditions d'installation</div>
            <div class="grid2">
                <div class="cellW">
                    <div class="sl">Hz aspiration</div>
                    <div class="sv">${hz} <span class="sv-unit">m</span></div>
                    <div style="font-size:10px;color:#94a3b8;">${parseFloat(hz) >= 0 ? 'Pompe en charge' : 'Pompe au-dessus du niveau'}</div>
                </div>
                <div class="cellW"><div class="sl">Température</div><div class="sv">${temp} <span class="sv-unit">°C</span></div></div>
                <div class="cellW"><div class="sl">Altitude</div><div class="sv">${altitude} <span class="sv-unit">m</span></div></div>
                <div class="cellW"><div class="sl">NPSHr constructeur</div><div class="sv">${npshr !== '' ? npshr + ' m' : '—'}</div></div>
            </div>
        </div>

        <div class="dark">
            <div class="d-label">NPSHd disponible</div>
            <div style="font-size:36px;font-weight:900;color:#7dd3fc;margin:6px 0;">${npshResult.NPSHd.toFixed(3)} <span style="font-size:18px;font-weight:500;">m</span></div>
            ${margeHTML}
            <hr class="divider">
            <div class="grid3">
                <div class="cell"><div class="cl">Hf linéaire</div><div class="cv">${npshResult.HfLin.toFixed(3)} m</div></div>
                <div class="cell"><div class="cl">Hf singulières</div><div class="cv">${npshResult.HfSing.toFixed(3)} m</div></div>
                <div class="cell"><div class="cl">Hf total</div><div class="cv">${npshResult.Hf.toFixed(3)} m</div></div>
            </div>
            <div class="npsh-meta">
                Pa (${Math.round(npshResult.alt)} m alt.) : ${Math.round(npshResult.Pa)} Pa &nbsp;|&nbsp;
                Pv (${npshResult.T} °C) : ${Math.round(npshResult.Pv)} Pa &nbsp;|&nbsp;
                ρ : ${npshResult.rho.toFixed(1)} kg/m³
            </div>
        </div>

        <div class="info">
            <strong>Paramètres de calcul</strong><br>
            NPSHd = (Pa − Pv) / (ρ·g) + Hz − Hf &nbsp;|&nbsp;
            Pv : formule de Magnus &nbsp;|&nbsp;
            Pa : formule barométrique &nbsp;|&nbsp;
            Hf linéaire : Darcy-Weisbach &nbsp;|&nbsp;
            Hf singulières : méthode ξ·V²/2g &nbsp;|&nbsp;
            Marge de sécurité recommandée : ≥ 0.5 m
        </div>`;
    }

    // ── API publique ──────────────────────────────────────────────────────────
    window.exportPDCReport = function (data) {
        generer(buildPDCHTML(data), 'rapport-pdc.pdf');
    };

    window.exportNPSHReport = function (data) {
        generer(buildNPSHHTML(data), 'rapport-npsh.pdf');
    };

})();

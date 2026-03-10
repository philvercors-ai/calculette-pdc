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

    // ── CSS injecté dans l'iframe ──────────────────────────────────────────────
    const BASE_STYLES = `
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: ui-sans-serif, system-ui, Arial, sans-serif; background: white; font-size: 13px; color: #0f172a; padding: 28px; }

        /* En-tête */
        .header  { background: linear-gradient(135deg, #0ea5e9, #0284c7); color: white; padding: 24px 28px; border-radius: 14px; margin-bottom: 20px; }
        .h-title { font-size: 22px; font-weight: 900; letter-spacing: -0.02em; margin-bottom: 4px; }
        .h-sub   { font-size: 12px; opacity: 0.80; margin-bottom: 8px; }
        .h-info  { font-size: 14px; font-weight: 700; background: rgba(255,255,255,0.15); display: inline-block; padding: 4px 12px; border-radius: 20px; }

        /* Cartes */
        .card    { background: white; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; margin-bottom: 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.05); }
        .c-label { font-weight: 900; color: #0ea5e9; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 14px; border-bottom: 2px solid #e0f2fe; padding-bottom: 8px; }

        /* Carte sombre (résultat total) */
        .dark    { background: #1e293b; color: white; border-radius: 14px; padding: 24px 28px; margin-bottom: 16px; }
        .d-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.50; margin-bottom: 4px; }
        .d-value { font-size: 44px; font-weight: 900; color: #7dd3fc; margin: 8px 0 4px; line-height: 1; }
        .d-unit  { font-size: 20px; font-weight: 500; opacity: 0.75; }

        /* Grilles */
        .grid2   { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 12px; }
        .grid3   { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-top: 16px; }
        .cell    { background: rgba(255,255,255,0.07); border-radius: 10px; padding: 12px 14px; }
        .cl      { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.45; margin-bottom: 4px; }
        .cv      { font-weight: 900; font-size: 16px; }
        .cellW   { background: #f0f9ff; border-radius: 10px; padding: 12px 14px; border: 1px solid #e0f2fe; }
        .sl      { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 4px; }
        .sv      { font-weight: 900; font-size: 18px; color: #0f172a; }
        .sv-unit { font-weight: 400; font-size: 13px; color: #64748b; }

        /* Séparateurs */
        .divider { border: none; border-top: 1px solid rgba(255,255,255,0.12); margin: 16px 0; }
        .divL    { border: none; border-top: 1px solid #e2e8f0; margin: 14px 0; }

        /* En-tête tronçon */
        .t-head  { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .t-num   { font-weight: 900; color: #0ea5e9; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; background: #e0f2fe; padding: 3px 10px; border-radius: 20px; }
        .t-mat   { color: #64748b; font-size: 12px; }
        .t-dims  { color: #334155; font-size: 13px; font-weight: 600; margin-bottom: 2px; }
        .t-note  { font-size: 11px; color: #94a3b8; text-align: right; margin-top: 10px; font-style: italic; }

        /* Badge alerte */
        .badge   { display: inline-block; font-size: 11px; font-weight: 800; padding: 3px 10px; border-radius: 100px; }

        /* Résultat perte tronçon — mise en évidence */
        .perte-value { font-size: 22px; font-weight: 900; color: #0284c7; }
        .perte-unit  { font-size: 13px; font-weight: 400; color: #64748b; }
        .vit-value   { font-size: 22px; font-weight: 900; color: #0f172a; }

        /* Graphique */
        .chart-card  { background: white; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px 20px; margin-bottom: 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.05); }
        .chart-title { font-weight: 900; color: #0ea5e9; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 12px; border-bottom: 2px solid #e0f2fe; padding-bottom: 8px; text-align: center; }
        .chart-img   { width: 100%; border-radius: 8px; display: block; }

        /* Note méthode */
        .info    { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 14px 18px; margin-top: 16px; font-size: 11px; color: #0369a1; line-height: 1.7; }
        .info strong { text-transform: uppercase; font-size: 10px; letter-spacing: 0.06em; }

        /* Marge NPSH */
        .marge-row   { display: flex; justify-content: space-between; align-items: center; }
        .marge-value { font-size: 28px; font-weight: 900; }
        .npsh-meta   { font-size: 11px; opacity: 0.45; margin-top: 14px; line-height: 1.8; }

        /* Tableau raccords */
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { padding: 8px 10px; text-align: left; font-size: 10px; text-transform: uppercase; color: #64748b; background: #f1f5f9; letter-spacing: 0.04em; }
        td { padding: 7px 10px; border-bottom: 1px solid #e2e8f0; }
        tr:last-child td { border-bottom: none; }
    `;

    // ── Rendu via iframe isolé ─────────────────────────────────────────────────
    function generer(contentHTML, filename) {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.85);z-index:100000;display:flex;align-items:center;justify-content:center;font-family:ui-sans-serif,sans-serif;';
        overlay.innerHTML = '<div style="background:white;padding:24px 32px;border-radius:16px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.4);"><div style="font-size:14px;font-weight:700;color:#0ea5e9;margin-bottom:4px;">Génération du rapport PDF...</div><div style="font-size:12px;color:#64748b;">Veuillez patienter</div></div>';
        document.body.appendChild(overlay);

        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'position:absolute;left:-9999px;top:0;width:820px;height:5000px;opacity:0;pointer-events:none;border:none;';
        document.body.appendChild(iframe);

        const doc = iframe.contentDocument || iframe.contentWindow.document;
        doc.open();
        doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><style>${BASE_STYLES}</style></head><body>${contentHTML}</body></html>`);
        doc.close();
        const realH = iframe.contentDocument.body.scrollHeight;
        if (realH > 0) iframe.style.height = (realH + 50) + 'px';

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
    function buildPDCHTML({ debit, troncons, resultats, materiaux, chartImage }) {
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
                <div class="t-dims">Ø <strong>${t.diametre} mm</strong> &nbsp;|&nbsp; Longueur <strong>${t.longueur} m</strong></div>
                <hr class="divL">
                <div class="grid2">
                    <div class="cellW">
                        <div class="sl">Perte de charge</div>
                        <div class="perte-value">${r.perte.toFixed(3)} <span class="perte-unit">mCE</span></div>
                    </div>
                    <div class="cellW">
                        <div class="sl">Vitesse d'écoulement</div>
                        <div class="vit-value">${r.vitesse.toFixed(2)} <span class="perte-unit">m/s</span></div>
                    </div>
                    <div class="cellW">
                        <div class="sl">Nombre de Reynolds</div>
                        <div style="font-weight:800;font-size:16px;">${r.Re.toLocaleString('fr-FR')}</div>
                    </div>
                    <div class="cellW">
                        <div class="sl">Régime hydraulique</div>
                        <div style="font-weight:900;font-size:16px;color:${regimeColor(r.regime)};">${r.regime}</div>
                    </div>
                </div>
                <div class="t-note">${alerteHTML}<span>Perte linéaire : <strong>${r.unitaire.toFixed(2)} mm/m</strong></span></div>
            </div>`;
        }).join('');

        const moy = (resultats.parTroncon.reduce((s, r) => s + r.unitaire, 0) / resultats.parTroncon.length).toFixed(1);

        const chartSection = chartImage ? `
        <div class="chart-card">
            <div class="chart-title">Courbe de perte de charge — réseau complet</div>
            <img class="chart-img" src="${chartImage}" alt="Courbe PDC" />
        </div>` : '';

        return `
        <div class="header">
            <div class="h-title">CALCULATEUR — PERTES DE CHARGE</div>
            <div class="h-sub">Rapport généré le ${today()}</div>
            <div class="h-info">Débit : ${parseFloat(debit).toFixed(1)} m³/h &nbsp;|&nbsp; ${troncons.length} tronçon${troncons.length > 1 ? 's' : ''} en série</div>
        </div>

        ${lignesTroncons}

        <div class="dark">
            <div class="d-label">Perte de charge totale — réseau</div>
            <div class="d-value">${resultats.perteTotal.toFixed(3)} <span class="d-unit">mCE</span></div>
            <hr class="divider">
            <div class="grid3">
                <div class="cell"><div class="cl">Débit global</div><div class="cv">${parseFloat(debit).toFixed(1)} m³/h</div></div>
                <div class="cell"><div class="cl">Tronçons</div><div class="cv">${troncons.length}</div></div>
                <div class="cell"><div class="cl">Linéaire moyen</div><div class="cv">${moy} mm/m</div></div>
            </div>
        </div>

        ${chartSection}

        <div class="info">
            <strong>Paramètres de calcul</strong><br>
            Loi : <strong>Darcy-Weisbach</strong> — Friction : <strong>Swamee-Jain</strong> &nbsp;|&nbsp;
            Fluide : Eau à 20 °C (ν = 1,004 × 10⁻⁶ m²/s) &nbsp;|&nbsp;
            Laminaire si Re &lt; 2 300 → f = 64/Re &nbsp;|&nbsp;
            Réseau série — même débit dans tous les tronçons
        </div>`;
    }

    // ── Template NPSH ─────────────────────────────────────────────────────────
    function buildNPSHHTML({ aspirQ, aspirD, aspirL, aspirMat, raccords, raccordsList, hz, temp, altitude, npshr, npshResult, materiaux, chartImage }) {
        const mat = nomMateriau(aspirMat, materiaux);

        const lignesRaccords = raccords.map(r => {
            const rc = raccordsList[r.nomIdx];
            return `<tr>
                <td><strong>${rc.nom}</strong></td>
                <td style="text-align:center;font-weight:700;">ξ = ${rc.xi}</td>
                <td style="text-align:center;font-weight:900;color:#0284c7;">× ${r.quantite}</td>
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
                        <span class="badge" style="font-size:13px;background:${color}22;color:${color};border:1px solid ${color}55;margin-top:6px;display:inline-block;">${label}</span>
                    </div>
                    <div class="marge-value" style="color:${color};">${m >= 0 ? '+' : ''}${m.toFixed(3)} m</div>
                </div>`;
        }

        const chartSection = chartImage ? `
        <div class="chart-card">
            <div class="chart-title">Courbe NPSHd = f(Débit)</div>
            <img class="chart-img" src="${chartImage}" alt="Courbe NPSH" />
        </div>` : '';

        return `
        <div class="header">
            <div class="h-title">CALCULATEUR — NPSH</div>
            <div class="h-sub">Rapport généré le ${today()}</div>
            <div class="h-info">Débit : ${parseFloat(aspirQ).toFixed(1)} m³/h &nbsp;|&nbsp; Ø ${aspirD} mm &nbsp;|&nbsp; L = ${aspirL} m</div>
        </div>

        <div class="card">
            <div class="c-label">Conduite d'aspiration</div>
            <div class="grid3">
                <div class="cellW"><div class="sl">Débit</div><div class="sv">${parseFloat(aspirQ).toFixed(1)} <span class="sv-unit">m³/h</span></div></div>
                <div class="cellW"><div class="sl">Ø Intérieur</div><div class="sv">${aspirD} <span class="sv-unit">mm</span></div></div>
                <div class="cellW"><div class="sl">Longueur</div><div class="sv">${aspirL} <span class="sv-unit">m</span></div></div>
            </div>
            <div style="font-size:12px;color:#64748b;margin-top:12px;">
                Matériau : <strong style="color:#334155;font-size:13px;">${mat}</strong>
                <span style="margin-left:8px;opacity:0.6;">k = ${aspirMat} mm</span>
                &nbsp;|&nbsp; Vitesse : <strong>${npshResult.V.toFixed(2)} m/s</strong>
            </div>
        </div>

        <div class="card">
            <div class="c-label">Singularités aspiration</div>
            <table>
                <thead><tr><th>Raccord</th><th style="text-align:center;">Coeff. ξ</th><th style="text-align:center;">Quantité</th></tr></thead>
                <tbody>${lignesRaccords || '<tr><td colspan="3" style="color:#94a3b8;text-align:center;padding:10px;">Aucune singularité</td></tr>'}</tbody>
            </table>
            <div style="font-size:12px;color:#64748b;margin-top:10px;text-align:right;font-style:italic;">
                Hf singulières = <strong style="color:#0f172a;">${npshResult.HfSing.toFixed(3)} m</strong>
            </div>
        </div>

        <div class="card">
            <div class="c-label">Conditions d'installation</div>
            <div class="grid2">
                <div class="cellW">
                    <div class="sl">Hz aspiration</div>
                    <div class="sv">${hz} <span class="sv-unit">m</span></div>
                    <div style="font-size:11px;color:#64748b;margin-top:2px;">${parseFloat(hz) >= 0 ? '▲ Pompe en charge' : '▼ Pompe au-dessus du niveau'}</div>
                </div>
                <div class="cellW"><div class="sl">Température fluide</div><div class="sv">${temp} <span class="sv-unit">°C</span></div></div>
                <div class="cellW"><div class="sl">Altitude site</div><div class="sv">${altitude} <span class="sv-unit">m</span></div></div>
                <div class="cellW">
                    <div class="sl">NPSHr constructeur</div>
                    <div class="sv" style="${npshr !== '' ? 'color:#dc2626;' : ''}">${npshr !== '' ? npshr + ' <span class="sv-unit">m</span>' : '—'}</div>
                </div>
            </div>
        </div>

        <div class="dark">
            <div class="d-label">NPSHd disponible</div>
            <div class="d-value">${npshResult.NPSHd.toFixed(3)} <span class="d-unit">m</span></div>
            ${margeHTML}
            <hr class="divider">
            <div class="grid3">
                <div class="cell"><div class="cl">Hf linéaire</div><div class="cv">${npshResult.HfLin.toFixed(3)} m</div></div>
                <div class="cell"><div class="cl">Hf singulières</div><div class="cv">${npshResult.HfSing.toFixed(3)} m</div></div>
                <div class="cell"><div class="cl">Hf total</div><div class="cv" style="color:#7dd3fc;">${npshResult.Hf.toFixed(3)} m</div></div>
            </div>
            <div class="npsh-meta">
                Pa (alt. ${Math.round(npshResult.alt)} m) : <strong style="opacity:0.7;">${Math.round(npshResult.Pa)} Pa</strong> &nbsp;|&nbsp;
                Pv (${npshResult.T} °C) : <strong style="opacity:0.7;">${Math.round(npshResult.Pv)} Pa</strong> &nbsp;|&nbsp;
                ρ : <strong style="opacity:0.7;">${npshResult.rho.toFixed(1)} kg/m³</strong>
            </div>
        </div>

        ${chartSection}

        <div class="info">
            <strong>Paramètres de calcul</strong><br>
            <strong>NPSHd</strong> = (Pa − Pv) / (ρ·g) + Hz − Hf &nbsp;|&nbsp;
            <strong>Pv</strong> : formule de Magnus &nbsp;|&nbsp;
            <strong>Pa</strong> : formule barométrique &nbsp;|&nbsp;
            <strong>Hf linéaire</strong> : Darcy-Weisbach &nbsp;|&nbsp;
            <strong>Hf singulières</strong> : méthode ξ·V²/2g &nbsp;|&nbsp;
            Marge de sécurité recommandée : <strong>≥ 0,5 m</strong>
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

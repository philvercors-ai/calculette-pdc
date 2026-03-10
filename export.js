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
        body { font-family: ui-sans-serif, system-ui, Arial, sans-serif; background: #f8fafc; font-size: 13px; color: #0f172a; padding: 28px; }

        /* ── En-tête centré dans un cadre ── */
        .header {
            background: linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%);
            color: white;
            padding: 28px 32px 24px;
            border-radius: 16px;
            margin-bottom: 28px;
            text-align: center;
            border: 3px solid #0284c7;
            box-shadow: 0 4px 16px rgba(14,165,233,0.25);
        }
        .h-logo   { font-size: 11px; font-weight: 700; letter-spacing: 0.15em; opacity: 0.7; text-transform: uppercase; margin-bottom: 6px; }
        .h-title  { font-size: 26px; font-weight: 900; letter-spacing: -0.01em; margin-bottom: 6px; }
        .h-sub    { font-size: 11px; opacity: 0.70; margin-bottom: 14px; }
        .h-info   { display: inline-flex; gap: 16px; background: rgba(255,255,255,0.18); padding: 8px 20px; border-radius: 24px; font-size: 13px; font-weight: 700; }
        .h-sep    { opacity: 0.4; }

        /* ── Cartes blanches ── */
        .card {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 14px;
            padding: 20px 22px;
            margin-bottom: 22px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.04);
        }
        .c-label {
            font-weight: 900; color: #0ea5e9; font-size: 11px;
            text-transform: uppercase; letter-spacing: 0.1em;
            margin-bottom: 16px;
            display: flex; align-items: center; gap: 8px;
        }
        .c-label::after { content: ''; flex: 1; height: 2px; background: #e0f2fe; border-radius: 2px; }

        /* ── Bandeau inputs (débit / diamètre / longueur) ── */
        .inputs-bar {
            background: #f0f9ff;
            border: 1.5px solid #bae6fd;
            border-radius: 10px;
            padding: 14px 16px;
            display: flex;
            justify-content: space-around;
            align-items: center;
            margin-bottom: 16px;
        }
        .inp-item { text-align: center; }
        .inp-lbl  { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #0369a1; opacity: 0.75; margin-bottom: 3px; }
        .inp-val  { font-size: 22px; font-weight: 900; color: #0284c7; line-height: 1; }
        .inp-unit { font-size: 12px; font-weight: 500; color: #64748b; }
        .inp-sep  { width: 1px; height: 36px; background: #bae6fd; }

        /* ── Résultats tronçon ── */
        .res-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .res-cell { background: #f8fafc; border-radius: 10px; padding: 12px 14px; border: 1px solid #e2e8f0; }
        .res-lbl  { font-size: 10px; text-transform: uppercase; letter-spacing: 0.07em; color: #64748b; margin-bottom: 5px; }
        .res-val  { font-size: 20px; font-weight: 900; color: #0f172a; line-height: 1.1; }
        .res-unit { font-size: 12px; font-weight: 400; color: #94a3b8; }
        /* Vitesse — mise en avant principale */
        .vit-cell { background: #fffbeb; border: 1.5px solid #fde68a; }
        .vit-val  { font-size: 26px; font-weight: 900; color: #d97706; }

        /* ── Carte résultat total (sombre) ── */
        .dark {
            background: #0f172a;
            color: white;
            border-radius: 16px;
            padding: 28px 32px;
            margin-bottom: 28px;
            text-align: center;
        }
        .d-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.45; margin-bottom: 8px; }
        .d-value { font-size: 52px; font-weight: 900; color: #38bdf8; line-height: 1; margin-bottom: 4px; }
        .d-unit  { font-size: 22px; font-weight: 500; color: #7dd3fc; }
        .d-sub   { font-size: 12px; opacity: 0.45; margin-top: 4px; }

        /* Grille récap dark */
        .grid3   { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-top: 20px; }
        .cell    { background: rgba(255,255,255,0.06); border-radius: 10px; padding: 12px; text-align: center; }
        .cl      { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.4; margin-bottom: 5px; }
        .cv      { font-weight: 900; font-size: 17px; }

        /* Grille 2 cols (NPSH) */
        .grid2   { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 12px; }
        .cellW   { background: #f0f9ff; border-radius: 10px; padding: 12px 14px; border: 1px solid #e0f2fe; }
        .sl      { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 4px; }
        .sv      { font-weight: 900; font-size: 18px; color: #0f172a; }
        .sv-unit { font-weight: 400; font-size: 13px; color: #64748b; }

        /* Séparateurs */
        .divider { border: none; border-top: 1px solid rgba(255,255,255,0.10); margin: 18px 0; }
        .divL    { border: none; border-top: 1px solid #e2e8f0; margin: 14px 0; }

        /* En-tête tronçon */
        .t-head  { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
        .t-num   { font-weight: 900; color: #0284c7; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; }
        .t-mat   { color: #64748b; font-size: 12px; font-style: italic; }
        .t-note  { font-size: 11px; color: #94a3b8; text-align: right; margin-top: 10px; font-style: italic; }

        /* Badges */
        .badge   { display: inline-block; font-size: 11px; font-weight: 800; padding: 3px 10px; border-radius: 100px; }

        /* ── Graphique — évite la coupure entre pages ── */
        .chart-card {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 14px;
            padding: 18px 22px;
            margin-bottom: 22px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.04);
            page-break-inside: avoid;
            break-inside: avoid;
        }
        .chart-title {
            font-weight: 900; color: #0ea5e9; font-size: 11px;
            text-transform: uppercase; letter-spacing: 0.1em;
            margin-bottom: 14px; text-align: center;
            display: flex; align-items: center; gap: 8px;
        }
        .chart-title::before, .chart-title::after { content: ''; flex: 1; height: 2px; background: #e0f2fe; border-radius: 2px; }
        .chart-img { width: 100%; border-radius: 8px; display: block; }

        /* ── Marge NPSH ── */
        .marge-row   { display: flex; justify-content: space-between; align-items: center; }
        .marge-value { font-size: 30px; font-weight: 900; }
        .npsh-meta   { font-size: 11px; opacity: 0.40; margin-top: 16px; line-height: 1.9; text-align: center; }

        /* ── Note méthode ── */
        .info { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 14px 18px; margin-top: 22px; font-size: 11px; color: #0369a1; line-height: 1.8; }
        .info strong { font-size: 11px; }

        /* ── Tableau raccords ── */
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { padding: 8px 10px; text-align: left; font-size: 10px; text-transform: uppercase; color: #64748b; background: #f1f5f9; letter-spacing: 0.04em; }
        td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; }
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
                    margin:      [10, 10, 10, 10],
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
            const r   = resultats.parTroncon.find(x => x.id === t.id);
            const mat = nomMateriau(t.materiau, materiaux);

            let alerteHTML = '';
            if (r.vitesse < 0.5)
                alerteHTML = `<span class="badge" style="background:#ea580c18;color:#ea580c;border:1px solid #ea580c44;">⚠ Vitesse faible</span> `;
            else if (r.vitesse > 3)
                alerteHTML = `<span class="badge" style="background:#dc262618;color:#dc2626;border:1px solid #dc262644;">⚠ Vitesse élevée</span> `;

            return `
            <div class="card">
                <div class="t-head">
                    <span class="t-num">Tronçon ${i + 1}</span>
                    <span class="t-mat">${mat} — k = ${t.materiau} mm</span>
                </div>

                <!-- Paramètres d'entrée mis en avant -->
                <div class="inputs-bar">
                    <div class="inp-item">
                        <div class="inp-lbl">Débit</div>
                        <div class="inp-val">${parseFloat(debit).toFixed(1)} <span class="inp-unit">m³/h</span></div>
                    </div>
                    <div class="inp-sep"></div>
                    <div class="inp-item">
                        <div class="inp-lbl">Diamètre int.</div>
                        <div class="inp-val">${t.diametre} <span class="inp-unit">mm</span></div>
                    </div>
                    <div class="inp-sep"></div>
                    <div class="inp-item">
                        <div class="inp-lbl">Longueur</div>
                        <div class="inp-val">${t.longueur} <span class="inp-unit">m</span></div>
                    </div>
                </div>

                <!-- Résultats -->
                <div class="res-grid">
                    <div class="res-cell vit-cell">
                        <div class="res-lbl">Vitesse d'écoulement</div>
                        <div class="vit-val">${r.vitesse.toFixed(2)} <span class="res-unit">m/s</span></div>
                    </div>
                    <div class="res-cell">
                        <div class="res-lbl">Perte de charge</div>
                        <div class="res-val">${r.perte.toFixed(3)} <span class="res-unit">mCE</span></div>
                    </div>
                    <div class="res-cell">
                        <div class="res-lbl">Reynolds</div>
                        <div class="res-val" style="font-size:17px;">${r.Re.toLocaleString('fr-FR')}</div>
                    </div>
                    <div class="res-cell">
                        <div class="res-lbl">Régime</div>
                        <div class="res-val" style="font-size:17px;color:${regimeColor(r.regime)};">${r.regime}</div>
                    </div>
                </div>
                <div class="t-note">${alerteHTML}<span>Linéaire : <strong>${r.unitaire.toFixed(2)} mm/m</strong></span></div>
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
            <div class="h-logo">Rapport technique</div>
            <div class="h-title">PERTES DE CHARGE</div>
            <div class="h-sub">Généré le ${today()}</div>
            <div class="h-info">
                <span>Q = <strong>${parseFloat(debit).toFixed(1)} m³/h</strong></span>
                <span class="h-sep">|</span>
                <span><strong>${troncons.length}</strong> tronçon${troncons.length > 1 ? 's' : ''} en série</span>
            </div>
        </div>

        ${lignesTroncons}

        <div class="dark">
            <div class="d-label">Perte de charge totale — réseau complet</div>
            <div class="d-value">${resultats.perteTotal.toFixed(3)}</div>
            <div class="d-unit">mCE</div>
            <div class="d-sub">mètres de colonne d'eau</div>
            <hr class="divider">
            <div class="grid3">
                <div class="cell"><div class="cl">Débit</div><div class="cv">${parseFloat(debit).toFixed(1)} m³/h</div></div>
                <div class="cell"><div class="cl">Tronçons</div><div class="cv">${troncons.length}</div></div>
                <div class="cell"><div class="cl">Linéaire moyen</div><div class="cv">${moy} mm/m</div></div>
            </div>
        </div>

        ${chartSection}

        <div class="info">
            <strong>Paramètres de calcul</strong> —
            Loi : Darcy-Weisbach &nbsp;|&nbsp; Friction : Swamee-Jain &nbsp;|&nbsp;
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
                        <span class="badge" style="font-size:13px;margin-top:6px;display:inline-block;background:${color}22;color:${color};border:1px solid ${color}55;">${label}</span>
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
            <div class="h-logo">Rapport technique</div>
            <div class="h-title">NPSH — ANTI-CAVITATION</div>
            <div class="h-sub">Généré le ${today()}</div>
            <div class="h-info">
                <span>Q = <strong>${parseFloat(aspirQ).toFixed(1)} m³/h</strong></span>
                <span class="h-sep">|</span>
                <span>Ø <strong>${aspirD} mm</strong></span>
                <span class="h-sep">|</span>
                <span>L = <strong>${aspirL} m</strong></span>
            </div>
        </div>

        <div class="card">
            <div class="c-label">Conduite d'aspiration</div>
            <!-- Paramètres d'entrée mis en avant -->
            <div class="inputs-bar">
                <div class="inp-item">
                    <div class="inp-lbl">Débit</div>
                    <div class="inp-val">${parseFloat(aspirQ).toFixed(1)} <span class="inp-unit">m³/h</span></div>
                </div>
                <div class="inp-sep"></div>
                <div class="inp-item">
                    <div class="inp-lbl">Diamètre int.</div>
                    <div class="inp-val">${aspirD} <span class="inp-unit">mm</span></div>
                </div>
                <div class="inp-sep"></div>
                <div class="inp-item">
                    <div class="inp-lbl">Longueur</div>
                    <div class="inp-val">${aspirL} <span class="inp-unit">m</span></div>
                </div>
                <div class="inp-sep"></div>
                <div class="inp-item">
                    <div class="inp-lbl">Vitesse</div>
                    <div class="inp-val" style="color:#d97706;">${npshResult.V.toFixed(2)} <span class="inp-unit">m/s</span></div>
                </div>
            </div>
            <div style="font-size:12px;color:#64748b;margin-top:4px;">
                Matériau : <strong style="color:#334155;">${mat}</strong> — k = ${aspirMat} mm
            </div>
        </div>

        <div class="card">
            <div class="c-label">Singularités aspiration</div>
            <table>
                <thead><tr><th>Raccord</th><th style="text-align:center;">Coeff. ξ</th><th style="text-align:center;">Quantité</th></tr></thead>
                <tbody>${lignesRaccords || '<tr><td colspan="3" style="color:#94a3b8;text-align:center;padding:12px;">Aucune singularité</td></tr>'}</tbody>
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
                    <div style="font-size:11px;color:#64748b;margin-top:3px;">${parseFloat(hz) >= 0 ? '▲ Pompe en charge' : '▼ Pompe au-dessus du niveau'}</div>
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
            <div class="d-value">${npshResult.NPSHd.toFixed(3)}</div>
            <div class="d-unit">m</div>
            ${margeHTML}
            <hr class="divider">
            <div class="grid3">
                <div class="cell"><div class="cl">Hf linéaire</div><div class="cv">${npshResult.HfLin.toFixed(3)} m</div></div>
                <div class="cell"><div class="cl">Hf singulières</div><div class="cv">${npshResult.HfSing.toFixed(3)} m</div></div>
                <div class="cell"><div class="cl">Hf total</div><div class="cv" style="color:#7dd3fc;">${npshResult.Hf.toFixed(3)} m</div></div>
            </div>
            <div class="npsh-meta">
                Pa (alt. ${Math.round(npshResult.alt)} m) : ${Math.round(npshResult.Pa)} Pa &nbsp;·&nbsp;
                Pv (${npshResult.T} °C) : ${Math.round(npshResult.Pv)} Pa &nbsp;·&nbsp;
                ρ : ${npshResult.rho.toFixed(1)} kg/m³
            </div>
        </div>

        ${chartSection}

        <div class="info">
            <strong>Paramètres de calcul</strong> —
            NPSHd = (Pa − Pv) / (ρ·g) + Hz − Hf &nbsp;|&nbsp;
            Pv : formule de Magnus &nbsp;|&nbsp; Pa : formule barométrique &nbsp;|&nbsp;
            Hf linéaire : Darcy-Weisbach &nbsp;|&nbsp; Hf singulières : ξ·V²/2g &nbsp;|&nbsp;
            Marge recommandée : <strong>≥ 0,5 m</strong>
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

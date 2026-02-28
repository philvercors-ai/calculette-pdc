// ─── export.js — Génération de rapports PDF ────────────────────────────────
// Dépendance : html2pdf.js (chargé via CDN dans index.html)

(function () {
    'use strict';

    // ── Helpers ────────────────────────────────────────────────────────────────
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

    function generer(el, filename) {
        el.style.cssText = 'position:absolute;left:-9999px;top:0;width:190mm;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;font-size:13px;';
        document.body.appendChild(el);
        html2pdf()
            .set({
                margin:       [8, 8, 8, 8],
                filename:     filename,
                image:        { type: 'jpeg', quality: 0.97 },
                html2canvas:  { scale: 2, useCORS: true, logging: false },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
            })
            .from(el)
            .save()
            .then(() => document.body.removeChild(el));
    }

    // ── Styles partagés ────────────────────────────────────────────────────────
    const S = {
        header:  'background:#0ea5e9;color:white;padding:20px 24px;border-radius:12px;margin-bottom:16px;',
        card:    'background:white;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:12px;',
        dark:    'background:#1e293b;color:white;border-radius:12px;padding:20px 24px;margin-bottom:12px;',
        info:    'background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:12px 16px;margin-top:12px;font-size:11px;color:#1e40af;',
        label:   'font-size:10px;text-transform:uppercase;letter-spacing:0.05em;opacity:0.65;margin-bottom:2px;',
        value:   'font-weight:700;font-size:15px;',
        grid3:   'display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:12px;',
        grid2:   'display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px;',
        cell:    'background:rgba(255,255,255,0.08);border-radius:8px;padding:10px 12px;',
        cellW:   'background:#f8fafc;border-radius:8px;padding:10px 12px;',
        badge:   (color) => `display:inline-block;background:${color}22;color:${color};border:1px solid ${color}55;font-size:10px;font-weight:700;padding:2px 8px;border-radius:100px;`,
        divider: 'border:none;border-top:1px solid rgba(255,255,255,0.15);margin:12px 0;',
        dividerL:'border:none;border-top:1px solid #e2e8f0;margin:10px 0;',
    };

    // ── Template PDC ───────────────────────────────────────────────────────────
    function buildPDCHTML({ debit, troncons, resultats, materiaux }) {
        const lignesTroncons = troncons.map((t, i) => {
            const r = resultats.parTroncon.find(x => x.id === t.id);
            const mat = nomMateriau(t.materiau, materiaux);

            let alerteHTML = '';
            if (r.vitesse < 0.5)
                alerteHTML = `<span style="${S.badge('#ea580c')}">⚠ Vitesse faible</span> `;
            else if (r.vitesse > 3)
                alerteHTML = `<span style="${S.badge('#dc2626')}">⚠ Vitesse élevée</span> `;

            return `
            <div style="${S.card}">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                    <span style="font-weight:800;color:#0ea5e9;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Tronçon ${i + 1}</span>
                    <span style="color:#64748b;font-size:12px;">${mat} — k = ${t.materiau} mm</span>
                </div>
                <div style="color:#475569;font-size:12px;">
                    Ø <strong>${t.diametre} mm</strong> &nbsp;|&nbsp;
                    L <strong>${t.longueur} m</strong>
                </div>
                <hr style="${S.dividerL}">
                <div style="${S.grid2.replace('margin-top:8px', 'margin-top:4px')}">
                    <div style="${S.cellW}">
                        <div style="${S.label}">Perte de charge</div>
                        <div style="${S.value}">${r.perte.toFixed(3)} <span style="font-weight:400;font-size:12px;color:#64748b;">mCE</span></div>
                    </div>
                    <div style="${S.cellW}">
                        <div style="${S.label}">Vitesse</div>
                        <div style="${S.value}">${r.vitesse.toFixed(2)} <span style="font-weight:400;font-size:12px;color:#64748b;">m/s</span></div>
                    </div>
                    <div style="${S.cellW}">
                        <div style="${S.label}">Reynolds</div>
                        <div style="${S.value}">${r.Re.toLocaleString('fr-FR')}</div>
                    </div>
                    <div style="${S.cellW}">
                        <div style="${S.label}">Régime</div>
                        <div style="font-weight:800;font-size:14px;color:${regimeColor(r.regime)};">${r.regime}</div>
                    </div>
                </div>
                <div style="font-size:11px;color:#94a3b8;text-align:right;margin-top:6px;">
                    ${alerteHTML}Linéaire : ${r.unitaire.toFixed(2)} mm/m
                </div>
            </div>`;
        }).join('');

        const moy = (resultats.parTroncon.reduce((s, r) => s + r.unitaire, 0) / resultats.parTroncon.length).toFixed(1);

        return `
        <div>
            <!-- En-tête -->
            <div style="${S.header}">
                <div style="font-size:20px;font-weight:900;letter-spacing:-0.02em;margin-bottom:4px;">CALCULATEUR PDC</div>
                <div style="font-size:13px;opacity:0.85;margin-bottom:8px;">Rapport généré le ${today()}</div>
                <div style="font-size:14px;font-weight:600;">Débit global : ${parseFloat(debit).toFixed(1)} m³/h &nbsp;|&nbsp; ${troncons.length} tronçon${troncons.length > 1 ? 's' : ''} en série</div>
            </div>

            <!-- Tronçons -->
            ${lignesTroncons}

            <!-- Total -->
            <div style="${S.dark}">
                <div style="${S.label}color:rgba(255,255,255,0.55);">Perte de charge totale réseau</div>
                <div style="font-size:32px;font-weight:900;color:#7dd3fc;margin:6px 0;">${resultats.perteTotal.toFixed(3)} <span style="font-size:18px;font-weight:500;">mCE</span></div>
                <div style="${S.grid3}">
                    <div style="${S.cell}">
                        <div style="${S.label}color:rgba(255,255,255,0.5);">Débit</div>
                        <div style="${S.value}color:white;">${parseFloat(debit).toFixed(1)} m³/h</div>
                    </div>
                    <div style="${S.cell}">
                        <div style="${S.label}color:rgba(255,255,255,0.5);">Tronçons</div>
                        <div style="${S.value}color:white;">${troncons.length}</div>
                    </div>
                    <div style="${S.cell}">
                        <div style="${S.label}color:rgba(255,255,255,0.5);">Linéaire moy.</div>
                        <div style="${S.value}color:white;">${moy} mm/m</div>
                    </div>
                </div>
            </div>

            <!-- Note méthode -->
            <div style="${S.info}">
                <strong style="text-transform:uppercase;font-size:10px;">Paramètres de calcul</strong><br>
                Loi : Darcy-Weisbach (Friction : Swamee-Jain) &nbsp;|&nbsp;
                Fluide : Eau à 20 °C (ν = 1.004 × 10⁻⁶ m²/s) &nbsp;|&nbsp;
                Laminaire si Re &lt; 2 300 → f = 64/Re &nbsp;|&nbsp;
                Réseau série — même débit dans tous les tronçons
            </div>
        </div>`;
    }

    // ── Template NPSH ──────────────────────────────────────────────────────────
    function buildNPSHHTML({ aspirQ, aspirD, aspirL, aspirMat, raccords, raccordsList, hz, temp, altitude, npshr, npshResult, materiaux }) {
        const mat = nomMateriau(aspirMat, materiaux);

        const lignesRaccords = raccords.map(r => {
            const rc = raccordsList[r.nomIdx];
            return `<tr>
                <td style="padding:5px 8px;border-bottom:1px solid #e2e8f0;">${rc.nom}</td>
                <td style="padding:5px 8px;border-bottom:1px solid #e2e8f0;text-align:center;">ξ = ${rc.xi}</td>
                <td style="padding:5px 8px;border-bottom:1px solid #e2e8f0;text-align:center;font-weight:700;">× ${r.quantite}</td>
            </tr>`;
        }).join('');

        let margeHTML = '';
        let margeBgColor = '#1e293b';
        if (npshResult.margeNPSH !== null) {
            const m = npshResult.margeNPSH;
            const [color, label] = m > 0.5  ? ['#4ade80', '✓ Sécurisé']
                                 : m > 0    ? ['#fb923c', '⚠ Limite — vérifier']
                                 :            ['#f87171', '⚠ RISQUE CAVITATION'];
            margeHTML = `
                <hr style="${S.divider}">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div>
                        <div style="${S.label}color:rgba(255,255,255,0.55);">Marge NPSHd − NPSHr</div>
                        <span style="${S.badge(color)}">${label}</span>
                    </div>
                    <div style="font-size:24px;font-weight:900;color:${color};">${m >= 0 ? '+' : ''}${m.toFixed(3)} m</div>
                </div>`;
        }

        return `
        <div>
            <!-- En-tête -->
            <div style="${S.header}">
                <div style="font-size:20px;font-weight:900;letter-spacing:-0.02em;margin-bottom:4px;">CALCULATEUR PDC — NPSH</div>
                <div style="font-size:13px;opacity:0.85;">Rapport généré le ${today()}</div>
            </div>

            <!-- Conduite aspiration -->
            <div style="${S.card}">
                <div style="font-weight:800;color:#0ea5e9;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:10px;">Conduite d'aspiration</div>
                <div style="${S.grid3}">
                    <div style="${S.cellW}">
                        <div style="${S.label}">Débit</div>
                        <div style="${S.value}">${parseFloat(aspirQ).toFixed(1)} <span style="font-weight:400;font-size:12px;color:#64748b;">m³/h</span></div>
                    </div>
                    <div style="${S.cellW}">
                        <div style="${S.label}">Ø Intérieur</div>
                        <div style="${S.value}">${aspirD} <span style="font-weight:400;font-size:12px;color:#64748b;">mm</span></div>
                    </div>
                    <div style="${S.cellW}">
                        <div style="${S.label}">Longueur</div>
                        <div style="${S.value}">${aspirL} <span style="font-weight:400;font-size:12px;color:#64748b;">m</span></div>
                    </div>
                </div>
                <div style="font-size:12px;color:#64748b;margin-top:8px;">Matériau : <strong style="color:#334155;">${mat}</strong> — k = ${aspirMat} mm</div>
            </div>

            <!-- Singularités -->
            <div style="${S.card}">
                <div style="font-weight:800;color:#0ea5e9;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:10px;">Singularités aspiration</div>
                <table style="width:100%;border-collapse:collapse;font-size:12px;">
                    <thead>
                        <tr style="background:#f1f5f9;">
                            <th style="padding:6px 8px;text-align:left;font-size:10px;text-transform:uppercase;color:#64748b;">Raccord</th>
                            <th style="padding:6px 8px;text-align:center;font-size:10px;text-transform:uppercase;color:#64748b;">Coeff. ξ</th>
                            <th style="padding:6px 8px;text-align:center;font-size:10px;text-transform:uppercase;color:#64748b;">Qté</th>
                        </tr>
                    </thead>
                    <tbody>${lignesRaccords}</tbody>
                </table>
                <div style="font-size:11px;color:#94a3b8;margin-top:6px;text-align:right;">
                    Hf singulières : ${npshResult.HfSing.toFixed(3)} m &nbsp;|&nbsp; V aspiration : ${npshResult.V.toFixed(2)} m/s
                </div>
            </div>

            <!-- Conditions -->
            <div style="${S.card}">
                <div style="font-weight:800;color:#0ea5e9;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:10px;">Conditions d'installation</div>
                <div style="${S.grid2}">
                    <div style="${S.cellW}">
                        <div style="${S.label}">Hz aspiration</div>
                        <div style="${S.value}">${hz} <span style="font-weight:400;font-size:12px;color:#64748b;">m</span></div>
                        <div style="font-size:10px;color:#94a3b8;">${parseFloat(hz) >= 0 ? 'Pompe en charge' : 'Pompe au-dessus du niveau'}</div>
                    </div>
                    <div style="${S.cellW}">
                        <div style="${S.label}">Température</div>
                        <div style="${S.value}">${temp} <span style="font-weight:400;font-size:12px;color:#64748b;">°C</span></div>
                    </div>
                    <div style="${S.cellW}">
                        <div style="${S.label}">Altitude</div>
                        <div style="${S.value}">${altitude} <span style="font-weight:400;font-size:12px;color:#64748b;">m</span></div>
                    </div>
                    <div style="${S.cellW}">
                        <div style="${S.label}">NPSHr constructeur</div>
                        <div style="${S.value}">${npshr !== '' ? npshr + ' m' : '—'}</div>
                    </div>
                </div>
            </div>

            <!-- Résultat NPSH -->
            <div style="${S.dark}">
                <div style="${S.label}color:rgba(255,255,255,0.55);">NPSHd disponible</div>
                <div style="font-size:36px;font-weight:900;color:#7dd3fc;margin:6px 0;">${npshResult.NPSHd.toFixed(3)} <span style="font-size:18px;font-weight:500;">m</span></div>
                ${margeHTML}
                <hr style="${S.divider}">
                <div style="${S.grid3}">
                    <div style="${S.cell}">
                        <div style="${S.label}color:rgba(255,255,255,0.5);">Hf linéaire</div>
                        <div style="${S.value}color:white;">${npshResult.HfLin.toFixed(3)} m</div>
                    </div>
                    <div style="${S.cell}">
                        <div style="${S.label}color:rgba(255,255,255,0.5);">Hf singulières</div>
                        <div style="${S.value}color:white;">${npshResult.HfSing.toFixed(3)} m</div>
                    </div>
                    <div style="${S.cell}">
                        <div style="${S.label}color:rgba(255,255,255,0.5);">Hf total</div>
                        <div style="${S.value}color:white;">${npshResult.Hf.toFixed(3)} m</div>
                    </div>
                </div>
                <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-top:12px;line-height:1.6;">
                    Pa (${Math.round(npshResult.alt)} m alt.) : ${Math.round(npshResult.Pa)} Pa &nbsp;|&nbsp;
                    Pv (${npshResult.T} °C) : ${Math.round(npshResult.Pv)} Pa &nbsp;|&nbsp;
                    ρ : ${npshResult.rho.toFixed(1)} kg/m³
                </div>
            </div>

            <!-- Note méthode -->
            <div style="${S.info}">
                <strong style="text-transform:uppercase;font-size:10px;">Paramètres de calcul</strong><br>
                NPSHd = (Pa − Pv) / (ρ·g) + Hz − Hf &nbsp;|&nbsp;
                Pv : formule de Magnus &nbsp;|&nbsp;
                Pa : formule barométrique &nbsp;|&nbsp;
                Hf linéaire : Darcy-Weisbach &nbsp;|&nbsp;
                Hf singulières : méthode ξ·V²/2g &nbsp;|&nbsp;
                Marge de sécurité recommandée : ≥ 0.5 m
            </div>
        </div>`;
    }

    // ── API publique ───────────────────────────────────────────────────────────
    window.exportPDCReport = function (data) {
        const el = document.createElement('div');
        el.innerHTML = buildPDCHTML(data);
        generer(el, 'rapport-pdc.pdf');
    };

    window.exportNPSHReport = function (data) {
        const el = document.createElement('div');
        el.innerHTML = buildNPSHHTML(data);
        generer(el, 'rapport-npsh.pdf');
    };

})();

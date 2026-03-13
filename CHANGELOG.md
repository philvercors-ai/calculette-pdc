# Changelog — Calculateur PDC

## v2.2 — export.js + index.html — 2026-03-13
### Centrage A4 + Info version
- Largeur container réduite de 780px à **700px** (A4 utilisable ~718px à 96dpi).
- Padding interne 28px → 20px, marges jsPDF 10mm → 8mm : contenu centré sur A4.
- Composant `VersionInfo` dans l'app : badge "v2.1 · Historique versions" ouvre un
  modal avec les 4 dernières versions et notes de changement.
- SW : `pdc-app-v12` → `pdc-app-v13`

---

## v2.1 — export.js — 2026-03-13
### Correction page blanche
- **Cause** : `left:-9999px` → `getBoundingClientRect().left = -9999` → html2canvas
  capturait une zone hors-écran → canvas vide → PDF page blanche.
- **Fix** : wrapper `position:fixed;top:0;left:0;overflow:hidden;width:0;height:0`
  contenant le `#pdc-export` sans décalage. html2canvas voit le container à (0,0) →
  capture correcte.
- Ajout `scrollX:0; scrollY:0` dans les options html2canvas pour fiabiliser.
- SW : `pdc-app-v11` → `pdc-app-v12`

---

## v2.0 — export.js — 2026-03-13
### Correction critique
- **Abandon de l'iframe** pour la génération PDF : html2canvas ne calcule pas
  correctement les coordonnées d'un élément dans une iframe hors-écran (`left:-9999px`),
  ce qui produisait un rendu vide → PDF avec des 0.
- **Nouvelle stratégie** : div `#pdc-export` hors-écran dans le document principal.
  html2canvas trouve l'élément sans ambiguïté de coordonnées.
- **CSS scopé** : toutes les règles préfixées par `#pdc-export` → aucun conflit
  avec Tailwind ou React même si le div est dans le DOM principal.

### Correction Service Worker
- `sw.js` : cache `pdc-app-v10` → `pdc-app-v11`
- **Cause du bug récurrent** : le SW servait `export.js` depuis son cache,
  ignorant toutes les corrections pushées sur GitHub. Incrémenter `CACHE_NAME`
  force le navigateur à re-télécharger tous les fichiers.
- **Règle** : à chaque modification de `export.js`, `index.html` ou `sw.js`,
  il FAUT incrémenter `CACHE_NAME` dans `sw.js`.

---

## v1.3 — export.js — 2026-03-13 (commit 106d40d)
- Refonte présentation PDF : titre centré dans un cadre, bandeau inputs mis en avant,
  vitesse en fond jaune, perte totale en 52px, `page-break-inside:avoid` sur graphique.
- Bug subsistait (SW non mis à jour).

## v1.2 — export.js — 2026-03-10 (commit be3eb0c)
- Amélioration présentation + capture du graphique Chart.js (canvas.toDataURL).
- Bug subsistait (SW non mis à jour).

## v1.1 — export.js — 2026-03-10 (commit 4a7aeea)
### Correction bug "des 0 de partout" — 1re tentative
- `iframe height:0` → `height:5000px` + ajustement dynamique via `body.scrollHeight`.
- Fonctionnait en test direct mais rechutait après installation de la PWA
  (SW servait la vieille version cachée).

## v1.0 — export.js — restauré commit 45a135b
- Première version iframe avec `height:0` → bug de rendu html2canvas.

# Jules Arrouasse — Japanese Night

Site web immersif pour une soirée japonaise privée. HTML / CSS / JavaScript
vanilla, sans framework ni dépendance, sans backend. Optimisé pour Safari iPhone.

## Structure

```
index.html        page unique
css/style.css      tous les styles
js/main.js         compte à rebours, révélation du menu, animations, musique, easter egg
```

## Lancer le site en local

Aucune installation nécessaire. Il suffit de servir les fichiers statiques :

```bash
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

(ou l'extension VS Code "Live Server", ou `npx serve`).

## ⚙️ Changer la date/heure de révélation du menu

Dans `js/main.js`, tout en haut du fichier :

```js
const REVEAL_DATE = "2026-08-28T20:30:00+02:00";
```

- Le format est `AAAA-MM-JJTHH:MM:SS+02:00`.
- **Important** : gardez toujours le décalage horaire de Paris à la fin
  (`+02:00` en heure d'été / `+01:00` en heure d'hiver). Cela garantit que
  la révélation se déclenche à la bonne heure pour tous les invités, quel
  que soit le fuseau horaire réglé sur leur téléphone.
- Il n'y a rien d'autre à modifier : le compte à rebours, le déblocage
  automatique et l'animation de révélation s'adaptent tout seuls.

## 🧪 Mode test (avant vendredi)

Pour tester la révélation sans attendre l'heure réelle, ajoutez un paramètre
à l'URL :

- `?test=before` → force l'état "avant 20h30" (menu caché, compte à rebours)
- `?test=after` → force l'état "après 20h30" (menu déjà débloqué)
- `?debug=1` → affiche un petit panneau en bas à gauche avec 3 boutons
  (Avant 20h30 / Après 20h30 / Heure réelle) pour basculer sans toucher au code

Exemple : `http://localhost:8000?test=before&debug=1`

En mode `?test=before`, le compte à rebours est figé à 3h avant la
révélation ; il ne se déclenchera pas automatiquement (c'est voulu, pour
pouvoir explorer la page tranquillement). Utilisez le panneau de debug ou
`?test=after` pour voir le menu instantanément, ou laissez le mode `auto`
(par défaut, sans paramètre) tourner en conditions réelles.

- `?skipgate=1` → passe directement le filtre d'entrée (nom/prénom), pratique
  pour tester sans retaper "Arrouasse" à chaque rechargement.

## 🔒 Filtre d'entrée (nom / prénom)

Avant même l'écran d'accueil, chaque visiteur doit indiquer son prénom et
son nom. Seul le nom de famille **Arrouasse** (insensible à la casse et aux
accents) débloque le site ; tout autre nom affiche un écran de refus avec un
bouton "Sortez !".

- Pour changer le nom de famille accepté, éditer `GATE_SURNAME` tout en haut
  de la section correspondante dans `js/main.js`.
- Le passage du filtre est mémorisé pour la session (`sessionStorage`) : un
  invité qui recharge la page dans le même onglet n'a pas à le retaper.
- Les visuels ("Bravo" / "Intrus") sont construits dans le style du site
  (Enso, tampon encré, sceau rouge) plutôt qu'en images statiques, pour
  rester légers et cohérents avec le reste de la page.

## Musique d'ambiance

Le bouton en haut à droite active/coupe une nappe sonore douce générée
directement dans le navigateur (Web Audio API) — aucun fichier audio n'est
requis et rien ne se lance jamais automatiquement. Pour utiliser un vrai
enregistrement à la place :

1. Placer un fichier dans `audio/ambiance.mp3`
2. Dans `js/main.js`, fonction `initMusic()`, décommenter le bloc
   "Option simple : fichier audio réel" et supprimer/ignorer la nappe
   générative en dessous.

## Déploiement

Le site est 100% statique : n'importe quel hébergeur de fichiers statiques
fonctionne.

### Vercel
```bash
npx vercel
```
(répondre aux questions, aucune configuration de build nécessaire — "Other" / pas de framework)

### Netlify
- Glisser-déposer le dossier du projet sur [app.netlify.com/drop](https://app.netlify.com/drop)
- ou `npx netlify-cli deploy --prod`

### GitHub Pages
1. Pousser le contenu sur une branche (ex. `main`)
2. Dans Settings → Pages, choisir la branche et le dossier racine `/`
3. Le site sera disponible à `https://<utilisateur>.github.io/<repo>/`

## Notes techniques

- Aucune dépendance externe hormis les polices Google Fonts (Cormorant
  Garamond, Playfair Display, Noto Serif JP), chargées via `<link>`.
- Respecte `prefers-reduced-motion` : les animations lourdes (pétales,
  révélation cinématique) sont désactivées ou raccourcies pour les
  utilisateurs qui le demandent.
- Zones de sécurité iPhone (encoche / barre du bas) gérées via
  `env(safe-area-inset-*)`.
- Le compte à rebours et la révélation utilisent des timestamps absolus
  (`Date.getTime()`), donc le calcul est correct indépendamment du fuseau
  horaire réglé sur l'appareil de l'invité.

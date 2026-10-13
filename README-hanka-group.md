# Site web HANKA GROUP

## En une phrase
Un site vitrine pour HANKA GROUP (Abidjan, Riviera 2), présentant ses 6 services
(création d'entreprise, formation marchés publics et privés, formation certifiante,
procédures administratives, immobilier, communication digitale), avec un formulaire de
contact.

## Ce qui a été livré
- Le code source complet du site (HTML/CSS/JS), dans le dossier `hanka-group-site/`.
- Un suivi de version Git local, avec un premier commit enregistrant tout le squelette
  du site.
- Ce README, qui t'explique tout ce qu'il reste à faire pour mettre le site en ligne.

**Important : le site n'est pas encore en ligne.** Il faut d'abord créer un compte GitHub
(étape 1 ci-dessous), puis un compte sur l'hébergeur choisi (Netlify, étape 2), avant de
pouvoir obtenir une adresse publique.

## Contenu à finaliser avant la mise en ligne définitive

Beaucoup de textes du site sont volontairement marqués **`[Texte à valider]`** ou
**`[à confirmer]`** — ce sont des contenus que j'ai rédigés à titre provisoire pour que
le site ait une structure complète, mais qui doivent être relus et corrigés avec la
cliente avant publication officielle. Repère-les avec Ctrl+F dans les fichiers `.html`.

À prévoir en particulier :
- [ ] Les textes d'accroche (page d'accueil, à propos, descriptions détaillées des
      6 services).
- [ ] Une vraie photo (équipe, locaux, ou visuel de marque) pour remplacer les
      emplacements réservés marqués en pointillés.
- [ ] Les horaires d'ouverture exacts.
- [ ] Les 4 "atouts" / "valeurs" de l'entreprise (actuellement à confirmer).
- [ ] Vérifier la liste exacte des prestations pour chacun des 6 services.

## Les couleurs et le logo
J'ai repris l'esprit de la bannière déjà existante (bleu profond + doré/jaune, "HANKA"
en blanc, "GROUP" en doré) pour recréer un logo texte simple en CSS, et j'ai utilisé ce
bleu et ce doré partout sur le site. Si la cliente a un fichier logo officiel (image),
on pourra le glisser à la place du texte stylisé à tout moment.

## Étape 1 — Créer un compte GitHub (gratuit, 2 minutes)
GitHub est l'endroit où le code du site est sauvegardé et d'où Netlify ira chercher les
mises à jour.
1. Va sur https://github.com/signup et crée un compte gratuit.
2. Une fois connecté, clique sur **New repository** (ou le bouton **+** en haut à
   droite ▸ **New repository**).
3. Nom du dépôt : `hanka-group-site` (ou un autre nom de ton choix).
4. Laisse-le en **Public** ou **Private** selon ta préférence, ne coche aucune case
   d'initialisation (pas de README, pas de .gitignore — ils existent déjà).
5. Clique sur **Create repository**.
6. GitHub affiche une adresse du type `https://github.com/<ton-nom>/hanka-group-site.git`
   — garde-la, elle sert à l'étape suivante.

### Envoyer le code sur GitHub
Une fois le dépôt créé, exécute ces commandes dans le dossier `hanka-group-site/`
(remplace l'URL par celle de ton dépôt) :

```
git remote add origin https://github.com/<ton-nom>/hanka-group-site.git
git branch -M main
git push -u origin main
```

Dis-moi quand c'est fait (ou donne-moi ton nom d'utilisateur GitHub) et je peux préparer
ou vérifier cette étape avec toi directement depuis Claude Code.

## Étape 2 — Mettre le site en ligne avec Netlify (gratuit)
1. Va sur https://app.netlify.com/signup et crée un compte (tu peux te connecter
   directement avec ton compte GitHub, c'est le plus simple).
2. Clique sur **Add new site** ▸ **Import an existing project**.
3. Choisis **GitHub**, autorise Netlify à accéder à tes dépôts, puis sélectionne
   `hanka-group-site`.
4. Netlify détecte un site statique : laisse les champs de build vides (pas de commande
   de build nécessaire) et clique sur **Deploy**.
5. En moins d'une minute, Netlify te donne une adresse du type
   `https://hanka-group-xxxxx.netlify.app` — c'est ton site en ligne !

À partir de ce moment : **à chaque fois qu'une mise à jour du site est envoyée sur
GitHub (`git push`), Netlify republie automatiquement le site en 1-2 minutes.**

## Étape 3 — Nom de domaine personnalisé (optionnel, plus tard)
Tant qu'aucun nom de domaine n'a été acheté, le site reste accessible via l'adresse
`...netlify.app`. Quand la cliente sera prête :
1. Acheter un nom de domaine (ex. chez Namecheap, OVH, ou directement via Netlify
   ▸ **Domain settings** ▸ **Register a new domain**).
2. Dans Netlify ▸ **Domain settings** ▸ **Add a domain**, suivre les instructions pour
   pointer le domaine vers le site (enregistrements DNS fournis automatiquement par
   Netlify).
3. Netlify fournit le certificat HTTPS gratuitement une fois le domaine connecté.

## Sauvegardes et historique des versions
Chaque étape importante du site est enregistrée comme un "commit" Git — un peu comme un
point de sauvegarde. En cas de problème, on peut toujours revenir à une version
précédente. Une fois le dépôt poussé sur GitHub, l'historique complet sera visible sur
la page du dépôt, onglet **Commits**.

## Comment mettre à jour le contenu plus tard
- Les textes et les services sont dans les fichiers `index.html`, `services.html`,
  `a-propos.html`, `contact.html` (éditables avec n'importe quel éditeur de texte).
- Les couleurs et le style sont dans `css/style.css` (variables en haut du fichier,
  section `:root`).
- Après une modification, il suffit de faire un `git add -A`, `git commit -m "..."`,
  puis `git push` pour que le site se mette à jour en ligne automatiquement.

## Ta check-list à toi
- [ ] Relire et valider tous les textes marqués `[Texte à valider]`.
- [ ] Fournir une vraie photo/visuel pour la page d'accueil et la page à propos.
- [ ] Créer un compte GitHub (étape 1).
- [ ] Créer un compte Netlify et connecter le dépôt (étape 2).
- [ ] Vérifier le site en ligne sur ordinateur et sur téléphone.
- [ ] Tester le formulaire de contact (il ouvre ta messagerie email pré-remplie).
- [ ] Décider si un nom de domaine personnalisé est souhaité (étape 3).

## Vérifier que ça fonctionne
- Ouvrir l'adresse Netlify sur ordinateur et sur téléphone.
- Vérifier que les 4 pages s'affichent et que la navigation fonctionne.
- Cliquer sur "Envoyer ma demande" dans le formulaire de contact : ta messagerie doit
  s'ouvrir avec un message pré-rempli adressé à hanekatehe@gmail.com.

## Si ça ne marche pas
| Ce que tu vois | Cause probable | Quoi faire |
|---|---|---|
| Le site ne se met pas à jour après un `git push` | Le dépôt Netlify n'est pas bien connecté au bon dépôt GitHub | Vérifier dans Netlify ▸ Site settings ▸ Build & deploy |
| Le formulaire n'ouvre rien au clic | Aucune application de messagerie par défaut configurée sur l'appareil | Configurer une messagerie par défaut, ou prévoir plus tard un vrai service de formulaire (ex. Formspree) |
| Le logo/les couleurs ne correspondent pas à la charte réelle | Le logo actuel est une recréation texte à partir d'une photo de bannière | Fournir le fichier logo officiel pour remplacement |

## À décider / en attente
- Compte GitHub de la cliente ou de l'utilisateur (à créer, étape 1).
- Nom de domaine personnalisé : à acheter ou non, et lequel.
- Validation finale de tous les textes et visuels marqués comme provisoires.
- Confirmation de la liste exacte des prestations pour chaque service.

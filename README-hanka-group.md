# Site web HANKA GROUP

## En une phrase
Site vitrine de HANKA GROUP (Abidjan, Riviera 2) présentant ses 6 services — création
d'entreprise, formation marchés publics et privés, formation certifiante, procédures
administratives, immobilier, communication digitale — avec un formulaire de contact.

## 🌐 Le site est en ligne
**Adresse publique : https://blahindef-creator.github.io/hanka-group-site/**

- Code source (sauvegardé) : https://github.com/blahindef-creator/hanka-group-site
- Hébergement : GitHub Pages (gratuit, HTTPS inclus, aucun frais mensuel)

## Ce qui a été livré
- 4 pages : Accueil, Services, À propos, Contact.
- Un design aux couleurs de la marque (bleu profond + doré) repris de la bannière
  existante, avec un logo texte « HANKA GROUP » recréé en CSS.
- Un formulaire de contact qui ouvre la messagerie pré-remplie vers hanekatehe@gmail.com.
- Un site adapté au mobile, à la tablette et à l'ordinateur.
- Les bases du référencement : titres et descriptions par page, favicon, sitemap.xml,
  robots.txt, aperçu pour le partage sur les réseaux sociaux.
- L'historique complet des versions sur GitHub.

## ⚠️ Contenu provisoire à remplacer
Plusieurs textes sont marqués **`[Texte à valider]`** ou **`[à confirmer]`** : ce sont des
contenus que j'ai rédigés pour que le site soit complet, mais qui doivent être relus et
corrigés avec la cliente. **Ils sont actuellement visibles en ligne.**

À finaliser :
- [ ] Les textes d'accroche (accueil, à propos, descriptions des 6 services).
- [ ] Une vraie photo (équipe, locaux, visuel de marque) pour remplacer les encadrés en
      pointillés.
- [ ] Les horaires d'ouverture exacts.
- [ ] Les 4 « atouts » et les « valeurs » de l'entreprise.
- [ ] La liste précise des prestations de chaque service.
- [ ] Le fichier logo officiel, si la cliente en possède un (le logo actuel est une
      recréation en texte à partir de la photo de la bannière).

## Comment mettre à jour le site
Le site se met à jour automatiquement : dès qu'une modification est envoyée sur GitHub,
GitHub Pages republie le site en 1 à 2 minutes.

Les fichiers à modifier :
- Textes et contenus : `index.html`, `services.html`, `a-propos.html`, `contact.html`
- Couleurs et style : `css/style.css` (les couleurs sont regroupées tout en haut du
  fichier, dans la section `:root`)

Après une modification, depuis le dossier du projet :
```
git add -A
git commit -m "Description de la modification"
git push
```

Ou simplement : demande-moi la modification et je m'en occupe directement.

## Sauvegardes et historique des versions
Chaque étape du projet est enregistrée sous forme de « commit » — un point de sauvegarde.
On peut revenir à n'importe quelle version antérieure en cas de problème.

Historique consultable ici :
https://github.com/blahindef-creator/hanka-group-site/commits/main

## Nom de domaine personnalisé (optionnel)
Le site est accessible via l'adresse GitHub Pages ci-dessus. Pour une adresse plus
professionnelle (ex. `hankagroup.ci` ou `hanka-group.com`) :
1. Acheter le nom de domaine chez un registrar (Namecheap, OVH, Gandi…).
2. Dans le dépôt GitHub ▸ **Settings** ▸ **Pages** ▸ **Custom domain**, saisir le domaine.
3. Chez le registrar, créer les enregistrements DNS indiqués par GitHub.
4. GitHub fournit le certificat HTTPS gratuitement une fois le domaine vérifié.

Je peux m'occuper des étapes 2 et 3 si tu me donnes le domaine acheté.

## Vérifier que tout fonctionne
- Ouvrir https://blahindef-creator.github.io/hanka-group-site/ sur ordinateur **et** sur
  téléphone.
- Vérifier que les 4 pages s'affichent et que le menu fonctionne.
- Sur la page Contact, cliquer sur « Envoyer ma demande » : la messagerie doit s'ouvrir
  avec un message pré-rempli vers hanekatehe@gmail.com.

## Si ça ne marche pas
| Ce que tu vois | Cause probable | Quoi faire |
|---|---|---|
| Une modification n'apparaît pas en ligne | Le déploiement prend 1-2 min | Attendre, puis rafraîchir avec Ctrl+F5 |
| Page « 404 » sur une page | Nom de fichier mal orthographié dans un lien | Vérifier les liens dans le fichier HTML concerné |
| Le formulaire n'ouvre rien au clic | Aucune messagerie par défaut sur l'appareil | Configurer une messagerie, ou passer à un service de formulaire (ex. Formspree) — à voir ensemble si besoin |
| Le logo ne correspond pas exactement à la charte | Logo recréé à partir d'une photo de bannière | Fournir le fichier logo officiel |

## Points en attente
- Validation de tous les textes provisoires par la cliente.
- Photos et visuels réels à fournir.
- Décision sur un nom de domaine personnalisé.
- Éventuellement : un vrai service de formulaire (pour recevoir les demandes par email
  sans passer par la messagerie du visiteur).

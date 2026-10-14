// Emplacements photo du site remplaçables depuis l'espace admin (onglet Visuels).
// cle : identifiant de l'emplacement (attribut data-visuel dans la page)
// defaut : image d'origine, réaffichée si l'admin clique sur « Revenir à l'image d'origine »
// format : proportions conseillées pour la nouvelle image

var EMPLACEMENTS_VISUELS = [
  { cle: "accueil-diapo-1", page: "Accueil", nom: "Diaporama d'accueil — photo 1", defaut: "assets/hero/formation-salle.jpg", format: "portrait 3:4" },
  { cle: "accueil-diapo-2", page: "Accueil", nom: "Diaporama d'accueil — photo 2", defaut: "assets/hero/intervenante.jpg", format: "portrait 3:4" },
  { cle: "apropos-photo", page: "À propos", nom: "Photo « Qui sommes-nous ? »", defaut: "assets/hero/formation-salle.jpg", format: "paysage 4:3" }
];

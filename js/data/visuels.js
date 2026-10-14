// Emplacements photo du site remplaçables depuis l'espace admin (onglet Visuels).
// cle : identifiant de l'emplacement (attribut data-visuel dans la page)
// defaut : image d'origine, réaffichée si l'admin clique sur « Revenir à l'image d'origine »
// format : proportions conseillées pour la nouvelle image

var EMPLACEMENTS_VISUELS = [
  { cle: "accueil-diapo-1", page: "Accueil", nom: "Haut de l'accueil — photo 1", defaut: "assets/hero/equipe-ordinateur.jpg", format: "paysage, sujets à droite" },
  { cle: "accueil-diapo-2", page: "Accueil", nom: "Haut de l'accueil — photo 2", defaut: "assets/hero/formation-salle.jpg", format: "paysage, sujets à droite" },
  { cle: "accueil-diapo-3", page: "Accueil", nom: "Haut de l'accueil — photo 3", defaut: "assets/hero/intervenante.jpg", format: "paysage, sujets à droite" },
  { cle: "services-haut-1", page: "Services (haut de page)", nom: "Photo 1", defaut: "assets/services/communication-reseaux.jpg", format: "paysage, sujet à droite" },
  { cle: "services-haut-2", page: "Services (haut de page)", nom: "Photo 2", defaut: "assets/services/immobilier-maquette.jpg", format: "paysage, sujet à droite" },
  { cle: "services-haut-3", page: "Services (haut de page)", nom: "Photo 3", defaut: "assets/services/modification-croissance.jpg", format: "paysage, sujet à droite" },
  { cle: "services-haut-4", page: "Services (haut de page)", nom: "Photo 4", defaut: "assets/hero/services-dossiers.jpg", format: "paysage, sujet à droite" },
  { cle: "services-haut-5", page: "Services (haut de page)", nom: "Photo 5", defaut: "assets/services/creation-entreprise.jpg", format: "paysage, sujet à droite" },
  { cle: "apropos-photo", page: "À propos", nom: "Photo « Qui sommes-nous ? »", defaut: "assets/hero/formation-salle.jpg", format: "paysage 4:3" }
];

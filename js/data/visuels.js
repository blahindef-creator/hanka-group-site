// Emplacements photo du site remplaçables depuis l'espace admin (onglet Visuels).
// cle : identifiant de l'emplacement (attribut data-visuel dans la page)
// defaut : image d'origine, réaffichée si l'admin clique sur « Revenir à l'image d'origine »
// format : proportions conseillées pour la nouvelle image

var EMPLACEMENTS_VISUELS = [
  { cle: "accueil-diapo-1", page: "Accueil", nom: "Diaporama d'accueil — photo 1", defaut: "assets/hero/formation-salle.jpg", format: "portrait 3:4" },
  { cle: "accueil-diapo-2", page: "Accueil", nom: "Diaporama d'accueil — photo 2", defaut: "assets/hero/intervenante.jpg", format: "portrait 3:4" },
  { cle: "services-creation", page: "Services", nom: "Création d'entreprise", defaut: "assets/services/creation-entreprise.jpg", format: "paysage 4:3" },
  { cle: "services-modification-1", page: "Services", nom: "Modification d'entreprise — image 1", defaut: "assets/services/modification-etapes.jpg", format: "paysage 4:3" },
  { cle: "services-modification-2", page: "Services", nom: "Modification d'entreprise — image 2", defaut: "assets/services/modification-dossiers.jpg", format: "paysage 4:3" },
  { cle: "services-modification-3", page: "Services", nom: "Modification d'entreprise — image 3", defaut: "assets/services/modification-croissance.jpg", format: "paysage 4:3" },
  { cle: "services-formation", page: "Services", nom: "Formation certifiante", defaut: "assets/services/formation-conference.jpg", format: "paysage 4:3" },
  { cle: "services-procedures-1", page: "Services", nom: "Procédures administratives — image 1", defaut: "assets/services/procedures-courriers.jpg", format: "paysage 4:3" },
  { cle: "services-procedures-2", page: "Services", nom: "Procédures administratives — image 2", defaut: "assets/services/procedures-classeur.jpg", format: "paysage 4:3" },
  { cle: "services-procedures-3", page: "Services", nom: "Procédures administratives — image 3", defaut: "assets/services/procedures-assistant.jpg", format: "paysage 4:3" },
  { cle: "services-immobilier-1", page: "Services", nom: "Immobilier — image 1", defaut: "assets/services/immobilier-maquette.jpg", format: "paysage 4:3" },
  { cle: "services-immobilier-2", page: "Services", nom: "Immobilier — image 2", defaut: "assets/services/immobilier-vente.jpg", format: "paysage 4:3" },
  { cle: "services-communication-1", page: "Services", nom: "Communication digitale — image 1", defaut: "assets/services/communication-reseaux.jpg", format: "paysage 4:3" },
  { cle: "services-communication-2", page: "Services", nom: "Communication digitale — image 2", defaut: "assets/services/communication-marketing.jpg", format: "paysage 4:3" },
  { cle: "apropos-photo", page: "À propos", nom: "Photo « Qui sommes-nous ? »", defaut: "assets/hero/formation-salle.jpg", format: "paysage 4:3" }
];

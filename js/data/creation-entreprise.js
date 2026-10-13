// Données du parcours « Créer mon entreprise » — à modifier ici uniquement.
// ATTENTION : toute forme juridique ajoutée ici doit aussi être ajoutée dans la base Supabase
// (contrainte « forme_juridique » de la table demandes_creation).

var FORMES_JURIDIQUES = [
  "Entreprise individuelle",
  "SARL",
  "SARLU",
  "SAS",
  "SASU",
  "ONG",
  "Startup",
  "SCI",
  "Association",
  "Fondation",
  "SCOOPS"
];

// Abidjan en premier, puis ordre alphabétique
var VILLES_CI = [
  "Abidjan",
  "Aboisso", "Adiaké", "Adzopé", "Agboville", "Agnibilékrou", "Akoupé", "Alépé",
  "Anyama", "Arrah", "Assinie", "Bangolo", "Béoumi", "Bingerville",
  "Biankouma", "Bocanda", "Bondoukou", "Bongouanou", "Bonoua", "Bouaflé", "Bouaké",
  "Bouna", "Boundiali", "Dabakala", "Dabou", "Daloa", "Danané", "Daoukro", "Didiévi",
  "Dimbokro", "Divo", "Duékoué", "Ferkessédougou", "Fresco", "Gagnoa", "Grand-Bassam", "Grand-Lahou",
  "Guiglo", "Issia", "Jacqueville", "Katiola", "Korhogo", "Lakota", "M'Bahiakro",
  "Man", "Mankono", "Méagui", "Odienné", "Oumé", "Sakassou", "San-Pédro", "Sassandra",
  "Séguéla", "Sinfra", "Soubré", "Tabou", "Tanda", "Tengréla", "Tiassalé", "Tiébissou",
  "Touba", "Toulépleu", "Toumodi", "Vavoua", "Yamoussoukro", "Zuénoula"
];

// Packs proposés pour l'Entreprise individuelle et la SARL
var PACKS = {
  pack1: {
    nom: "Pack Essentiel",
    avantages: [
      "1 Registre de Commerce",
      "1 DFE",
      "Les statuts",
      "Une déclaration de souscription et de versement",
      "Un contrat de bail professionnel",
      "Un avis de constitution",
      "Une annexe fiscale",
      "Une formation sur les impôts (pour ne jamais avoir de problèmes avec les impôts)",
      "Un cachet"
    ]
  },
  pack2: {
    nom: "Pack Premium",
    badge: "Le plus complet",
    avantages: [
      "1 Registre de Commerce",
      "1 DFE",
      "Les statuts",
      "Une déclaration de souscription et de versement",
      "Un contrat de bail professionnel",
      "Un avis de constitution",
      "Une annexe fiscale",
      "Une formation sur les impôts (pour ne jamais avoir de problèmes avec les impôts)",
      "Un cachet",
      "Un entête",
      "Des modèles de contrats et factures",
      "La liste des marchés publics et privés du mois",
      "Une formation pour vendre à outrance sur les réseaux sociaux",
      "Un accompagnement sur la gestion de l'entreprise"
    ]
  }
};

// Éléments modifiables proposés dans le parcours « Modifier mon entreprise ».
// ATTENTION : les codes (à gauche) doivent correspondre à la contrainte de la table demandes_modification.
var CHANGEMENTS_POSSIBLES = {
  forme_juridique: { nom: "Forme juridique", aide: "Ex. passer d'une Entreprise individuelle à une SARL" },
  gerant: { nom: "Gérant", aide: "Nomination, remplacement ou départ du gérant" },
  localisation: { nom: "Localisation", aide: "Transfert du siège social" },
  statuts: { nom: "Statuts", aide: "Capital, objet social, nom, répartition des parts..." }
};

// Tarification de la création d'entreprise (affichage côté site).
// La base Supabase recalcule le prix avec la même règle (fonction calculer_prix) :
// si vous changez un tarif ici, changez-le aussi dans la base.

var FORMES_AVEC_PACK = ["Entreprise individuelle", "SARL"];

var TARIFS = {
  abidjan: { pack1: 200000, pack2: 250000 },
  horsAbidjan: { pack1: 300000, pack2: 350000 },
  autresFormes: 500000
};

function formeAvecPack(forme) {
  return FORMES_AVEC_PACK.indexOf(forme) !== -1;
}

// Retourne le prix en FCFA, ou null si un pack est requis mais pas encore choisi
function calculerPrix(forme, ville, pack) {
  if (!formeAvecPack(forme)) return TARIFS.autresFormes;
  var grille = (ville || "").trim().toLowerCase() === "abidjan" ? TARIFS.abidjan : TARIFS.horsAbidjan;
  return grille[pack] || null;
}

// 200000 -> « 200 000 FCFA »
function formaterFCFA(montant) {
  return String(montant).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " FCFA";
}

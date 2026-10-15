// Gestion des comptes admin de l'espace HANKA GROUP.
// Réservé à l'admin « principal » : lister, créer, retirer, bloquer / réactiver les collaborateurs
// et définir leur mot de passe (les collaborateurs ne gèrent pas eux-mêmes leur mot de passe).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const BLOCAGE = "876000h"; // ~100 ans : bloqué jusqu'à réactivation

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ erreur: "Méthode non autorisée" }, 405);

  const service = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  // Qui appelle ?
  const jeton = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data: auth, error: errAuth } = await service.auth.getUser(jeton);
  const emailAppelant = auth?.user?.email?.toLowerCase();
  if (errAuth || !emailAppelant) return json({ erreur: "Connexion requise" }, 401);

  const { data: appelant } = await service
    .from("admins").select("email, role").ilike("email", emailAppelant).maybeSingle();
  if (!appelant || appelant.role !== "principal") {
    return json({ erreur: "Réservé à l'administrateur principal" }, 403);
  }

  let corps: Record<string, unknown>;
  try {
    corps = await req.json();
  } catch {
    return json({ erreur: "Requête invalide" }, 400);
  }

  const action = corps.action;

  async function utilisateursParEmail() {
    const { data } = await service.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const index = new Map<string, { id: string; banned_until?: string | null; user_metadata?: Record<string, unknown> }>();
    for (const u of data?.users ?? []) if (u.email) index.set(u.email.toLowerCase(), u);
    return index;
  }

  // Collaborateur visé par bloquer / activer / mot de passe
  async function collaborateurCible() {
    const email = String(corps.email ?? "").trim().toLowerCase();
    if (email === emailAppelant) return { erreur: json({ erreur: "Action impossible sur votre propre compte" }, 400) };
    const { data: cible } = await service.from("admins").select("email, role").ilike("email", email).maybeSingle();
    if (!cible) return { erreur: json({ erreur: "Compte introuvable" }, 404) };
    if (cible.role === "principal") return { erreur: json({ erreur: "Action impossible sur un administrateur principal" }, 400) };
    const utilisateur = (await utilisateursParEmail()).get(email);
    if (!utilisateur) return { erreur: json({ erreur: "Compte de connexion introuvable" }, 404) };
    return { utilisateur };
  }

  if (action === "lister") {
    const { data, error } = await service
      .from("admins").select("email, nom, role, created_at").order("created_at");
    if (error) return json({ erreur: error.message }, 500);
    const index = await utilisateursParEmail();
    const maintenant = Date.now();
    const admins = data.map((a) => {
      const u = index.get(a.email.toLowerCase());
      const bloque = !!(u?.banned_until && new Date(u.banned_until).getTime() > maintenant);
      return { ...a, bloque };
    });
    return json({ ok: true, admins });
  }

  if (action === "creer") {
    const email = String(corps.email ?? "").trim().toLowerCase();
    const nom = String(corps.nom ?? "").trim().slice(0, 100) || null;
    const motDePasse = String(corps.mot_de_passe ?? "");
    if (!EMAIL_RE.test(email)) return json({ erreur: "Adresse email invalide" }, 400);
    if (motDePasse.length < 8) return json({ erreur: "Le mot de passe doit faire au moins 8 caractères" }, 400);

    const { data: existe } = await service.from("admins").select("email").ilike("email", email).maybeSingle();
    if (existe) return json({ erreur: "Ce compte admin existe déjà" }, 409);

    const { error: errCreation } = await service.auth.admin.createUser({
      email,
      password: motDePasse,
      email_confirm: true,
      user_metadata: { nom, doit_changer_mdp: false },
    });
    // Si l'utilisateur existe déjà côté connexion, on se contente de lui donner l'accès
    if (errCreation && !/already|registered|exists/i.test(errCreation.message)) {
      return json({ erreur: errCreation.message }, 400);
    }

    const { error: errAjout } = await service.from("admins").insert({ email, nom, role: "collaborateur" });
    if (errAjout) return json({ erreur: errAjout.message }, 500);
    return json({ ok: true, compte_existant: !!errCreation });
  }

  if (action === "bloquer" || action === "activer") {
    const { utilisateur, erreur } = await collaborateurCible();
    if (erreur) return erreur;
    const { error } = await service.auth.admin.updateUserById(utilisateur!.id, {
      ban_duration: action === "bloquer" ? BLOCAGE : "none",
    });
    if (error) return json({ erreur: error.message }, 500);
    return json({ ok: true });
  }

  if (action === "mot_de_passe") {
    const motDePasse = String(corps.mot_de_passe ?? "");
    if (motDePasse.length < 8) return json({ erreur: "Le mot de passe doit faire au moins 8 caractères" }, 400);
    const { utilisateur, erreur } = await collaborateurCible();
    if (erreur) return erreur;
    const { error } = await service.auth.admin.updateUserById(utilisateur!.id, {
      password: motDePasse,
      user_metadata: { ...(utilisateur!.user_metadata ?? {}), doit_changer_mdp: false },
    });
    if (error) return json({ erreur: error.message }, 500);
    return json({ ok: true });
  }

  if (action === "retirer") {
    const email = String(corps.email ?? "").trim().toLowerCase();
    if (email === emailAppelant) return json({ erreur: "Vous ne pouvez pas retirer votre propre compte" }, 400);

    const { data: cible } = await service.from("admins").select("email, role").ilike("email", email).maybeSingle();
    if (!cible) return json({ erreur: "Compte introuvable" }, 404);
    if (cible.role === "principal") return json({ erreur: "Impossible de retirer un administrateur principal" }, 400);

    const { error: errRetrait } = await service.from("admins").delete().ilike("email", email);
    if (errRetrait) return json({ erreur: errRetrait.message }, 500);

    // Supprime aussi le compte de connexion pour qu'il ne puisse plus se connecter
    const utilisateur = (await utilisateursParEmail()).get(email);
    if (utilisateur) await service.auth.admin.deleteUser(utilisateur.id);

    return json({ ok: true });
  }

  return json({ erreur: "Action inconnue" }, 400);
});

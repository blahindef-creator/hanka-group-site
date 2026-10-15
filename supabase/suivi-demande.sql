-- Suivi d'une demande sans compte : référence (n° 12, M3, C1) + téléphone ou email utilisés lors de la demande.
-- Ne renvoie que le statut et le résumé de la demande (jamais la note interne ni les coordonnées).
create or replace function public.suivre_demande(p_reference text, p_contact text)
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  ref text := upper(regexp_replace(coalesce(p_reference, ''), '[^A-Za-z0-9]', '', 'g'));
  contact text := lower(trim(coalesce(p_contact, '')));
  chiffres text := regexp_replace(contact, '\D', '', 'g');
  v_numero bigint;
  resultat json;
begin
  -- Il faut un email complet ou au moins 8 chiffres de téléphone
  if position('@' in contact) = 0 and length(chiffres) < 8 then
    return null;
  end if;

  if ref ~ '^M[0-9]{1,12}$' then
    v_numero := substring(ref from 2)::bigint;
    select json_build_object(
      'type', 'modification', 'reference', 'M' || d.numero, 'statut', d.statut, 'date', d.created_at,
      'forme_actuelle', d.forme_actuelle, 'changements', d.changements)
    into resultat
    from demandes_modification d
    where d.numero = v_numero
      and ((position('@' in contact) > 0 and lower(d.email) = contact)
        or (length(chiffres) >= 8 and right(regexp_replace(coalesce(d.telephone, ''), '\D', '', 'g'), 8) = right(chiffres, 8)));

  elsif ref ~ '^C[0-9]{1,12}$' then
    v_numero := substring(ref from 2)::bigint;
    select json_build_object(
      'type', 'contact', 'reference', 'C' || d.numero, 'statut', d.statut, 'date', d.created_at,
      'service', d.service)
    into resultat
    from messages_contact d
    where d.numero = v_numero
      and ((position('@' in contact) > 0 and lower(d.email) = contact)
        or (length(chiffres) >= 8 and right(regexp_replace(coalesce(d.telephone, ''), '\D', '', 'g'), 8) = right(chiffres, 8)));

  elsif ref ~ '^N?[0-9]{1,12}$' then
    v_numero := regexp_replace(ref, '^N', '')::bigint;
    select json_build_object(
      'type', 'creation', 'reference', 'n° ' || d.numero, 'statut', d.statut, 'date', d.created_at,
      'forme_juridique', d.forme_juridique, 'ville', d.ville, 'pack', d.pack, 'prix', d.prix)
    into resultat
    from demandes_creation d
    where d.numero = v_numero
      and ((position('@' in contact) > 0 and lower(d.email) = contact)
        or (length(chiffres) >= 8 and right(regexp_replace(coalesce(d.telephone, ''), '\D', '', 'g'), 8) = right(chiffres, 8)));
  end if;

  return resultat;
end;
$$;

revoke all on function public.suivre_demande(text, text) from public;
grant execute on function public.suivre_demande(text, text) to anon, authenticated;

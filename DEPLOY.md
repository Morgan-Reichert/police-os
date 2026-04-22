# Déploiement Vercel + Supabase

## 1. Supabase (10 min)

1. Crée un projet sur https://supabase.com (gratuit)
2. Onglet **SQL Editor** → **New Query** → colle `supabase/schema.sql` → **Run**
3. Onglet **Storage** → **New bucket** → crée :
   - `fingerprints` (Public = **OFF**)
   - `wiretaps` (Public = **OFF**)
4. Retour **SQL Editor** → colle `supabase/storage-policies.sql` → **Run**
5. Onglet **Authentication > Providers** → active **Email** (désactive la confirmation email pour tes tests RP)
6. Récupère dans **Project Settings > API** :
   - `Project URL`
   - `anon public key` (pour le front)
   - `service_role key` (pour le back, ⚠ secret)

## 2. Créer le premier MJ

Dans **SQL Editor** après avoir inscrit un compte via l'interface :

```sql
-- Remplace l'email par le tien
update public.profiles
   set role = 'mj', grade = 'Commissaire', nom = 'Morgan Reichert', badge = '0001'
 where id = (select id from auth.users where email = 'ton-mail@exemple.com');
```

## 3. Variables d'environnement Vercel

Dans **Vercel > ton projet > Settings > Environment Variables**, ajoute :

| Nom | Valeur | Où s'en sert |
|---|---|---|
| `VITE_SUPABASE_URL` | `https://xxxx.supabase.co` | Frontend (Vite expose les vars `VITE_*`) |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGci...` (anon public) | Frontend |
| `SUPABASE_URL` | même URL | Backend serverless |
| `SUPABASE_SERVICE_KEY` | `eyJhbGci...` (service_role ⚠) | Backend (bypasse RLS pour l'IA) |
| `ANTHROPIC_API_KEY` | `sk-ant-...` | Backend (IA Magistrat) |

**Important** : coche **Production / Preview / Development** pour chaque variable.

## 4. Déploiement

```bash
vercel --prod
# ou push sur main → auto-deploy si GitHub connecté
```

## 5. Limites du free tier Supabase

| Ressource | Quota | Consommation estimée |
|---|---|---|
| Base Postgres | 500 Mo | ~10 000 empreintes + 50 000 messages magistrat |
| Storage | 1 Go | ~200 fichiers audio de 5 Mo |
| Bande passante | 5 Go/mois | OK jusqu'à ~50 joueurs actifs |
| Edge Functions | 500 000 invocations | Largement suffisant |

Au-delà : plan Pro à 25 $/mois.

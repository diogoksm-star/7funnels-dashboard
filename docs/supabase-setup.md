# Supabase setup

## 1. Criar projeto

Crie um projeto no Supabase e copie:

- Project URL
- anon public key
- service role key

## 2. Configurar env local

Crie `.env.local` na raiz:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=SUA_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL=https://7funnels.info
```

Nunca commitar `.env.local`.

## 3. Rodar schema

No Supabase SQL Editor, rode:

```sql
-- copie e execute supabase/schema.sql
```

## 4. Verificar conexão

Com o dev server ligado:

```bash
npm run dev
```

Acesse:

```txt
http://localhost:3000/api/supabase/health
```

Resposta esperada:

```json
{
  "ok": true,
  "mode": "supabase",
  "message": "Supabase conectado e schema acessível."
}
```

No admin, o badge muda de `Modo local ativo` para `Supabase conectado`.

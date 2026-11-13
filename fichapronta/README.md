# FichaPronta — MVP

Ficha de anamnese online para fisioterapeutas e massoterapeutas.

**O que já funciona nesta versão**
- Login do profissional com Google ou código por e-mail
- Cadastro do perfil
- Configuração da ficha por técnica (liberação miofascial, dry needling, ventosa, quiropraxia, massagem, eletroterapia, pilates) e perguntas opcionais
- Geração do link para o paciente, com envio pelo WhatsApp
- Ficha do paciente em etapas, no celular, sem login, salvando o progresso
- Painel com a lista de fichas, alertas e cuidados destacados, e a ficha completa (com impressão em PDF pelo navegador)

**Próximas etapas (ainda não estão no código)**: evolução diária com fotos e sinais vitais, link de evolução para o paciente, exportar todas as evoluções em PDF, conversa com a assistente de IA.

> As perguntas de segurança das técnicas novas (quiropraxia, massagem, eletroterapia, pilates) são sugestões. Revise clinicamente em `lib/ficha.js` antes de usar com pacientes.

---

## Como colocar no ar (passo a passo)

### 1. Supabase (banco de dados e login)
1. Crie uma conta em supabase.com → **New project** → região **South America (São Paulo)**.
2. Abra **SQL Editor → New query**, cole todo o conteúdo de `supabase/schema.sql` e clique em **Run**.
3. Em **Authentication → Email Templates → Magic Link**, troque o texto para mostrar o código, por exemplo:
   `Seu código para entrar no FichaPronta: {{ .Token }}`
   (sem isso, o e-mail chega com um link em vez do código de 6 dígitos).
4. Login com Google (opcional no começo): em **Authentication → Providers → Google**, siga as instruções do Supabase para criar as credenciais no Google Cloud.
5. Em **Project Settings → API**, copie a **Project URL** e a **anon public key**.

### 2. GitHub (onde o código fica)
1. Crie uma conta em github.com → **New repository** → nome `fichapronta`.
2. Envie os arquivos desta pasta para o repositório (pelo botão **Add file → Upload files** já funciona).

### 3. Vercel (o site no ar)
1. Entre em vercel.com com a conta do GitHub → **Add New → Project** → escolha `fichapronta`.
2. Em **Environment Variables**, cadastre:
   - `NEXT_PUBLIC_SUPABASE_URL` = a Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = a anon public key
3. Clique em **Deploy**. Sai um endereço como `fichapronta.vercel.app`.
4. Volte ao Supabase em **Authentication → URL Configuration** e coloque esse endereço em **Site URL** e em **Redirect URLs** (`https://fichapronta.vercel.app/**`).

### 4. Domínio próprio (opcional)
Na Vercel, **Settings → Domains** → adicione seu domínio e copie os dados de DNS para o Registro.br. Depois atualize as URLs no Supabase (passo 3.4).

---

## Rodar no seu computador (opcional)
Precisa do Node.js 18 ou mais novo.
```
npm install
cp .env.example .env.local   # e preencha os dois valores
npm run dev
```
Abra http://localhost:3000

## Onde fica cada coisa
- `lib/ficha.js` — todas as perguntas, técnicas e regras de alerta
- `app/f/[token]` — a ficha que o paciente responde
- `app/painel` — lista de fichas e detalhe
- `app/configurar` — escolha das técnicas
- `supabase/schema.sql` — tabelas e regras de segurança (cada profissional só vê os próprios pacientes)

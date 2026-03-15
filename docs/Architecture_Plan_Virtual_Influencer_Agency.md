# Plano de Arquitetura de Software - Sintetix AI

## 1. Stack Tecnológica
*   **Frontend:** [Next.js 14+](https://nextjs.org/) (App Router) - Para SSR, SEO e performance.
*   **Linguagem:** TypeScript - Para segurança de tipos e manutenibilidade.
*   **Estilização:** Tailwind CSS + [Shadcn/UI](https://ui.shadcn.com/) - Para uma interface premium e consistente.
*   **Backend & Banco de Dados:** [Firebase](https://firebase.google.com/)
    *   **Cloud Firestore:** Banco de dados NoSQL flexível e em tempo real.
    *   **Firebase Authentication:** Autenticação de usuários segura.
    *   **Firebase Storage:** Armazenamento de imagens e mídias pesadas.
    *   **Cloud Functions:** Para integrações com APIs de IA e processamento intensivo.
*   **Gerenciamento de Estado:** Server Actions (Next.js) + Zustand + React Query (para sincronização com Firestore).

## 2. Modelagem de Dados (Entidades Principais)

### Influencers (table: `influencers`)
- `id`: uuid (PK)
- `name`: text
- `date_of_birth`: date
- `bio_data`: jsonb (backstory, traumas, dreams)
- `demographics`: jsonb (location, blood_type, height, weight)
- `personality`: jsonb (archetype, introvert_extrovert_scale)
- `tone_of_voice`: text
- `expression_dictionary`: jsonb (grammar_rules, regionalisms, forbidden_terms)
- `agency_id`: uuid (FK)

### Galeria Visual (table: `visual_assets`)
- `id`: uuid (PK)
- `influencer_id`: uuid (FK)
- `url`: text
- `type`: enum (anchor, general)
- `metadata`: jsonb (lighting, environment)

### Guarda-Roupa (table: `wardrobe_items`)
- `id`: uuid (PK)
- `influencer_id`: uuid (FK)
- `name`: text
- `image_url`: text
- `prompt_details`: text
- `observations`: text
- `category`: text (top, bottom, accessory)

### Prompts (table: `prompt_library`)
- `id`: uuid (PK)
- `influencer_id`: uuid (FK)
- `positive_prompt`: text
- `negative_prompt`: text
- `tags`: text[] (studio, outdoor, night)

### Tarefas e Calendário (table: `content_tasks`)
- `id`: uuid (PK)
- `influencer_id`: uuid (FK)
- `title`: text
- `platform`: enum (instagram, tiktok, twitter)
- `scheduled_at`: timestamp
- `status`: enum (planning, generating, revision, ready, posted)
- `final_image_url`: text
- `prompt_used`: text
- `observations`: text

### Comercial (tables: `partners`, `campaigns`, `deliverables`)
- **partners:** `id`, `name`, `contact_email`, `contracts_url`.
- **campaigns:** `id`, `partner_id`, `influencer_id`, `title`, `budget`.
- **deliverables:** `id`, `campaign_id`, `type`, `due_date`, `is_completed`, `metrics` (jsonb).

## 3. Arquitetura de Interface (UX)

### Componente de Contexto Persistente
Utilizaremos um **Provider de Contexto** no React para manter o `SelectedInfluencerID` global. Isso permite que, ao trocar de influencer no menu lateral, todos os módulos (Identidade, Galeria, Tarefas) se atualizem instantaneamente sem recarregar a página (Client-side transition).

### Layout em "Grade Moodboard"
O Dashboard principal utilizará CSS Grid dinâmico para destacar as imagens geradas, aplicando filters de glassmorphism nos cards de dados para manter o aspecto "High-Tech".

### Coleções Firestore
- `influencers`: Documentos contendo bio, demográficos, personalidade e dicionário.
- `visual_assets`: Documentos com referências de imagem no Storage.
- `wardrobe`: Itens de roupa com prompts e obs.
- `tasks`: Tarefas do calendário com status e resultados.
- `campaigns`: Dados comerciais e deliverables.

## 4. Estratégia de Escalabilidade
1.  **Segurança:** Firebase Security Rules para isolar dados por agência.
2.  **Otimização:** Uso de thumbnails geradas via Cloud Functions para galerias.

---
**Instrução para Desenvolvimento:**
O sistema deve ser construído como a "Unique Source of Truth". Cada campo biográfico ou prompt salvo deve ser versionado para garantir que a persona evolua consistentemente ao longo do tempo.

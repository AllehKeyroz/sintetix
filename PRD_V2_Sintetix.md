# PRD - Sintetix AI V2 (Plataforma de Gestão e Geração de Influenciadores Virtuais)

## 1. Visão Geral do Produto
O **Sintetix AI V2** é a evolução da plataforma SaaS idealizada para atuar como o "cérebro central" e a "fonte única de verdade" de agências que gerenciam influenciadores virtuais. O grande diferencial desta nova versão (V2) é a **desacoplagem completa do serviço nordy.ai**. A plataforma passa a ser uma solução agnóstica e independente, preparada para integrar com múltiplos provedores de inteligência artificial (como OpenAI, Anthropic, Midjourney, Stable Diffusion, etc.) ou atuar estritamente como o orquestrador central e repositório de estado das personas. 

O foco central continua sendo garantir **consistência narrativa, visual e comercial** em múltiplas personalidades sintéticas operadas por equipes multidisciplinares.

## 2. Objetivos Principais da V2
- **Agnosticismo de IA:** Remover qualquer dependência sistêmica do nordy.ai. O sistema gerenciará os prompts e os assets, enviando-os para os motores de geração de preferência (via APIs ou fluxos externos).
- **Fonte Única de Verdade (Single Source of Truth):** Centralizar e versionar detalhes biográficos, atributos físicos e de personalidade.
- **Escalabilidade:** Suporte a múltiplas agências e dezenas de influenciadores virtuais sob um mesmo painel (Multi-tenant).
- **Eficiência e Consistência:** Prevenir "alucinações de personagem" (trocas bruscas de aparência, inconsistências na voz ou estilo) através de regras estritas e referências cruzadas de prompts.

## 3. Módulos e Funcionalidades Core

### 3.1. Módulo de Identidade ("O Motor de Vida")
- **Perfil Biográfico Profundo:** Controle de backstory, traumas, histórico de vida, sonhos e formação profissional.
- **DNA Demográfico e Visual:** Data de nascimento, modelo/arquétipo base, características físicas estritas (altura, peso, tipo de corpo, traços distintivos).
- **Dicionário de Voz (LLM Instructions):** 
  - Regras lógicas e de estilo de fala.
  - Expressões regionais mapeadas.
  - Termos proibidos (blocklist) para garantir brand safety.
- **Matriz de Personalidade:** Posicionamento em escalas (Ex: Racional vs Emocional, Introvertido vs Extrovertido).

### 3.2. Galeria de Referência e Asset Management
- **Fotos Âncora (Anchor Photos):** Repositório de rostos/corpos oficiais imutáveis usados como referência (ControlNet/Roop/IPAdapter) para a geração de imagens.
- **Cofre de Prompts:** Biblioteca de prompts testados e validados, separados por tipo de iluminação, ambiente e estilo. Inclui repositório central de prompts positivos e negativos primários.
- **Guarda-Roupa Virtual:**
  - Inventário de peças e acessórios (Top, Bottom, Acessórios).
  - Cada peça atrelada a uma imagem real do item, palavras-chave exatas de prompt necessárias para criá-lo, e regras de uso (Ex: "Apenas para campanhas esportivas").

### 3.3. Planejamento de Conteúdo e Social Scheduler
- **Calendário Cross-Platform:** Visão de publicações programadas para Instagram, TikTok, X, etc.
- **Fluxo de Produção Criativa (Kanban de Status):** *Planejamento -> Gerando -> Revisão Interna -> Pronto -> Agendado -> Publicado*.
- **Task & Asset Linking:** Associação direta entre uma postagem de calendário e os prompts, imagens geradas finais, e sementes (seeds) relacionadas.
- **Diário de Insights:** Área de notas sobre engajamento e sentimentos dos seguidores, alimentando a evolução da persona.

### 3.4. Gestão Comercial (CRM)
- **Gestão de Parcerias:** Cadastro de marcas contratantes (Sponsors) e contatos.
- **Controle de Deliverables:** Acompanhamento granular do que foi contratado vs. o que foi entregue (Ex: 2 Reels, 3 Stories).
- **Métricas:** Input de dados métricos pós-campanha para elaboração de ROI e relatórios para anunciantes.

## 4. Requisitos de Interface (UI/UX)
- **Navegação High-Tech e Premium:** Interface construída com Tailwind CSS e Shadcn/UI, priorizando um modo escuro (Dark Mode) sofisticado ou glassmorphism.
- **Troca Simples de Perfil (Global State):** Um seletor de persona flutuante ou menu lateral permanente que altera completamente o contexto do aplicativo (dados, fotos, tarefas) sem refresh (Single Page Application UX).
- **Layout Moodboard:** Visualização baseada predominantemente em imagens (Grid CSS), pois o produto é altamente visual.

## 5. Arquitetura e Tech Stack (Base do Novo Sistema)
- **Frontend:** Next.js 14+ (App Router), TypeScript.
- **Estilização:** Tailwind CSS + Shadcn/UI.
- **Gerenciamento de Estado:** Zustand e React Query.
- **BaaS (Backend as a Service):** Firebase
  - *Firestore:* Banco de dados NoSQL para as coleções (Influencers, Visual_Assets, Wardrobe, Tasks, Campaigns).
  - *Storage:* Hospedagem de imagens de alta resolução.
  - *Authentication:* Controle de acesso SSO.
- **Infraestrutura AI (V2):** O sistema atuará enviando Webhooks ou consumindo APIs externas (OpenAI para texto, Replicate/RunPod/Midjourney API para imagens) em substituição à dependência prévia do nordy.ai. Modelos customizados da agência poderão ser orquestrados através do Next.js Server Actions e Cloud Functions.

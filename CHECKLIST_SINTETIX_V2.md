# Checklist de Execução - Sintetix AI V2

Este documento detalha o plano de desenvolvimento em ordem cronológica de execução, bem como as funcionalidades esperadas para cada página da aplicação, integrando os serviços Firebase e Comfy.icu.

---

## FASE 1: Setup e Configuração da Infraestrutura Base
- [ ] 1.1 Iniciar projeto Next.js 14 (App Router) com TypeScript, Tailwind CSS, ESLint e Prettier.
- [ ] 1.2 Instalar e configurar **Shadcn UI** (Adicionar componentes chave: Button, Input, Form, Card, Dialog, Select, Dropdown, Tabs).
- [ ] 1.3 Configurar **Firebase** (SDK Client e Admin).
  - Configurar Firebase Authentication (E-mail/Senha).
  - Configurar Cloud Firestore (Rules iniciais de segurança).
  - Configurar Firebase Storage (Upload de imagens/arquivos).
- [ ] 1.4 Configurar estado global rápido com **Zustand** (ex: `ActiveInfluencerStore`).
- [ ] 1.5 Estruturar Layout Global (Sidebar de navegação fixa, Topbar, Theme Toggle para Dark/Light Mode).

---

## FASE 2: Sistema de Múltiplos Influenciadores e Autenticação
- [ ] 2.1 **Página: `/login` e `/register`**
  - Formulário seguro padrão de autenticação.
  - Redirecionamento protegido via Middleware do Next.js.
- [ ] 2.2 **Sidebar de Navegação Global (Contexto)**
  - Dropdown ou Menu para alternar o "Influenciador Ativo". Essa ação mudará o contexto visualizado em todas as rotas filhas.
- [ ] 2.3 **Página: `/influencers` (Dashboard Hub)**
  - Lista de todos os influenciadores virtuais criados pela agência.
  - Função: Criar novo Influenciador (abre formulário).
  - Função: Arquivar/Desativar um perfil.

---

## FASE 3: Módulo de Identidade (O Motor de Vida)
- [ ] 3.1 **Página: `/[influencerId]/identity` (Perfil e DNA)**
  - **Função - Dados Base:** Formulário com Backstory, Data de Nascimento, Traumas, Sonhos e Arquétipo.
  - **Função - Características Físicas:** Salvar informações demográficas estritas (Peso, Altura, Etnia, Cor de Cabelo/Olhos). Estas atuarão como *tags persistentes* obrigatórias nos metadados.
  - **Função - Matriz de Personalidade:** Sliders (ex: 0 a 100) para Extroversão, Racionalidade vs Emoção.
  - **Função - Dicionário de Voz:** Adicionar palavras de bloqueio (Blocklist), e cadastrar termos/gírias regionais.

---

## FASE 4: Galeria Visual, Assets e Motor de Geração (Integração Comfy.icu)
Nesta fase, integraremos o motor de geração de imagens. O Comfy.icu usa `workflow_id` e execuções via REST API.

- [ ] 4.1 **Página: `/[influencerId]/gallery` (Fotos Âncora e Gerador)**
  - **Função - Rostos/Fotos Âncora:** Upload direto para o Firebase Storage de fotos que servem de base (ControlNet/Roop).
  - **Função - Cofre de Prompts:** Tabela CRUD contendo prompts positivos e negativos validados para aquele influencer.
  - **Função - Painel de Geração (UI):** Formulário de input para novo conteúdo. O usuário seleciona foto base (Opcional), prompt validado + prompt livre.
- [ ] 4.2 **Integração API Comfy.icu (Motor Core)**
  - **Função (Route Handler `/api/generate`):** Enviar POST com `workflow_id`, `prompt` adaptado, e array de `files` (caso a foto âncora tenha sido importada como referência por URL).
  - **Função (Route Handler `/api/webhook/comfy`):** Criar um webhook no Next.js para que o Comfy.icu faça um POST de volta (ou fallback via Web-Polling) alterando o status no Firestore (`em_gerando` -> `concluido`) e armazenando o output/link no banco.
- [ ] 4.3 **Página: `/[influencerId]/wardrobe` (Guarda-Roupa)**
  - **Função - Gestão de Peças:** Criar, editar, excluir (Top, Bottom, Acessório).
  - **Função - Metadatos de Prompts:** Salvar gatilhos de texto exatos que ativam cada roupa para injeção posterior na geração.

---

## FASE 5: Social Scheduler e Operações
- [ ] 5.1 **Página: `/[influencerId]/tasks` (Planejamento e Tarefas)**
  - **Função - Kanban/Calendário:** Visualizar cards de Posts com status dinâmicos (*Planejamento, Em Geração, Revisão, Pronto, Postado*).
  - **Função - Criar Tarefa:** Vincular uma rede social, selecionar referências de guarda-roupa, e escrever a direção de arte.
  - **Função - Geração em Linha:** Possibilidade de rodar a API de Comfy.icu *de dentro da tarefa* sem sair da página, e o asset cair automaticamente dentro daquele Card após o webhook avisar.
  - **Função - Diário de Insights:** Campo focado em adicionar feedbacks após o post ser feito ("Seguidores acharam as roupas muito repetitivas", etc.)

---

## FASE 6: CRM Comercial (Gestão de Parcerias)
- [ ] 6.1 **Página: `/partners`**
  - Centralizado, independente do tipo de Influenciador.
  - **Função:** CRUD de Marcas / Clientes contratantes.
- [ ] 6.2 **Página: `/campaigns`**
  - **Função - Vincular Deliverables:** Associação entre Marca -> Influenciador ID -> "N" entregáveis.
  - Ex: Criar campanha "Natal Coca-Cola" com 3 entregáveis (2 Reels e 1 Storie) atrelados à influencer "Malu".
  - **Função - Mapeamento de Faturamento:** Inserir métricas combinadas ao longo do mês para a agência gerenciar os pagamentos.

---

## FASE 7: Acabamento e Implantação
- [ ] 7.1 Refino visual de UI/UX (Ajustar paleta dark mode premium, Microinterações Framer Motion, ou CSS transitions padrão).
- [ ] 7.2 Tratamento de Erros de Geração (ex: Comfy.icu rejeitou Job, GPU error).
- [ ] 7.3 Deploy no Vercel/Firebase Hosting.
- [ ] 7.4 Testes end-to-end básicos do fluxo de Geração.

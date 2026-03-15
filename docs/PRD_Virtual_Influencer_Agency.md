# PRD - Plataforma de Gestão de Agência de Influenciadores Virtuais (Sintetix AI)

## 1. Visão Geral do Produto
O **Sintetix AI** é uma plataforma SaaS projetada para ser o "cérebro central" de agências que gerenciam influenciadores virtuais. O sistema foca em garantir a **consistência narrativa, visual e comercial**, permitindo que equipes multidisciplinares operem múltiplas personalidades sintéticas sem perder a essência ou a continuidade de cada personagem.

## 2. Objetivos Principais
- **Fonte Única de Verdade:** Centralizar todos os detalhes biográficos e visuais.
- **Escalabilidade:** Permitir a gestão de dezenas de influenciadores simultâneos.
- **Eficiência Operacional:** Automatizar o fluxo de postagens e controle de parcerias.
- **Consistência de Marca:** Evitar erros de caracterização (troca de roupa inconsistente, tom de voz errado).

## 3. Módulos e Funcionalidades

### 3.1. Módulo de Gestão de Identidade ("O Motor de Vida")
*   **Perfil Biográfico Profundo:** 
    *   Campos para: História de vida (backstory), traumas, sonhos, estilo de fala, nível de escolaridade e tom de voz.
*   **Dicionário de Expressões da Persona (Camada LLM):**
    *   Regras Lógicas de Texto: Definição de regras gramaticais específicas (ex: "Plural Reduzido").
    *   Regionalismos Preferenciais: Lista de gírias e expressões regionais para evitar tom formal de "telejornal".
    *   Termos Proibidos: Palavras que a persona jamais utilizaria.
*   **Dados Demográficos:** 
    *   Data de nascimento (e signo automático), localização atual, altura, peso, tipo sanguíneo e preferências alimentares.
*   **Atributos de Personalidade:** 
    *   Seleção de Arquétipo (ex: O Criador, O Inocente).
    *   Escalas Dinâmicas: Introversão vs. Extroversão, Lógico vs. Emocional, etc.

### 3.2. Galeria de Referência e Consistência Visual
*   **Álbuns de Referência (Anchor Photos):** Repositório de imagens que definem o rosto oficial em diferentes ângulos.
*   **Biblioteca de Prompts:** 
    *   Categorização por iluminação (Golden Hour, Studio, Neon).
    *   Prompts Positivos e Negativos específicos por modelo.
*   **Guarda-Roupa Virtual:** 
    *   Inventário de peças (ex: "Jaqueta de Couro Preta").
    *   Cada item contém: Upload de imagem real da peça, Descrição detalhada, Prompt/LoRA usado para geração e Observações de uso (ex: "Usar apenas em ambientes noturnos").

### 3.3. Planejador Social e Dashboard de Tarefas
*   **Calendário de Conteúdo:** Grade visual com integração para Instagram, TikTok e X (Twitter).
*   **Gestão de Posts no Planejador:**
    *   Upload de Fotos Geradas: Espaço para armazenar a versão final/variantes.
    *   Biblioteca de Prompts do Post: Armazenar o prompt exato usado para aquela foto específica.
    *   Observações da Postagem: Notas sobre performance ou ajustes necessários em futuras gerações similares.
*   **Ações Imediatas (To-Do):** Lista de pendências por influenciador (ex: "Bella: Produzir foto para marca X").
*   **Status de Produção:** Fluxo de estados: *Em Planejamento -> Em Geração -> Revisão -> Pronto -> Agendado -> Postado*.

### 3.4. Gestão de Parcerias e CRM Comercial
*   **Módulo de Parceiros:** Cadastro de marcas e contatos diretos.
*   **Controle de Deliverables:** Checkbox de entregas contratadas (ex: 3 Stories, 1 Reels).
*   **Métricas de Performance:** Importação de dados (alcance, engajamento) para geração de relatórios de campanha.

## 4. Requisitos de Interface (UI/UX)
*   **Troca Rápida de Perfil:** Menu lateral persistente para alternar entre influencers com um clique.
*   **Visualização Moodboard:** Dashboard principal focado em imagens, não apenas texto.
*   **Diário de Insights:** Campo de notas livres para registrar interações marcantes com seguidores (importante para o desenvolvimento da "alma" da personagem).

## 5. Requisitos Não-Funcionais
*   **Segurança:** Controle de acesso baseado em roles (Admin, Criador, Gestor de Tráfego).
*   **Performance:** Carregamento ultra-rápido de galerias de alta resolução.
*   **Escalabilidade:** Arquitetura pronta para suportar múltiplos anexos de mídia pesada.

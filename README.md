# LLMIDIA Central Financeira

Sistema financeiro e administrativo interno do grupo **LL Mídia**, construído para substituir o fecho financeiro mensal feito em folhas de cálculo.

O grupo é composto por duas empresas brasileiras, 100% remotas: **LL Mídia** (principal) e **Infoeditora**. A moeda de reporte é **BRL**. As vendas de cursos são feitas sobretudo para alunos em Portugal (pagamento em EUR, liquidação em USD pela plataforma e conversão para BRL), com algumas vendas diretas recebidas em EUR via Wise. Contas principais: Itaú (BRL) e Wise (EUR/BRL); existem ainda Santander, Payoneer, XP (investimento), saldo de plataforma e contas de sócios.

Sócios: Luciano (80% LL Mídia, 50% Infoeditora) e Alan (20% LL Mídia, 50% Infoeditora).

> Integrações legadas herdadas do projeto de origem (Hubla, Marvee e Metabase) estão desativadas pela flag `legacy_integrations_enabled` em `financial_config`. O código e as tabelas foram mantidos, mas estão escondidos da interface enquanto a fonte de dados migra para Hotmart/Wise.

## Stack

React 18 + Vite 5 + TypeScript + Tailwind CSS + shadcn/ui, com backend Lovable Cloud (Postgres, Auth, Storage e Edge Functions).

## Módulos e rotas

### Geral
| Rota | Descrição |
| --- | --- |
| `/` e `/regras` | Instruções e regras internas |
| `/auth` | Login e registo |
| `/reset-password` | Redefinição de palavra-passe |
| `/solicitacoes` | Solicitações do colaborador (reembolsos, devoluções, materiais, contratos) |
| `/notas-fiscais` | Envio e acompanhamento de notas fiscais |

### Administração (`/admin`)
| Rota | Descrição |
| --- | --- |
| `/admin/aprovacoes` | Fila de aprovações |
| `/admin/colaboradores` | Gestão de colaboradores e permissões |
| `/admin/equipamentos` | Inventário de equipamentos |
| `/admin/automacoes` | Automações e relatórios agendados |
| `/admin/ferramentas` | Ferramentas e centros de custo |
| `/admin/modelos-contrato` | Modelos de contrato |

### Financeiro (`/financeiro`)
| Rota | Descrição |
| --- | --- |
| `/financeiro/planejamento` | Planeamento mensal (receitas, despesas, impostos, taxa da plataforma) |
| `/financeiro/analise-financeira` | KPIs, tendências, comparações e projeções |
| `/financeiro/impostos` | Regime de impostos e simulador (Lucro Presumido) |
| `/financeiro/metas-vendas` | Metas de vendas e simulador de cenários |
| `/financeiro/bonus` | Cálculo de bónus |
| `/financeiro/orcado-realizado` | Receitas e despesas: orçado × realizado |
| `/financeiro/parcelamento` | Dashboard de parcelamentos (fonte de dados em migração) |
| `/financeiro/marvee-test` | Integração legada, bloqueada pela flag |

Páginas existentes mas fora da navegação: Fluxo de Caixa e Distribuição de Lucros (código mantido).

No topo do módulo Financeiro existe um **seletor de empresa** (LL Mídia, Infoeditora, Grupo consolidado), guardado no `EmpresaContext`. Nesta fase a escolha ainda não filtra dados.

## Papéis (`app_role`)

| Papel | Acesso |
| --- | --- |
| `admin` | Acesso total, incluindo gestão de colaboradores e empresas |
| `admin_viewer` | Leitura das áreas administrativas |
| `finance` | Gestão do módulo financeiro |
| `finance_viewer` | Leitura do módulo financeiro |
| `approver_notas` | Aprovação de notas fiscais |
| `approver_reembolsos` | Aprovação de reembolsos |
| `approver_devolucoes` | Aprovação de devoluções |
| `approver_materiais` | Aprovação de pedidos de material |
| `user` | Colaborador: apenas as próprias solicitações |

Os papéis vivem na tabela `user_roles` e são verificados pelas funções `has_role`, `can_view_finance` e `can_manage_finance`.

## Edge functions e segredos

Todas usam `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` fornecidos automaticamente, exceto quando indicado.

| Função | Segredos adicionais |
| --- | --- |
| `assign-admin-role` | — |
| `cleanup-colaboradores` | — |
| `import-colaboradores` | — |
| `reset-user-password` | — |
| `manage-automation` | `SUPABASE_ANON_KEY` |
| `discord-notify` | `DISCORD_WEBHOOK_URL` |
| `discord-daily-report` | `DISCORD_WEBHOOK_URL`, `DISCORD_WEBHOOK_URL_2`, `DISCORD_WEBHOOK_URL_3` |
| `generate-contract` | `AUTENTIQUE_API_TOKEN` |
| `extract-cnpj-data` | `LOVABLE_API_KEY` |
| `planning-insights` | `LOVABLE_API_KEY` |
| `google-drive-import` | `GOOGLE_SERVICE_ACCOUNT_KEY` |
| `google-drive-export` | `GOOGLE_SERVICE_ACCOUNT_KEY` |
| `google-drive-export-reembolsos` | `GOOGLE_SERVICE_ACCOUNT_KEY` |
| `hubla-webhook` *(legado)* | `HUBLA_WEBHOOK_SECRET` |
| `marvee-api-test` *(legado)* | `MARVEE_API_URL`, `MARVEE_CLIENT_ID`, `MARVEE_CLIENT_SECRET` |
| `marvee-sync`, `marvee-sync-raw`, `marvee-sync-detailed`, `marvee-sync-extrato` *(legado)* | `MARVEE_API_URL`, `MARVEE_CLIENT_ID`, `MARVEE_CLIENT_SECRET` |
| `marvee-discover-categories`, `marvee-discover-cost-centers` *(legado)* | `MARVEE_API_URL`, `MARVEE_CLIENT_ID`, `MARVEE_CLIENT_SECRET` |
| `marvee-consolidate-extrato` *(legado)* | — |
| `metabase-sync-parcelamento` *(legado)* | `SUPABASE_ANON_KEY` |

Funções agendadas validam o pedido com `LOVABLE_CRON_SECRET` (`supabase/functions/_shared/cron-auth.ts`).

Outros segredos configurados no projeto: `EVOLUTION_API_KEY`, `EVOLUTION_API_URL`, `EVOLUTION_INSTANCE`, `WHATSAPP_WEBHOOK_TOKEN`, `OMIE_APP_KEY`, `OMIE_APP_SECRET`, `BOOTSTRAP_ADMIN_TOKEN`.

## Base de dados

O estado completo do schema (tabelas, enums, funções, triggers, views, RLS, grants e buckets) está versionado em `supabase/migrations/`, permitindo recriar a base do zero.

## Correr localmente

```sh
npm i
npm run dev
```

A app arranca em `http://localhost:8080`. As variáveis do cliente estão em `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`).

## Roadmap

- **Fase 0 (concluída):** versionamento do schema, isolamento das integrações legadas, empresas do grupo e documentação.
- **Fase A:** lançamentos e regras de classificação.
- **Fase B:** importação de extratos e faturas.
- **Fase C:** vendas Hotmart e Wise.
- **Fase D:** resultado mensal automático.
- **Fase E:** sócios e conta-corrente.
- **Fase F:** DRE anual.

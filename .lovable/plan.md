

# Integração com Metabase para Parcelamento Inteligente

## Descoberta

A API pública do Metabase em `https://hubla.metabaseapp.com/api/public/dashboard/b9dca3ff-466a-4626-b0e2-4d7845c6979f` retorna os metadados do dashboard (cards, IDs, configurações). Os dados de cada card podem ser obtidos via POST em `/api/public/dashboard/{uuid}/dashcard/{dashcard_id}/card/{card_id}`.

O dashboard contém pelo menos estas análises:
- **Análise 1**: GMV por status (sem cancelado)
- **Análise 2**: GMV atrasado por mês
- **Análise 3**: GMV por status (com cancelado) + Faturas por status
- **Análise 4**: Atrasado por método de pagamento
- **Tabela de Devedores**: Valor atrasado por aluno

## Plano

### 1. Criar tabela `parcelamento_dashboard_data`
Tabela para armazenar snapshots dos dados do Metabase:
- `id`, `card_name` (texto identificador), `card_data` (JSONB com os resultados), `synced_at`, `created_at`
- RLS: leitura para admin/finance/finance_viewer; escrita para admin/finance

### 2. Criar Edge Function `metabase-sync-parcelamento`
- Faz GET na API pública do dashboard para descobrir dashcard IDs e card IDs
- Faz POST em cada card para obter os dados tabulares
- Upsert dos resultados na tabela `parcelamento_dashboard_data` (por card_name)
- Sem necessidade de API key (dashboard é público)

### 3. Criar hook `useParcelamentoDashboardData`
- Busca dados da tabela `parcelamento_dashboard_data`
- Transforma o JSONB em arrays tipados para os gráficos
- Fallback para dados hardcoded caso a tabela esteja vazia

### 4. Atualizar componentes das 5 abas
- Substituir imports de `data.ts` pelo hook
- Manter cálculos de KPIs derivados (taxa inadimplência, crescimento, etc.)
- Manter todo o layout e design atual

### 5. Adicionar botão "Sincronizar" na página
- Botão que invoca a Edge Function manualmente
- Mostra timestamp da última sincronização

## Detalhes técnicos

A Edge Function fará:
```
GET https://hubla.metabaseapp.com/api/public/dashboard/{uuid}
→ extrai dashcards[].id e dashcards[].card.id e dashcards[].card.name

POST https://hubla.metabaseapp.com/api/public/dashboard/{uuid}/dashcard/{dc_id}/card/{card_id}
Body: { parameters: [] }
→ retorna { data: { rows: [...], cols: [...] } }
```

Os dados retornados serão mapeados para o formato atual (gmvData, inadimplenciaData, etc.) dentro do hook no frontend.


# TXAPP Prompts Reutilizáveis

Prompts prontos para usar com IA (OpenCode / Claude Code / Cursor) para cada módulo.

## Como usar

1. Copie o prompt relevante
2. Substitua os placeholders entre `[ ]`
3. Execute no terminal com: `opencode "cole o prompt aqui"`

---

## Prompt: Criar nova cidade

```
Criar configuração para a cidade de [NOME_DA_CIDADE], [PAÍS].

Adicionar em src/lib/config/cities.ts:
- Código do país: [CODE]
- Nome: [NOME]
- Fuso horário: [TIMEZONE]
- Locale: [LOCALE]
- Moeda: [CURRENCY]
- Símbolo: [SYMBOL]
- Idioma: [LANGUAGE]
- Código telefônico: [PHONE_CODE]
- Preços base: [BASE_FARE], [PRICE_PER_KM], [PRICE_PER_MIN]
- Categoria de veículos disponíveis: [CATEGORIES]
- Documentos necessários: [DOCUMENTS]
- Métodos de pagamento: [PAYMENTS]
- Regras de comissão: [COMMISSION]
- Regras de surge: [SURGE]

Seguir o padrão das cidades existentes. Não alterar nenhuma outra cidade.
Executar `npx next build` para verificar que não há erros.
```

## Prompt: Implementar módulo

```
Implementar o módulo [NOME_DO_MODULO] conforme especificação em .ai/[ARQUIVO].md.

Seguir a ordem de passos definida no arquivo. Não pular etapas.
Criar todos os arquivos necessários em:
- src/lib/[modulo]/ (services, types)
- src/lib/components/ (React components)
- src/app/[rota]/ (pages)

Usar os mesmos padrões dos módulos existentes:
- "use client" em componentes
- framer-motion para animações
- lucide-react para ícones
- Tema escuro (#121212 bg, #3ECB8E primary)
- i18n para textos (15 idiomas)
- Tratamento de loading, empty, error states

Após criar, executar `npx next build` e corrigir qualquer erro.
Atualizar .ai/ROADMAP.md e .ai/CHANGELOG.md.
```

## Prompt: Corrigir erro de build

```
O build está falhando com o erro abaixo:

[COLE O ERRO AQUI]

Analisar a causa raiz e corrigir. Após corrigir, executar `npx next build` para confirmar que passa.
Não fazer nenhuma outra alteração além da correção necessária.
```

## Prompt: Adicionar idioma

```
Adicionar o idioma [IDIOMA] ([CODE]) ao sistema de i18n.

1. Adicionar em src/lib/i18n/translations.ts:
   - [CODE]: { ... } com todas as chaves de tradução (seguir estrutura das ~200 chaves existentes)
2. Adicionar em src/lib/i18n/config.ts:
   - locale [CODE]
   - name "[IDIOMA]"
   - flag "emoji"
   - dir "ltr" (ou "rtl" se aplicável)
3. Registrar no locale switcher

Usar tradução automática para preencher as chaves baseadas no português.
Executar `npx next build` para verificar.
```

## Prompt: Executar fase completa

```
Executar a FASE ATUAL definida em .ai/NEXT_TASK.md.

Seguir estritamente a ordem dos passos. Não pular etapas.
Após cada passo, validar com `npx next build`.
Ao final, atualizar .ai/ROADMAP.md e .ai/CHANGELOG.md.
```

## Prompt: Análise de código

```
Analisar o arquivo [CAMINHO_DO_ARQUIVO] e identificar:
1. Problemas de performance
2. Problemas de segurança
3. Violações de padrões do projeto (tema escuro, i18n, etc.)
4. Código duplicado
5. Falta de tratamento de erros
6. Oportunidades de melhoria

Sugerir correções específicas.
```

---

## Dicas

- Sempre iniciar com `.ai/EXECUTION_RULES.md` lido como contexto
- Sempre finalizar com `npx next build` para validar
- Manter prompts específicos, nunca genéricos
- Incluir caminhos de arquivos e exemplos de código

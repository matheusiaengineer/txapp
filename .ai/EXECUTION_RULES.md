# Regras de Execução para IA

## Obrigatório

1. **Nunca criar código duplicado.** Sempre reutilizar componentes, serviços e tipos existentes.
2. **Nunca alterar arquitetura.** Seguir a estrutura de pastas e padrões estabelecidos.
3. **Nunca quebrar compatibilidade.** Toda alteração deve ser retrocompatível.
4. **Sempre atualizar documentação.** Todo módulo criado deve ter sua especificação em `.ai/`.
5. **Executar uma fase por vez.** Só iniciar a próxima quando a anterior estiver 100% concluída.
6. **Executar testes.** `npx next build` deve passar sem erros de type checking.
7. **Corrigir erros.** Bugs são prioridade máxima — não avançar com erros conhecidos.
8. **Atualizar ROADMAP.md.** Manter o roadmap refletindo o progresso real.
9. **Atualizar CHANGELOG.md.** Registrar toda alteração relevante.
10. **Usar configuração via banco de dados.** Toda regra de negócio deve ser armazenada em tabelas, não no código.
11. **Nunca chamar Google Maps diretamente.** Sempre usar Mobility Engine como camada de abstração.
12. **Nunca pular etapas.** Seguir a ordem definida no NEXT_TASK.md rigorosamente.

## Fluxo de trabalho

1. Ler `.ai/NEXT_TASK.md` para identificar a tarefa atual
2. Ler `.ai/MASTER_VISION.md` para alinhamento arquitetural
3. Executar PASSO a PASSO seguindo a especificação
4. Validar com `npx next build`
5. Atualizar `.ai/CHANGELOG.md`
6. Atualizar `.ai/ROADMAP.md`
7. Fazer commit semântico (se solicitado)

## Convenções de código

- Componentes React: `"use client"`, framer-motion para animações, lucide-react para ícones
- Dark theme: bg `#121212`, primary `#3ECB8E`, glassmorphism, neon glow
- Nenhuma UI library externa além de framer-motion + lucide-react + Tailwind
- Tipos estritos do TypeScript, interfaces em arquivos separados
- Toda chamada de mapa via Mobility Engine (nunca Google Maps direto)
- Traduções via I18nProvider (15 idiomas, RTL para árabe)
- Componentes reutilizáveis em `src/lib/components/`

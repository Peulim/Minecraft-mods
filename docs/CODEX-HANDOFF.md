# Continuação do Rune em outro computador

O código, os testes, a documentação e o histórico Git são a fonte principal de
contexto do projeto. Não é necessário copiar toda a conversa para uma nova
sessão do Codex.

## Transferência rápida

1. Baixe este repositório como ZIP (ou publique-o em um repositório Git e use
   `git clone`).
2. Extraia e abra a pasta raiz do projeto no terminal ou no VS Code.
3. Instale e autentique o Codex CLI conforme a documentação oficial atual da
   OpenAI.
4. Inicie o Codex na raiz do projeto:

   ```bash
   codex
   ```

5. Cole o prompt de retomada abaixo. O agente deverá ler o próprio repositório
   antes de alterar qualquer arquivo.

## Prompt de retomada para copiar

```text
Continue o desenvolvimento deste projeto Rune a partir do estado atual do
repositório.

Antes de alterar qualquer coisa:
1. leia todos os AGENTS.md aplicáveis;
2. leia README.md, docs/remote-content.md e docs/CODEX-HANDOFF.md;
3. execute git status e examine os commits recentes com git log;
4. inspecione package.json, a estrutura app/ e src/ e os testes existentes;
5. não descarte nem reescreva funcionalidades existentes sem necessidade.

Contexto do produto:
- Rune é um character builder mobile em React Native, Expo e TypeScript;
- possui Character Engine, persistência local e GameCatalog normalizado;
- importa JSON compatível com 5etools manualmente e por uma fonte remota
  experimental;
- possui catálogos, progressão, escolhas pendentes, feats, spells, items e
  inventário;
- não deve receber Foundry, backend, login, nuvem, multiplayer ou sincronização
  nesta fase.

Primeiro instale as dependências e execute testes, typecheck, lint e
git diff --check. Corrija problemas reais encontrados, mantendo a arquitetura
Parser -> Normalizer -> GameCatalog -> Character Engine -> UI. Em seguida,
inicie o Expo para eu testar no Android. Só gere o APK quando eu pedir.

Faça commits pequenos e descritivos. Ao terminar cada tarefa, informe arquivos
alterados, decisões, limitações e comandos de verificação executados.
```

## Comandos iniciais recomendados

```bash
git status
git log --oneline -10
npm install
npm test -- --runInBand
npm run typecheck
npm run lint
npx expo start
```

Para testar no Android, o celular e o computador podem usar a mesma rede e o
QR code do Expo Go. Se a rede local não funcionar, use:

```bash
npx expo start --tunnel
```

## O que precisa ser transferido

- **Obrigatório:** a pasta completa do repositório, incluindo `.git` se você
  quiser preservar os commits.
- **Recomendado:** usar um repositório Git privado para sincronizar alterações
  entre máquinas.
- **Opcional:** exportar/copiar a conversa para consulta humana. O prompt acima,
  o README, a documentação e o histórico Git já fornecem ao Codex o contexto
  técnico necessário.
- **Nunca transfira:** senhas, tokens, chaves de API, credenciais Expo/EAS ou
  arquivos secretos dentro do prompt ou do Git.

Se a cópia vier como ZIP sem a pasta `.git`, o código continuará funcionando,
mas o histórico de commits não acompanhará a transferência.

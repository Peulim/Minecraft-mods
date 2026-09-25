# Rune — protótipo de ficha de RPG

Aplicativo Expo/React Native para criar, salvar e consultar personagens de RPG. O MVP usa um catálogo pequeno e curado, compatível com o formato de dados do 5etools, sem embutir ou redistribuir o acervo completo.

Para continuar o desenvolvimento em outra máquina com o Codex, consulte o
[guia de transferência e o prompt de retomada](docs/CODEX-HANDOFF.md).

## Executar

1. Instale o Node.js LTS e o Expo Go no Android.
2. Na raiz do projeto: `npm install`.
3. Inicie: `npx expo start`.
4. Escaneie o QR code usando o Expo Go na mesma rede Wi-Fi, ou use `npx expo start --tunnel` se a rede impedir a descoberta local.

## Dados

## Dados estruturados e importação 5etools

O aplicativo **não faz scraping de HTML**, download automático nem envia dados a um servidor. A rota **Dados → Importar arquivo JSON** abre o seletor do Android, lê um arquivo local e mantém o catálogo normalizado no `AsyncStorage` do próprio dispositivo.

O importador aceita um ou vários documentos JSON compatíveis com o formato usado pelo ecossistema 5etools: `race`/`species`, `class`, `subclass`, `classFeature`, `subclassFeature`, `background`, `feat`, `spell` e `item`. Os arquivos selecionados juntos são combinados antes da normalização, permitindo resolver referências que ficam divididas entre arquivos de classe e de features. Cada objeto recebe um ID interno estável derivado de `tipo|nome|source`.

Classes, subclasses, features, espécies, backgrounds, feats, spells e items são normalizados e colocados no catálogo local. Estruturas ainda não suportadas ficam registradas em `metadata.uninterpreted`, sem interpretação inventada.

O 5etools mistura material de múltiplas fontes e os direitos de redistribuição variam conforme a origem. Por isso, o app não distribui nem sincroniza automaticamente o catálogo completo. Importe somente arquivos que você tenha o direito de usar e confirme os termos/licenças da fonte antes de disponibilizar uma sincronização pública. O catálogo SRD pequeno continua apenas como fallback de desenvolvimento.

### Como importar no celular

1. Obtenha, de uma fonte que você está autorizado a usar, um ou mais arquivos JSON compatíveis.
2. Copie-os para o Android ou baixe-os no aparelho.
3. Abra **Dados** na Home e toque em **Importar JSONs do 5etools**.
4. Selecione todos os arquivos relacionados de uma só vez. O app os agrega, valida, normaliza e combina com o catálogo existente por ID estável.
5. Crie ou edite um personagem; as telas de espécie, classe, subclasse e background passarão a consultar o catálogo importado.

### Fontes remotas

A experiência principal fica em **Conteúdo → Explorar fontes remotas**. O botão **Carregar catálogo do 5etools (experimental)** lê `books.json` e os índices de classes e magias em `https://5e.tools/data`, monta a lista de livros dinamicamente e permite instalar uma fonte sem sair do Rune. Datasets compartilhados de espécies, backgrounds, feats e itens são baixados e filtrados pelo campo `source`; classes e magias usam os arquivos apontados pelos índices. Não há scraping de HTML.

Esse adaptador direto é destinado a testes de desenvolvimento. Antes de publicar ou monetizar o aplicativo, revise os termos e direitos de cada fonte e, se necessário, desative-o em favor de um manifesto com conteúdo autorizado. Também é possível configurar um manifesto próprio na mesma tela. Consulte [`docs/remote-content.md`](docs/remote-content.md) para o schema, cache, atualização e remoção. A importação de arquivo local permanece como fallback.

`DataProvider` é a fronteira entre o aplicativo e qualquer catálogo. `SeedDataProvider` continua existindo para testes e fallback. `FiveEToolsImportProvider` consulta apenas o JSON já normalizado e persistido localmente.

## Estrutura

```
app/                 rotas Expo Router
src/components/      componentes visuais reutilizáveis
src/data/            DataProvider, adaptador 5etools e catálogo de demonstração
src/data/fiveEToolsNormalizer.ts parser, validação e normalização do formato externo
src/domain/          tipos centrais e regras puras de criação
src/domain/characterEngine.ts reconstrução de features, proficiências e escolhas pendentes
src/storage/         persistência local AsyncStorage
src/state/           estado do editor de personagem
src/theme/           tokens visuais
```

## Desenvolvimento

Rode `npm test` para os testes das regras de criação e do parser/normalizador. Rode `npm run typecheck` antes de iniciar o Expo.

## Character Engine

O personagem salvo mantém apenas escolhas e estado persistente (atributos, origem, classe, nível e seleções). Ao salvar, o `Character Engine` reconstrói valores derivados a partir do `GameCatalog`: features obtidas, proficiências sem duplicatas, pontos de vida iniciais e escolhas pendentes. Modificadores de atributo, bônus de proficiência e bônus de perícia são calculados por regras puras, não gravados duplicadamente.

O normalizador interpreta as estruturas de classe `classFeatures`, `subclassFeatures`, `classFeature`, `subclassFeature`, `startingProficiencies`, `proficiency`, `casterProgression`, `spellcastingAbility`, `cantripProgression`, `spellsKnownProgression` e tabelas de slots reconhecíveis. A escolha de subclasse usa o nível da feature de classe cujo nome indica archetype/tradition/domain/college/subclass; quando esse dado não existe, o engine não inventa um nível.

Proficiências estruturadas de classe, espécie e background são separadas em armor, weapons, tools, saving throws, skills e languages. Blocos `choose` geram escolhas pendentes com quantidade e opções exatas. Features são resolvidas pelas referências da progressão e deduplicadas por ID.

O catálogo normalizado usa schema **v2** e guarda data de importação, tipos presentes, contagens e uma lista `uninterpreted`. Catálogos v1 locais são descartados com segurança e podem ser reimportados. Campos brutos relevantes continuam preservados em `metadata.raw`; estruturas desconhecidas são registradas, nunca interpretadas por adivinhação.

Ainda não são interpretadas automaticamente expressões textuais de regras, fórmulas especiais de magias preparadas, tabelas de recursos não padronizadas, filtros 5etools como `fromFilter`, variantes e efeitos mecânicos descritos apenas em prosa. Esses casos aparecem como avisos de validação ou metadados não interpretados.

## Gerar um APK para Android

O repositório contém um perfil EAS `preview` que produz um **APK instalável** (o perfil `production` gera AAB para a Play Store). Para gerar e obter um link de download:

```bash
npm install
npx eas-cli login
npx eas-cli build:configure
npm run build:apk
```

O último comando envia o código para o EAS Build, que pede uma conta Expo e retorna uma URL quando o APK estiver pronto. Abra essa URL no Android, permita a instalação de aplicativos desconhecidos quando o sistema solicitar e instale o arquivo. Não é necessário adicionar uma chave de assinatura manualmente: o EAS pode criar/gerenciar a credencial Android durante o primeiro build.

Para criar uma versão de loja, use `npx eas-cli build --platform android --profile production`; o resultado será um `.aab`, que não é instalável diretamente como APK.

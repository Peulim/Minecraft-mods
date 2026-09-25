# Fontes remotas de conteúdo

O Rune não define uma URL padrão para conteúdo de terceiros. O operador do aplicativo deve configurar `EXPO_PUBLIC_CONTENT_MANIFEST_URL` no build, ou informar uma URL na tela Fontes durante o desenvolvimento. O manifesto HTTPS precisa estar em uma hospedagem cuja distribuição seja autorizada. Isso evita acoplar o app à interface HTML do 5etools ou assumir permissão para redistribuir todos os livros presentes em mirrors públicos.

## Manifesto v1

```json
{
  "schemaVersion": 1,
  "sources": [
    {
      "id": "PHB",
      "name": "Player's Handbook",
      "abbreviation": "PHB",
      "type": "book",
      "version": "2024.1",
      "date": "2024-09-17",
      "expectedCounts": { "classes": 12, "spells": 300 },
      "datasets": [
        {
          "id": "classes-phb.json",
          "label": "Classes e features",
          "url": "https://conteudo.exemplo/classes-phb.json",
          "version": "2024.1",
          "hash": "sha256-publicado-pelo-provedor"
        }
      ]
    }
  ]
}
```

O manifesto descobre os livros; ele não é uma lista hardcoded no aplicativo. Cada fonte enumera todos os datasets necessários, independentemente de sua organização física. Datasets compartilhados podem aparecer em várias fontes: o `SourceManager` filtra cada entidade por `source`, `classSource` ou `subclassSource` e preserva classes-pai exigidas por subclasses.

## Instalação e cache

1. O provider baixa e valida o manifesto.
2. Cada dataset é obtido somente via HTTPS e tratado como JSON, nunca como código.
3. Respostas são cacheadas localmente por URL mais hash/versão.
4. Os documentos são filtrados pela source escolhida e enviados ao importer/normalizer existente.
5. Somente após download, parse e normalização completos o catálogo daquela source é persistido.
6. O catálogo agregado é reconstruído a partir da importação manual e de todas as fontes instaladas.

Uma alteração de `source.version` aparece como atualização disponível. Uma mudança de `dataset.hash` ou `dataset.version` cria uma nova entrada de cache, permitindo baixar a revisão sem invalidar outros datasets.

## Decisão de distribuição

O formato técnico do JSON não concede direitos sobre seu conteúdo. Antes de publicar uma URL padrão ou um manifesto oficial no Rune, é necessário decidir quais obras podem ser hospedadas/redistribuídas e sob quais licenças. Conteúdo SRD/licenciado e conteúdo proprietário devem ser tratados separadamente. Sem essa decisão, o app permanece configurável e a importação local continua disponível.

## Adaptador direto do 5etools (experimental)

Para facilitar testes, a tela **Fontes** possui um preset `rune://5etools-direct`. Ele consulta somente JSON estruturado em `https://5e.tools/data`: `books.json` descobre os livros, enquanto `class/index.json` e `spells/index.json` resolvem os arquivos particionados. Os datasets agregados `races.json`, `backgrounds.json`, `feats.json` e `items.json` são filtrados por `source` durante a instalação.

As respostas são mantidas no cache local e passam pelo mesmo `SourceManager`, filtro, parser e normalizador das fontes baseadas em manifesto. O preset é experimental e voltado à validação durante o desenvolvimento; os direitos e termos de cada source ainda precisam ser revisados antes de uma distribuição pública.

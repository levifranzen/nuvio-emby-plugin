# Nuvio Emby Local Plugin

Plugin do Nuvio que reproduz mídia diretamente do meu Emby Server local,
casando o título pelo TMDB ID.

## Antes de publicar

1. Edite `src/emby-local/config.js`:
   - `EMBY_URL`: IP fixo do Emby na LAN (ex: `http://192.168.1.50:8096`).
     Recomendo reservar esse IP no DHCP do roteador.
   - `EMBY_API_KEY`: crie uma **API Key dedicada** em
     `Emby > Dashboard > API Keys`, de preferência ligada a um usuário
     com permissões restritas (sem admin). Como o repositório é
     público, essa chave fica visível — trate-a como descartável.
2. Rode o build de novo depois de editar a config:
   ```
   npm install
   node build.js emby-local
   ```
   Isso regenera `providers/emby-local.js` já com os valores novos
   embutidos e transpilado para o Hermes.

## Publicar

```
git init
git add .
git commit -m "Emby local provider"
git branch -M main
git remote add origin https://github.com/<seu-usuario>/nuvio-emby-plugin.git
git push -u origin main
```

URL do manifest para adicionar no Nuvio:
```
https://raw.githubusercontent.com/<seu-usuario>/nuvio-emby-plugin/main/manifest.json
```

## Instalar no Nuvio

No app: **Settings → Plugins → Add Repository URL** → cole a URL do
manifest acima.

## Testar antes de confiar em produção

Use o **Plugin Tester** (só existe no build debug do Nuvio):
- `Settings → Developer → Plugin Tester`
- Aba "Individual Plugin": cole o conteúdo de `providers/emby-local.js`
  ou aponte para a URL raw dele, informe um TMDB ID conhecido da sua
  biblioteca, e rode o teste.
- Confira a aba "Logs" se não vier nenhum stream — provavelmente o
  filtro `AnyProviderIdEquals` precisa de ajuste para a versão do seu
  Emby (ver `src/emby-local/index.js`, função `findItemByTmdbId`).

## Pontos que dependem da sua instância do Emby

- **Filtro por TMDB ID**: `AnyProviderIdEquals=Tmdb.{id}` é o esperado
  nas versões recentes do Emby/Jellyfin-like API; se não retornar
  nada, talvez seja necessário buscar tudo e filtrar
  `ProviderIds.Tmdb` manualmente no cliente.
- **Direct Play vs HLS**: a URL atual usa `stream?Static=true` (direct
  play, sem transcodificar). Se o player do Nuvio não tocar algum
  codec/container, troque por transcoding HLS
  (`/emby/Videos/{id}/master.m3u8`).
- **Múltiplas fontes**: se um item tiver mais de um `MediaSource`
  (ex: duas versões do mesmo filme), o plugin já retorna uma entrada
  de stream por fonte.

## Estrutura

```
nuvio-emby-plugin/
├── src/emby-local/
│   ├── config.js     # EMBY_URL e EMBY_API_KEY (edite aqui)
│   ├── http.js        # chamadas à API do Emby
│   └── index.js        # getStreams() — ponto de entrada do Nuvio
├── providers/
│   └── emby-local.js   # gerado pelo build.js, não editar à mão
├── manifest.json        # registro do provider para o Nuvio
├── build.js              # script de build (bundle + transpile)
└── package.json
```

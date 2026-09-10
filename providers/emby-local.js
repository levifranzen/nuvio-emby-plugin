/**
 * emby-local - Built from src/emby-local/
 * Generated: 2026-09-09T22:58:47.763Z
 */
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// src/emby-local/config.js
var EMBY_URL = "http://192.168.1.50:8096";
var EMBY_API_KEY = "SUA_API_KEY_AQUI";

// src/emby-local/http.js
function embyGet(_0) {
  return __async(this, arguments, function* (path, params = {}) {
    const query = new URLSearchParams(__spreadProps(__spreadValues({}, params), {
      api_key: EMBY_API_KEY
    })).toString();
    const url = `${EMBY_URL}${path}?${query}`;
    console.log(`[EmbyLocal] GET ${path}`);
    const response = yield fetch(url);
    if (!response.ok) {
      throw new Error(`Emby request failed (${response.status}) for ${path}`);
    }
    return yield response.json();
  });
}
function buildStreamUrl(itemId, mediaSourceId) {
  const params = new URLSearchParams({
    Static: "true",
    api_key: EMBY_API_KEY
  });
  if (mediaSourceId) {
    params.set("MediaSourceId", mediaSourceId);
  }
  return `${EMBY_URL}/emby/Videos/${itemId}/stream?${params.toString()}`;
}

// src/emby-local/index.js
function findItemByTmdbId(tmdbId, mediaType) {
  return __async(this, null, function* () {
    const itemType = mediaType === "movie" ? "Movie" : "Series";
    const data = yield embyGet("/emby/Items", {
      Recursive: true,
      IncludeItemTypes: itemType,
      AnyProviderIdEquals: `Tmdb.${tmdbId}`,
      Fields: "ProviderIds,MediaSources"
    });
    return data.Items && data.Items[0] || null;
  });
}
function findEpisode(seriesId, season, episode) {
  return __async(this, null, function* () {
    const data = yield embyGet(`/emby/Shows/${seriesId}/Episodes`, {
      Season: season,
      Fields: "MediaSources"
    });
    const items = data.Items || [];
    return items.find((ep) => ep.IndexNumber === Number(episode)) || null;
  });
}
function getStreams(tmdbId, mediaType, season, episode) {
  return __async(this, null, function* () {
    try {
      console.log(`[EmbyLocal] Request: ${mediaType} tmdb=${tmdbId} S${season}E${episode}`);
      const item = yield findItemByTmdbId(tmdbId, mediaType);
      if (!item) {
        console.log("[EmbyLocal] Nenhum item encontrado com esse TMDB ID");
        return [];
      }
      let target = item;
      if (mediaType === "tv") {
        target = yield findEpisode(item.Id, season, episode);
        if (!target) {
          console.log("[EmbyLocal] Epis\xF3dio n\xE3o encontrado");
          return [];
        }
      }
      const sources = target.MediaSources && target.MediaSources.length ? target.MediaSources : [{ Id: void 0 }];
      return sources.map((src, i) => {
        const label = sources.length > 1 ? `${target.Name} \u2014 Fonte ${i + 1}` : target.Name || "Direct Play";
        return {
          name: "Emby",
          title: label,
          url: buildStreamUrl(target.Id, src.Id),
          quality: src.Container ? src.Container.toUpperCase() : "Original"
        };
      });
    } catch (error) {
      console.error(`[EmbyLocal] Error: ${error.message}`);
      return [];
    }
  });
}
module.exports = { getStreams };

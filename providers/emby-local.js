/**
 * Emby Local Provider
 * Arquivo unico — sem build, sem import/export, sem async/await.
 * Edite EMBY_URL e EMBY_API_KEY abaixo e suba direto pro repo.
 */

var EMBY_URL = "http://192.168.1.253:8096";
var EMBY_API_KEY = "07c08bed43bd4d0b90adbd02de0345e1";

//function debugStream(message) {
//    return { name: message, title: 'Emby (debug)', url: 'about:blank', quality: 'DEBUG' };
//}

function embyGet(path, params) {
    params = params || {};
    params.api_key = EMBY_API_KEY;
    var query = Object.keys(params).map(function (k) {
        return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
    }).join('&');

    return fetch(EMBY_URL + path + '?' + query).then(function (res) {
        if (!res.ok) {
            throw new Error('Emby request failed (' + res.status + ') for ' + path);
        }
        return res.json();
    });
}

function buildStreamUrl(itemId, mediaSourceId) {
    var url = EMBY_URL + '/emby/Videos/' + itemId + '/stream?Static=true&api_key=' + encodeURIComponent(EMBY_API_KEY);
    if (mediaSourceId) {
        url += '&MediaSourceId=' + encodeURIComponent(mediaSourceId);
    }
    return url;
}

/**
 * URL com remux de audio pra AAC (mantendo o video intacto, sem
 * transcodificar). Contorna o bug de audio OPUS travando em ~5s
 * em algumas TVs (ex: Samsung/Tizen).
 */
function buildCompatibilityStreamUrl(itemId, mediaSourceId) {
    var url = EMBY_URL + '/emby/Videos/' + itemId + '/stream?Container=mp4&VideoCodec=copy&AudioCodec=aac&api_key=' + encodeURIComponent(EMBY_API_KEY);
    if (mediaSourceId) {
        url += '&MediaSourceId=' + encodeURIComponent(mediaSourceId);
    }
    return url;
}

function findItemByTmdbId(tmdbId, mediaType) {
    var itemType = mediaType === 'movie' ? 'Movie' : 'Series';
    return embyGet('/emby/Items', {
        Recursive: true,
        IncludeItemTypes: itemType,
        AnyProviderIdEquals: 'Tmdb.' + tmdbId,
        Fields: 'ProviderIds,MediaSources'
    }).then(function (data) {
        return (data.Items && data.Items[0]) || null;
    });
}

function findEpisode(seriesId, season, episode) {
    return embyGet('/emby/Shows/' + seriesId + '/Episodes', {
        Season: season,
        Fields: 'MediaSources'
    }).then(function (data) {
        var items = data.Items || [];
        for (var i = 0; i < items.length; i++) {
            if (items[i].IndexNumber === Number(episode)) {
                return items[i];
            }
        }
        return null;
    });
}

function streamsFromTarget(target) {
    if (!target) {
        return [];
    }

    var sources = (target.MediaSources && target.MediaSources.length) ? target.MediaSources : [{ Id: undefined }];
    var streams = [];

    sources.forEach(function (src, i) {
        var suffix = sources.length > 1 ? ' \u2014 Fonte ' + (i + 1) : '';
        var baseName = target.Name || 'Direct Play';

        streams.push({
            name: 'Emby',
            title: baseName + suffix,
            url: buildStreamUrl(target.Id, src.Id),
            quality: src.Container ? String(src.Container).toUpperCase() : 'Original'
        });

        streams.push({
            name: 'Emby',
            title: baseName + suffix + ' (Compatibilidade AAC)',
            url: buildCompatibilityStreamUrl(target.Id, src.Id),
            quality: 'AAC'
        });
    });

    return streams;
}

/**
 * Funcao principal chamada pelo Nuvio.
 * @param {string} tmdbId
 * @param {string} mediaType - 'movie' ou 'tv'
 * @param {number} season
 * @param {number} episode
 */
function getStreams(tmdbId, mediaType, season, episode) {
    return findItemByTmdbId(tmdbId, mediaType).then(function (item) {
        if (!item) {
            return [];
        }

        if (mediaType === 'tv') {
            return findEpisode(item.Id, season, episode).then(streamsFromTarget);
        }

        return streamsFromTarget(item);
    }).catch(function (error) {
        console.error('[EmbyLocal] Error: ' + error.message);
        return [];
    });
}

module.exports = { getStreams: getStreams };

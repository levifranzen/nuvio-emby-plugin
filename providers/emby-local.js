/**
 * Emby Local Provider
 * Arquivo unico — sem build, sem import/export, sem async/await.
 * Edite EMBY_URL e EMBY_API_KEY abaixo e suba direto pro repo.
 */

var EMBY_URL = "http://192.168.1.50:8096";
var EMBY_API_KEY = "SUA_API_KEY_AQUI";

function debugStream(message) {
    return { name: 'Emby (debug)', title: message, url: 'about:blank', quality: 'DEBUG' };
}

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

function streamsFromTarget(item, target, season, episode) {
    if (!target) {
        return [debugStream(
            '[DEBUG] Item "' + item.Name + '" (Id=' + item.Id + ') achado, mas episodio S' + season + 'E' + episode + ' nao encontrado'
        )];
    }

    var sources = (target.MediaSources && target.MediaSources.length) ? target.MediaSources : [{ Id: undefined }];

    return sources.map(function (src, i) {
        var label = sources.length > 1
            ? (target.Name + ' \u2014 Fonte ' + (i + 1))
            : (target.Name || 'Direct Play');

        return {
            name: 'Emby',
            title: label,
            url: buildStreamUrl(target.Id, src.Id),
            quality: src.Container ? String(src.Container).toUpperCase() : 'Original'
        };
    });
}

/**
 * Funcao principal chamada pelo Nuvio.
 * @param {string} tmdbId
 * @param {string} mediaType - 'movie' ou 'tv'
 * @param {number} season
 * @param {number} episode
 */
function getStreams(tmdbId, mediaType, season, episode) {
    console.log('[EmbyLocal] Request: ' + mediaType + ' tmdb=' + tmdbId + ' S' + season + 'E' + episode);

    return findItemByTmdbId(tmdbId, mediaType).then(function (item) {
        if (!item) {
            return [debugStream('[DEBUG] Nenhum item Emby achado para tmdbId=' + tmdbId + ' tipo=' + mediaType)];
        }

        if (mediaType === 'tv') {
            return findEpisode(item.Id, season, episode).then(function (target) {
                return streamsFromTarget(item, target, season, episode);
            });
        }

        return streamsFromTarget(item, item, season, episode);
    }).catch(function (error) {
        var msg = '[DEBUG] ERRO: ' + error.message;
        console.error(msg);
        return [debugStream(msg)];
    });
}

module.exports = { getStreams: getStreams };

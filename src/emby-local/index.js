/**
 * Emby Local Provider
 * Reproduz midia diretamente do Emby Server local, casando pelo TMDB ID.
 */

import { embyGet, buildStreamUrl } from './http.js';

/**
 * Busca o item (Movie ou Series) no Emby que tenha o TMDB ID informado.
 * @param {string} tmdbId
 * @param {string} mediaType - 'movie' ou 'tv'
 */
async function findItemByTmdbId(tmdbId, mediaType) {
    const itemType = mediaType === 'movie' ? 'Movie' : 'Series';

    const data = await embyGet('/emby/Items', {
        Recursive: true,
        IncludeItemTypes: itemType,
        AnyProviderIdEquals: `Tmdb.${tmdbId}`,
        Fields: 'ProviderIds,MediaSources'
    });

    return (data.Items && data.Items[0]) || null;
}

/**
 * Dada uma série (Emby Item), encontra o episódio certo por season/episode.
 * @param {string} seriesId
 * @param {number} season
 * @param {number} episode
 */
async function findEpisode(seriesId, season, episode) {
    const data = await embyGet(`/emby/Shows/${seriesId}/Episodes`, {
        Season: season,
        Fields: 'MediaSources'
    });

    const items = data.Items || [];
    return items.find(ep => ep.IndexNumber === Number(episode)) || null;
}

/**
 * Função principal chamada pelo Nuvio.
 * @param {string} tmdbId - TMDB ID do título
 * @param {string} mediaType - 'movie' ou 'tv'
 * @param {number} season - número da temporada (para 'tv')
 * @param {number} episode - número do episódio (para 'tv')
 * @returns {Promise<Array>} lista de streams
 */
async function getStreams(tmdbId, mediaType, season, episode) {
    try {
        console.log(`[EmbyLocal] Request: ${mediaType} tmdb=${tmdbId} S${season}E${episode}`);

        const item = await findItemByTmdbId(tmdbId, mediaType);
        if (!item) {
            console.log('[EmbyLocal] Nenhum item encontrado com esse TMDB ID');
            return [];
        }

        let target = item;
        if (mediaType === 'tv') {
            target = await findEpisode(item.Id, season, episode);
            if (!target) {
                console.log('[EmbyLocal] Episódio não encontrado');
                return [];
            }
        }

        const sources = (target.MediaSources && target.MediaSources.length)
            ? target.MediaSources
            : [{ Id: undefined }];

        return sources.map((src, i) => {
            const label = sources.length > 1
                ? `${target.Name} — Fonte ${i + 1}`
                : (target.Name || 'Direct Play');

            return {
                name: 'Emby',
                title: label,
                url: buildStreamUrl(target.Id, src.Id),
                quality: src.Container ? src.Container.toUpperCase() : 'Original'
            };
        });
    } catch (error) {
        console.error(`[EmbyLocal] Error: ${error.message}`);
        return [];
    }
}

module.exports = { getStreams };

/**
 * HTTP Utilities
 * Wrapper fino em volta do fetch para chamadas à API do Emby.
 */

import { EMBY_URL, EMBY_API_KEY } from './config.js';

/**
 * Faz um GET autenticado na API do Emby e retorna o JSON já parseado.
 * @param {string} path - caminho da API, ex: "/emby/Items"
 * @param {object} params - query params adicionais
 */
export async function embyGet(path, params = {}) {
    const query = new URLSearchParams({
        ...params,
        api_key: EMBY_API_KEY
    }).toString();

    const url = `${EMBY_URL}${path}?${query}`;
    console.log(`[EmbyLocal] GET ${path}`);

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Emby request failed (${response.status}) for ${path}`);
    }

    return await response.json();
}

/**
 * Monta a URL de reprodução direta (direct play) de um item do Emby.
 * @param {string} itemId
 * @param {string} [mediaSourceId]
 */
export function buildStreamUrl(itemId, mediaSourceId) {
    const params = new URLSearchParams({
        Static: 'true',
        api_key: EMBY_API_KEY
    });
    if (mediaSourceId) {
        params.set('MediaSourceId', mediaSourceId);
    }
    return `${EMBY_URL}/emby/Videos/${itemId}/stream?${params.toString()}`;
}

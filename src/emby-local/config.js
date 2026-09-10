/**
 * Emby Local Provider - Configuration
 *
 * EDITE ESTES VALORES antes de publicar/buildar.
 *
 * EMBY_URL: endereço do seu Emby na rede local. Use um IP fixo
 *           (reserva DHCP no roteador) para não quebrar quando o
 *           IP mudar. Ex: "http://192.168.1.50:8096"
 *
 * EMBY_API_KEY: crie uma API Key DEDICADA para este plugin em
 *           Emby > Dashboard > API Keys, de preferência associada
 *           a um usuário com permissões restritas (sem admin).
 *           Como este repositório é público, qualquer pessoa pode
 *           ver esta chave — trate-a como descartável/reduzida em
 *           privilégios, e revogue/gere outra se suspeitar de uso
 *           indevido.
 */

export const EMBY_URL = "http://192.168.1.50:8096";
export const EMBY_API_KEY = "SUA_API_KEY_AQUI";

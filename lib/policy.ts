import {defaults, type Settings} from './settings';
export const youtubeHosts = ['youtube.com', 'www.youtube.com', 'm.youtube.com'];
const videoId = /^[\w-]{11}$/;
const playlistId = /^[\w-]+$/;
export type Route = { kind: 'search' | 'watch' | 'creator' | 'playlist' | 'home' | 'shorts' | 'redirect'; url: string } | { kind: 'blocked' };

/** One policy for direct loads, pasted links, clicks and SPA navigation. */
export function classify(raw: string, settings: Settings = defaults, depth = 0): Route {
  let u: URL;
  try { u = new URL(raw); } catch { return {kind: 'blocked'}; }
  if (!['http:', 'https:'].includes(u.protocol) || !youtubeHosts.includes(u.hostname)) return {kind:'blocked'};
  if (u.pathname === '/redirect') {
    if (depth >= 5) return {kind:'blocked'};
    const target = u.searchParams.get('q') || u.searchParams.get('url');
    // Token-only redirect URLs must reach YouTube's own confirmation page.
    if (!target) return {kind:'redirect',url:u.href};
    let destination: URL;
    try { destination = new URL(target); } catch { return {kind:'blocked'}; }
    if (!['https:', 'http:'].includes(destination.protocol) || destination.username || destination.password) return {kind:'blocked'};
    if (youtubeHosts.includes(destination.hostname)) return classify(destination.href, settings, depth + 1);
    if (destination.hostname === 'youtu.be') {
      const id=destination.pathname.slice(1);
      if (!videoId.test(id)) return {kind:'blocked'};
      destination=new URL('https://www.youtube.com/watch'+destination.search);
      destination.searchParams.set('v',id);
      return classify(destination.href, settings, depth + 1);
    }
    return {kind:'redirect',url:destination.href};
  }
  if (u.pathname === '/' && settings.homeFeed) return {kind:'home',url:u.href};
  if (settings.shorts && /^\/(?:shorts(?:\/[^/]+)?|(?:@[^/]+|(?:channel|c|user)\/[^/]+)\/shorts)\/?$/.test(u.pathname)) return {kind:'shorts',url:u.href};
  if (u.pathname === '/watch' && videoId.test(u.searchParams.get('v') || '')) {
    // Playlist selection stays manual: never carry YouTube's auto-advance queue into the player.
    if (!settings.autoplay) for (const key of ['list','index','start_radio','playnext','pp','autoplay']) u.searchParams.delete(key);
    u.hostname = 'www.youtube.com'; u.protocol = 'https:';
    return {kind:'watch', url:u.href};
  }
  if (u.pathname === '/results' && u.searchParams.get('search_query')?.trim()) return {kind:'search',url:u.href};
  if (u.pathname === '/playlist' && playlistId.test(u.searchParams.get('list') || '')) return {kind:'playlist',url:u.href};
  // Legacy channel links appear in native metadata; apply exactly the same tab rules.
  const creator = u.pathname.match(/^\/(@[^/?#]+|channel\/[\w-]+|c\/[^/?#]+|user\/[^/?#]+)(?:\/(videos|streams|playlists|featured))?\/?$/u);
  if (creator) {
    const tab = creator[2];
    if (!tab || tab === 'featured') u.pathname = `/${creator[1]}/videos`;
    return {kind:'creator',url:u.href};
  }
  return {kind:'blocked'};
}

export function searchTarget(value: string, settings: Settings = defaults): string | null {
  const text=value.trim(); if (!text) return null;
  try {
    const u = new URL(text);
    if (['http:', 'https:'].includes(u.protocol) && u.hostname === 'youtu.be' && videoId.test(u.pathname.slice(1))) {
      const target=new URL('https://www.youtube.com/watch');target.searchParams.set('v',u.pathname.slice(1));
      const t=u.searchParams.get('t');if(t && /^\d+[\dhms]*$/.test(t))target.searchParams.set('t',t);
      return target.href;
    }
    const route=classify(u.href, settings);if(route.kind !== 'blocked')return route.url;
  } catch {}
  return 'https://www.youtube.com/results?search_query='+encodeURIComponent(text);
}

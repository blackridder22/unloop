import {bindTheme} from '@/lib/theme';
import {createRoot, type Root} from 'react-dom/client';
import {browser} from 'wxt/browser';
import {defaults, normalizeSettings, type Settings} from '@/lib/settings';
import {classify, youtubeHosts} from '@/lib/policy';
import {WatchHeader, WatchDetails} from '@/components/Watch';
import uiCss from '@/styles/app.css?inline';
import './style.css';

type Mount={host:HTMLElement;root:Root};
export default defineContentScript({
 matches:['*://*.youtube.com/*'], runAt:'document_start',
 async main(ctx) {
  const stopTheme=bindTheme(true);
  ctx.onInvalidated(stopTheme);
  let settings:Settings={...defaults};
  let loaded=false;
  const settingsChanged=(changes:Record<string,{newValue?:unknown}>,area:string)=>{
    if(area!=='local'||!changes.settings)return;
    settings=normalizeSettings(changes.settings.newValue);
    if(loaded){applySettings();lastUrl='';lastMeta='';schedule();}
  };
  browser.storage.onChanged.addListener(settingsChanged);
  settings=normalizeSettings((await browser.storage.local.get('settings')).settings);
  if(ctx.isInvalid){browser.storage.onChanged.removeListener(settingsChanged);return;}
  const home=browser.runtime.getURL('/search.html');
  let header:Mount|undefined, details:Mount|undefined, lastUrl='', lastMeta='', ended=false;
  let back=home, pending=false, disposed=false;
  const cleanupVideos=new Set<()=>void>();
  const videos=new WeakSet<HTMLVideoElement>();
  const completed=new WeakSet<HTMLVideoElement>();
  const autoplayApplied=new WeakMap<HTMLElement,boolean>();
  function mount(id:string):Mount {
    const host=document.createElement('div');host.id=id;
    host.style.cssText='display:block;width:100%;';
    const shadow=host.attachShadow({mode:'open'});
    const style=document.createElement('style');
    // WXT emits local font files. Make URL references absolute inside a YouTube shadow tree.
    style.textContent=uiCss.replace(/url\((['"]?)(\/assets\/[^)'"\s]+)\1\)/g,(_,q,path)=>`url("${browser.runtime.getURL(path)}")`);
    // Chromium resolves downloadable fonts at document scope, not from a shadow @font-face.
    if(!document.getElementById('iy-fonts')){
      const fonts=document.createElement('style');fonts.id='iy-fonts';fonts.textContent=style.textContent.match(/@font-face\{[^}]+\}/g)?.join('\n')||'';
      document.documentElement.append(fonts);
    }
    const rootNode=document.createElement('div');rootNode.style.display='flow-root';shadow.append(style,rootNode);
    return {host,root:createRoot(rootNode)};
  }
  function unmountWatch() {
    for(const item of [header,details]) {item?.root.unmount();item?.host.remove();}
    header=undefined;details=undefined;lastMeta='';
  }
  function applySettings(){
    for(const [key,value] of Object.entries(settings))document.documentElement.classList.toggle('iy-hide-'+key,!value);
    if(settings.shorts)document.querySelectorAll('[data-iy-hidden]').forEach(el=>el.removeAttribute('data-iy-hidden'));
  }
  function route():boolean {
    const result=classify(location.href,settings);
    if(result.kind==='blocked') {document.documentElement.classList.add('iy-blocked');location.replace(home);return false;}
    if(result.url!==location.href){location.replace(result.url);return false;}
    const watch=result.kind==='watch';document.documentElement.classList.toggle('iy-watch',watch);
    if(result.kind==='search')back=location.href;
    if(!watch)unmountWatch();
    return true;
  }
  function updateWatch() {
    if(!document.body || !document.documentElement.classList.contains('iy-watch'))return;
    if(!header){header=mount('iy-header');document.body.prepend(header.host);header.root.render(<WatchHeader home={home} back={back}/>);}
    // Retain YouTube's actual player and all its media controls in their native DOM.
    const player=document.querySelector<HTMLElement>('ytd-watch-flexy #player');
    if(!player)return;
    if(!details){details=mount('iy-details');player.after(details.host);}
    else if(!details.host.isConnected)player.after(details.host);
    const title=document.querySelector('ytd-watch-metadata h1 yt-formatted-string, h1.ytd-watch-metadata')?.textContent?.trim()||document.title.replace(/ - YouTube$/,'');
    const author=document.querySelector<HTMLAnchorElement>('ytd-watch-metadata ytd-channel-name a, #owner ytd-channel-name a');
    const fallback=document.querySelector<HTMLAnchorElement>('ytd-video-description-header-renderer a[href]');
    const structuredUrl=document.querySelector<HTMLLinkElement>('[itemprop="author"] [itemprop="url"]')?.href;
    const structuredName=document.querySelector('[itemprop="author"] [itemprop="name"]')?.getAttribute('content');
    const creator=author?.textContent?.trim()||fallback?.querySelector('img')?.alt||structuredName||'';
    const authorRoute=classify(author?.href||fallback?.href||structuredUrl||'',settings);
    const creatorUrl=authorRoute.kind==='creator'?authorRoute.url.replace(/^http:/,'https:'):home;
    const nativeCreator=!!document.querySelector('ytd-watch-metadata #owner');
    const meta=JSON.stringify([title,creator,creatorUrl,ended,settings,nativeCreator]);
    if(meta!==lastMeta){lastMeta=meta;details.root.render(<WatchDetails title={title} creator={creator} creatorUrl={creatorUrl} ended={ended} home={home} showCreator={settings.creator&&!nativeCreator} autoplay={settings.autoplay}/>);}
  }
  function suppressDistractions() {
    const toggle=document.querySelector<HTMLElement>('.ytp-autonav-toggle-button');
    if(toggle){
      if((!settings.autoplay || autoplayApplied.get(toggle)!==settings.autoplay) && (toggle.getAttribute('aria-checked')==='true')!==settings.autoplay)toggle.click();
      autoplayApplied.set(toggle,settings.autoplay);
    }
    document.querySelectorAll<HTMLAnchorElement>('a[href]').forEach(a=>{
      const raw=a.getAttribute('href')||'';
      if(!raw.includes('/shorts') && !raw.includes('/community') && !raw.includes('/featured'))return;
      let u:URL;try{u=new URL(raw,location.href);}catch{return;}
      if(!youtubeHosts.includes(u.hostname))return;
      if(!settings.shorts && u.pathname.includes('/shorts')) {
        const card=a.closest('ytd-video-renderer,ytd-rich-item-renderer,ytm-video-with-context-renderer,yt-tab-shape,tp-yt-paper-tab,ytm-pivot-bar-item-renderer');
        if(card && !card.hasAttribute('data-iy-hidden'))card.setAttribute('data-iy-hidden','');
        else if(!a.hasAttribute('data-iy-hidden'))a.setAttribute('data-iy-hidden','');
      }
    });
    document.querySelectorAll<HTMLVideoElement>('video').forEach(video=>{
      // Preserve user-selected playback, but no hover previews or channel trailers.
      if(!settings.autoplay && video.autoplay)video.autoplay=false;
      if(videos.has(video))return;videos.add(video);
      const onPlay=()=>{
        const kind=classify(location.href,settings).kind;
        if(!settings.autoplay && kind!=='watch' && !(settings.shorts&&kind==='shorts')){video.pause();return;}
        if(completed.has(video)){completed.delete(video);ended=false;updateWatch();}
      };
      video.addEventListener('play',onPlay);
      cleanupVideos.add(()=>video.removeEventListener('play',onPlay));
      const kind=classify(location.href,settings).kind;
      if(!settings.autoplay && kind!=='watch' && !(settings.shorts&&kind==='shorts'))video.pause();
    });
  }
  function clean() {
    if(disposed)return;
    if(location.href!==lastUrl){lastUrl=location.href;ended=false;lastMeta='';if(!route())return;}
    suppressDistractions();updateWatch();
  }
  function schedule(){if(pending||disposed)return;pending=true;requestAnimationFrame(()=>{pending=false;clean();});}
  // Capture end-of-content before YouTube can automatically pick a next video.
  // Ads retain their own completion behavior.
  const onEnded=(event:Event)=>{
    const video=event.target;
    if(settings.autoplay || !(video instanceof HTMLVideoElement) || classify(location.href,settings).kind!=='watch' || !video.closest('#movie_player') || document.querySelector('.html5-video-player.ad-showing'))return;
    event.stopImmediatePropagation();completed.add(video);ended=true;video.pause();updateWatch();
  };
  window.addEventListener('ended',onEnded,true);
  const onClick=(event:MouseEvent)=>{
    const anchor=event.composedPath().find(el=>el instanceof HTMLAnchorElement) as HTMLAnchorElement|undefined;
    if(!anchor)return;
    let u:URL;try{u=new URL(anchor.href,location.href);}catch{return;}
    if(!youtubeHosts.includes(u.hostname))return;
    const result=classify(u.href,settings);
    const target=result.kind==='blocked'?home:result.url;
    if(target===u.href)return;
    // Rewrite before YouTube's SPA handler, including modifier/middle-click destinations.
    if(u.pathname==='/redirect'){
      if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||event.button!==0){anchor.href=target;return;}
      event.preventDefault();event.stopImmediatePropagation();
      if(anchor.target==='_blank')window.open(target,'_blank','noopener');else location.assign(target);
      return;
    }
    anchor.href=target;
    if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||event.button!==0)return;
    event.preventDefault();event.stopImmediatePropagation();location.assign(target);
  };
  document.addEventListener('click',onClick,true);document.addEventListener('auxclick',onClick,true);
  document.addEventListener('yt-navigate-finish',schedule);window.addEventListener('popstate',schedule);
  const observer=new MutationObserver(schedule);observer.observe(document,{childList:true,subtree:true});
  const interval=window.setInterval(clean,500);
  loaded=true;applySettings();route();schedule();
  ctx.onInvalidated(()=>{disposed=true;browser.storage.onChanged.removeListener(settingsChanged);for(const key of Object.keys(defaults))document.documentElement.classList.remove('iy-hide-'+key);observer.disconnect();clearInterval(interval);unmountWatch();cleanupVideos.forEach(fn=>fn());window.removeEventListener('ended',onEnded,true);document.removeEventListener('click',onClick,true);document.removeEventListener('auxclick',onClick,true);document.removeEventListener('yt-navigate-finish',schedule);window.removeEventListener('popstate',schedule);document.documentElement.classList.remove('iy-watch','iy-blocked');});
 }
});

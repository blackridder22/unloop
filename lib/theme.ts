import {browser} from 'wxt/browser';
export type ThemeMode='light'|'dark'|'system';
export function normalizeTheme(value:unknown):ThemeMode{return value==='light'||value==='dark'?value:'system';}
export function bindTheme(native=false){
 const media=matchMedia('(prefers-color-scheme: dark)');
 let mode:ThemeMode='system',active=true,revision=0;
 const previousDark=document.documentElement.hasAttribute('dark');
 const apply=()=>{
  if(!active)return;
  const dark=mode==='dark'||(mode==='system'&&media.matches);
  document.documentElement.dataset.iyTheme=dark?'dark':'light';
  if(native)document.documentElement.toggleAttribute('dark',dark);
 };
 const changed=(changes:Record<string,{newValue?:unknown}>,area:string)=>{
  if(area==='local'&&changes.theme){revision++;mode=normalizeTheme(changes.theme.newValue);apply();}
 };
 browser.storage.onChanged.addListener(changed);media.addEventListener('change',apply);
 apply();
 const initialRevision=revision;
 void browser.storage.local.get('theme').then(data=>{if(active&&revision===initialRevision){mode=normalizeTheme(data.theme);apply();}}).catch(console.error);
 // YouTube may reset its root attribute during SPA transitions; keep the chosen appearance.
 const observer=native?new MutationObserver(()=>{
  const dark=document.documentElement.dataset.iyTheme==='dark';
  if(document.documentElement.hasAttribute('dark')!==dark)apply();
 }):undefined;
 observer?.observe(document.documentElement,{attributes:true,attributeFilter:['dark']});
 return ()=>{active=false;observer?.disconnect();media.removeEventListener('change',apply);browser.storage.onChanged.removeListener(changed);delete document.documentElement.dataset.iyTheme;if(native)document.documentElement.toggleAttribute('dark',previousDark);};
}

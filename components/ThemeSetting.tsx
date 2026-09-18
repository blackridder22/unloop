import {useEffect,useState} from 'react';
import {Sun,Moon,Monitor} from 'lucide-react';
import {browser} from 'wxt/browser';
import {Button} from './ui/button';
import {normalizeTheme,type ThemeMode} from '@/lib/theme';
export function ThemeSetting(){
 const [mode,setMode]=useState<ThemeMode>('system');const [ready,setReady]=useState(false);const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 useEffect(()=>{
  let active=true,revision=0;
  const changed=(changes:Record<string,{newValue?:unknown}>,area:string)=>{if(area==='local'&&changes.theme){revision++;setMode(normalizeTheme(changes.theme.newValue));}};
  browser.storage.onChanged.addListener(changed);
  void browser.storage.local.get('theme').then(data=>{if(active){if(!revision)setMode(normalizeTheme(data.theme));setReady(true);}},()=>{if(active)setError('Could not load appearance. Reload to try again.');});
  return ()=>{active=false;browser.storage.onChanged.removeListener(changed);};
 },[]);
 async function select(value:ThemeMode){setBusy(true);setError('');try{await browser.storage.local.set({theme:value});setMode(value);}catch{setError('Could not save appearance. Try again.');}finally{setBusy(false);}}
 return <section className="settings-section appearance-section"><h2>Appearance</h2><div className="appearance-body"><p>Choose a theme. System follows your device automatically.</p><div className="theme-choices" role="group" aria-label="Color theme">{([['light','Light',Sun],['dark','Dark',Moon],['system','System',Monitor]] as const).map(([value,label,Icon])=><Button key={value} variant="outline" className="theme-choice" aria-pressed={mode===value} disabled={!ready||busy} onClick={()=>select(value)}><Icon size={18}/>{label}</Button>)}</div>{error&&<p role="alert">{error}</p>}</div></section>;
}

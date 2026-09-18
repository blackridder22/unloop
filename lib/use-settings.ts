import {useEffect, useState} from 'react';
import {browser} from 'wxt/browser';
import {defaults, normalizeSettings, type Settings} from './settings';
export function useSettings() {
  const [settings,setSettings]=useState<Settings>(defaults);
  const [ready,setReady]=useState(false);
  const [error,setError]=useState('');
  useEffect(()=>{
    let active=true;
    browser.storage.local.get('settings').then(data=>{if(active){setSettings(normalizeSettings(data.settings));setReady(true);}},()=>{if(active)setError('Could not load your settings. Reload to try again.');});
    const changed=(changes:Record<string, {newValue?:unknown}>,area:string)=>{if(area==='local'&&changes.settings){setSettings(normalizeSettings(changes.settings.newValue));}};
    browser.storage.onChanged.addListener(changed);
    return ()=>{active=false;browser.storage.onChanged.removeListener(changed);};
  },[]);
  return {settings,ready,error};
}

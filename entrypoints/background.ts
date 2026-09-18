import { browser, type Browser } from 'wxt/browser';
import { normalizeSettings } from '@/lib/settings';
export default defineBackground(() => {
  browser.action.onClicked.addListener(() => browser.tabs.create({url:browser.runtime.getURL('/search.html')}));
  // Static rules retain the default protection; only user-enabled routes get exceptions.
  let queue = Promise.resolve();
  function syncRules() {
    queue = queue.catch(console.error).then(async () => {
      const settings=normalizeSettings((await browser.storage.local.get('settings')).settings);
      const rules: Browser.declarativeNetRequest.Rule[]=[];
      if(settings.homeFeed)rules.push({id:101,priority:4,action:{type:'allow'},condition:{regexFilter:'^https?://(www\\.|m\\.)?youtube\\.com/([?].*)?$',resourceTypes:['main_frame']}});
      if(settings.shorts)rules.push({id:102,priority:4,action:{type:'allow'},condition:{regexFilter:'^https?://(www\\.|m\\.)?youtube\\.com/(shorts(/[^/?#]+)?|(@[^/?#]+|(channel|c|user)/[^/?#]+)/shorts)/?([?].*)?$',resourceTypes:['main_frame']}});
      await browser.declarativeNetRequest.updateDynamicRules({removeRuleIds:[101,102],addRules:rules});
    });
    return queue;
  }
  browser.storage.onChanged.addListener((changes,area)=>{if(area==='local'&&changes.settings)void syncRules();});
  browser.runtime.onInstalled.addListener(()=>void syncRules());
  browser.runtime.onStartup.addListener(()=>void syncRules());
  browser.runtime.onMessage.addListener((message,_sender,respond)=>{
    if(message?.type!=='settings:sync')return;
    syncRules().then(()=>respond({ok:true}),()=>respond({ok:false}));
    return true;
  });
  void syncRules();
});

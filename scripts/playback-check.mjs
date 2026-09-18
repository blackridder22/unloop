import {chromium} from 'playwright';
import {mkdtemp,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';import {tmpdir} from 'node:os';import assert from 'node:assert/strict';
const out='/tmp/intentional-wxt-qa';await mkdir(out,{recursive:true});
const ext=path.resolve('.output/chrome-mv3');
const ctx=await chromium.launchPersistentContext(await mkdtemp(path.join(tmpdir(),'iy-playback-')),{channel:'chromium',headless:true,args:[`--disable-extensions-except=${ext}`,`--load-extension=${ext}`],viewport:{width:1440,height:900}});
const checks=[];let p;
try{
 p=await ctx.newPage();p.setDefaultTimeout(20000);
 await p.goto('https://www.youtube.com/watch?v=PkZNo7MFNFg',{waitUntil:'domcontentloaded'});
 await p.locator('#iy-header').waitFor();await p.locator('video').waitFor();
 await p.evaluate(()=>{const v=document.querySelector('video');v.muted=true;if(v.paused)v.play().catch(()=>{});});
 console.log('Waiting for real content after any pre-roll.');
 await p.waitForFunction(()=>{const v=document.querySelector('video');return v&&!v.paused&&v.currentTime>0&&!document.querySelector('.ad-showing')&&v.duration>60;},{},{timeout:60000});
 const t1=await p.locator('video').evaluate(v=>v.currentTime);await p.waitForTimeout(1500);const t2=await p.locator('video').evaluate(v=>v.currentTime);assert.ok(t2>t1);checks.push('Live content playback advances');console.log('PASS content playback',t1,t2);
 await p.locator('#movie_player').hover();await p.locator('.ytp-fullscreen-button').click();await p.waitForFunction(()=>!!document.fullscreenElement);checks.push('Native fullscreen works');await p.evaluate(()=>document.exitFullscreen());
 await p.evaluate(()=>document.fonts.ready);console.log('FONT_FACES',await p.evaluate(()=>[...document.fonts].map(f=>({family:f.family,status:f.status})).filter(f=>f.family.includes('Geist'))));
 await p.screenshot({path:out+'/watch-content.png'});
 const before=p.url();await p.locator('video').evaluate(v=>{v.currentTime=v.duration-1;v.play().catch(()=>{});});
 await p.getByRole('status').filter({hasText:'Video finished.'}).waitFor({timeout:20000});await p.waitForTimeout(3000);
 assert.equal(p.url(),before);assert.equal(await p.locator('video').evaluate(v=>v.paused),true);checks.push('Real content end stays on the selected video; no auto-advance');console.log('PASS natural ended event after seek; no auto-advance');
 await p.screenshot({path:out+'/watch-ended.png'});
 await p.setViewportSize({width:600,height:850});await p.screenshot({path:out+'/watch-narrow.png'});
 assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);checks.push('Narrow watch layout without overflow');
} catch(e){if(p){console.log('PLAYBACK_STATE',await p.evaluate(()=>({url:location.href,video:[...document.querySelectorAll('video')].map(v=>({time:v.currentTime,duration:v.duration,paused:v.paused,ended:v.ended,ready:v.readyState,error:v.error?.message})),ad:!!document.querySelector('.ad-showing'),text:document.querySelector('#iy-details')?.shadowRoot?.textContent.slice(-600)})));await p.screenshot({path:out+'/playback-failure.png'});}console.error(e);checks.push('FAILED: '+e);process.exitCode=1;}finally{await writeFile(out+'/playback-results.json',JSON.stringify(checks,null,2));await ctx.close();}

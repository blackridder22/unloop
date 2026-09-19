import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
const ext=path.resolve('.output/chrome-mv3');
const ctx=await chromium.launchPersistentContext(await mkdtemp(path.join(tmpdir(),'unloop-music-')),{channel:'chromium',headless:true,args:[`--disable-extensions-except=${ext}`,`--load-extension=${ext}`]});
const results=[];
try {
 const worker=ctx.serviceWorkers()[0]||await ctx.waitForEvent('serviceworker');
 const base=worker.url().split('/').slice(0,3).join('/');
 // A playable silent WAV lets the fixture detect video pausing without a user account.
 const wav=Buffer.alloc(44+16000*2*4);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(16000,24);wav.writeUInt32LE(32000,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(wav.length-44,40);
 await ctx.route('https://music.youtube.com/**',r=>r.fulfill({contentType:'text/html',body:`<html><body><h1>Music fixture</h1><a href="/watch?v=abcdefghijk&list=RDAMVMabcdefghijk&index=2&autoplay=1">Play queue</a><video controls muted autoplay loop src="data:audio/wav;base64,${wav.toString('base64')}"></video></body></html>`}));
 await ctx.route('https://www.youtube.com/**',r=>r.fulfill({contentType:'text/html',body:'<html><body><ytd-app>Regular YouTube fixture</ytd-app></body></html>'}));
 const p=await ctx.newPage();
 for(const route of ['/','/explore','/library','/playlist?list=PL_123','/watch?v=abcdefghijk&list=RDAMVMabcdefghijk&index=2&autoplay=1']){
  const url='https://music.youtube.com'+route;await p.goto(url);await p.getByRole('heading',{name:'Music fixture'}).waitFor();await p.waitForTimeout(650);assert.equal(p.url(),url);
  assert.equal(await p.evaluate(()=>document.documentElement.dataset.iyTheme),undefined);
  assert.equal(await p.locator('[id^="iy-"]').count(),0);
  assert.equal(await p.evaluate(()=>[...document.documentElement.classList].some(c=>c.startsWith('iy-'))),false);
 }
 await p.locator('video').evaluate(v=>v.play());await p.waitForTimeout(1000);
 assert.equal(await p.locator('video').evaluate(v=>v.paused),false);assert(await p.locator('video').evaluate(v=>v.currentTime>.5));assert.equal(await p.locator('video').evaluate(v=>v.autoplay),true);
 await p.getByRole('link',{name:'Play queue'}).click();await p.waitForURL('https://music.youtube.com/watch?v=abcdefghijk&list=RDAMVMabcdefghijk&index=2&autoplay=1');
 results.push('Music routes, queue parameters, autoplay, and continuous fixture playback remain untouched');
 for(const route of ['/','/shorts/abcdefghijk']){await p.goto('https://www.youtube.com'+route);await p.waitForURL(base+'/search.html');}
 await p.goto('https://www.youtube.com/@example/videos');await p.waitForTimeout(650);assert.equal(p.url(),'https://www.youtube.com/@example/videos');
 results.push('Regular YouTube homepage/Shorts blocking and creator access still work');
 if(process.argv.includes('--live')) {
 await ctx.unroute('https://music.youtube.com/**');
 await p.goto('https://music.youtube.com/',{waitUntil:'domcontentloaded'});
 await p.locator('ytmusic-app').waitFor({state:'attached',timeout:30000});await p.waitForTimeout(1000);assert.equal(new URL(p.url()).hostname,'music.youtube.com');assert.equal(await p.locator('#iy-header').count(),0);
 assert.equal(await p.evaluate(()=>document.documentElement.dataset.iyTheme),undefined);
 await mkdir('output/playwright',{recursive:true});await p.screenshot({path:'output/playwright/music-live.png'});
 results.push('Live YouTube Music loads its native app without Unloop redirect or theme injection (account playback not tested)');
 }
 console.log('PASS',results);
}finally{await mkdir('output/playwright',{recursive:true});await writeFile('output/playwright/music-results.json',JSON.stringify(results,null,2));await ctx.close();}

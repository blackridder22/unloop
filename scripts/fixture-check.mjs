import {chromium} from 'playwright';import {readFile,mkdtemp,writeFile} from 'node:fs/promises';import {tmpdir} from 'node:os';import path from 'node:path';import assert from 'node:assert/strict';
const ext=path.resolve('.output/chrome-mv3');const media=await readFile('/tmp/intentional-fixture.webm');
const ctx=await chromium.launchPersistentContext(await mkdtemp(path.join(tmpdir(),'iy-fixture-')),{channel:'chromium',headless:true,args:[`--disable-extensions-except=${ext}`,`--load-extension=${ext}`],viewport:{width:1440,height:900}});
const results=[];
try{
 await ctx.route('https://www.youtube.com/**',async route=>{
  if(route.request().url().endsWith('/test.webm'))return route.fulfill({contentType:'video/webm',body:media});
  const ad=new URL(route.request().url()).searchParams.has('ad');
  if(route.request().resourceType()!=='document')return route.abort();
  await route.fulfill({contentType:'text/html',body:`<!doctype html><html><head><title>Controlled player fixture - YouTube</title><style>body{margin:0}ytd-app{display:block;position:absolute;top:0;width:100%}#movie_player{position:relative;aspect-ratio:16/9;background:#171717}video{width:100%;height:100%}#player{width:100%}</style></head><body><ytd-app><ytd-watch-flexy><div id="columns"><div id="primary"><div id="primary-inner"><div id="player"><div id="movie_player" class="html5-video-player ${ad?'ad-showing':''}"><video muted controls src="/test.webm"></video></div></div><div id="below"><ytd-watch-metadata><h1><yt-formatted-string>Controlled local video</yt-formatted-string></h1><div id="owner"><ytd-channel-name><a href="/@fixture">Fixture Creator</a></ytd-channel-name></div></ytd-watch-metadata></div></div></div><div id="secondary">Recommendations</div></div></ytd-watch-flexy></ytd-app><script>window.autoNext=0;window.adCompleted=0;const v=document.querySelector('video');v.addEventListener('ended',()=>{if(document.querySelector('.ad-showing')){window.adCompleted++;document.querySelector('#movie_player').classList.remove('ad-showing');v.currentTime=0;v.play();}else{window.autoNext++;}});</script></body></html>`});
 });
 const p=await ctx.newPage();p.setDefaultTimeout(10000);const errors=[];p.on('pageerror',e=>errors.push(e.message));
 for(const ad of [false,true]){
  await p.goto('https://www.youtube.com/watch?v=abcdefghijk'+(ad?'&ad=1':''));await p.locator('#iy-header').waitFor();
  await p.locator('video').evaluate(v=>v.play());
  await p.getByRole('status').filter({hasText:'Video finished.'}).waitFor();
  assert.equal(await p.evaluate(()=>window.autoNext),0);assert.equal(await p.evaluate(()=>window.adCompleted),ad?1:0);assert.equal(await p.locator('video').evaluate(v=>v.ended&&v.paused),true);
  results.push(ad?'Ad completion preserved, subsequent content auto-advance blocked':'Real HTMLVideo ended event intercepted before next-video handler');
  if(!ad){await p.locator('video').evaluate(v=>v.play());await p.waitForTimeout(300);assert.equal(await p.getByRole('status').count(),0);await p.getByRole('status').filter({hasText:'Video finished.'}).waitFor();results.push('Replay clears completion state and can finish again');}
 }
 await p.setViewportSize({width:600,height:850});await p.screenshot({path:'/tmp/intentional-wxt-qa/fixture-narrow.png'});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);results.push('Narrow player UI has no horizontal overflow');
 assert.deepEqual(errors,[]);console.log('PASS',results);
} catch(e){console.error(e);results.push('FAILED: '+e);process.exitCode=1;}finally{await writeFile('/tmp/intentional-wxt-qa/fixture-results.json',JSON.stringify(results,null,2));await ctx.close();}

import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
const output=process.env.IY_EVIDENCE_DIR||'/tmp/intentional-wxt-qa';
await mkdir(output,{recursive:true});
const profile=await mkdtemp(path.join(tmpdir(),'intentional-wxt-'));
const ext=path.resolve('.output/chrome-mv3');
const ctx=await chromium.launchPersistentContext(profile,{channel:'chromium',headless:true,args:[`--disable-extensions-except=${ext}`,`--load-extension=${ext}`],viewport:{width:1440,height:900}});
ctx.setDefaultTimeout(20000);
const results=[];const pageErrors=[];
function pass(name,details=''){results.push({name,status:'pass',details});console.log('PASS',name,details);}
try {
 const worker=ctx.serviceWorkers()[0]||await ctx.waitForEvent('serviceworker');
 const base=worker.url().split('/').slice(0,3).join('/');
 const page=await ctx.newPage();page.on('pageerror',e=>pageErrors.push(e.stack||e.message));
 const go=async url=>{await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});};
 await go(base+'/search.html');await page.getByRole('heading',{name:'What are you here for?'}).waitFor();await page.evaluate(()=>document.fonts.ready);
 assert.equal(await page.title(),'Unloop — Search with a purpose');
 await page.screenshot({path:path.join(output,'search-desktop.png')});
 const box=await page.locator('.search-field').boundingBox();assert.ok(Math.abs(box.width-760)<1&&Math.abs(box.height-72)<1);
 assert.equal(await page.locator('input').getAttribute('data-slot'),'input');
 assert.equal(await page.locator('button[type=submit]').getAttribute('data-slot'),'button');
 pass('Paper search geometry and registry components');
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(output,'search-mobile.png')});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);pass('Mobile search without horizontal overflow');
 await page.setViewportSize({width:1440,height:900});
 await page.locator('#query').fill('learn javascript');await page.getByRole('button',{name:'Search YouTube'}).click();
 await page.waitForURL(u=>u.pathname==='/results');await page.locator('ytd-video-renderer a#video-title').first().waitFor({timeout:30000});
 await page.waitForTimeout(1500);await page.screenshot({path:path.join(output,'search-results.png')});
 assert.equal(await page.locator('grid-shelf-view-model:has(a[href^="/shorts/"]):visible').count(),0);pass('Live search and Shorts suppression');
 const video=page.locator('ytd-video-renderer a#video-title').first();const href=await video.getAttribute('href');
 await video.click();await page.waitForURL(u=>u.pathname==='/watch');
 await page.locator('#iy-header').waitFor();await page.locator('#iy-details h1').waitFor();await page.waitForTimeout(3000);
 assert.equal(await page.locator('video').count()>0,true);assert.equal(await page.locator('#secondary').isVisible(),false);assert.equal(await page.locator('#comments').isVisible(),false);
 const toggle=page.locator('.ytp-autonav-toggle-button');if(await toggle.count())assert.equal(await toggle.getAttribute('aria-checked'),'false');
 await page.screenshot({path:path.join(output,'watch-desktop.png'),fullPage:true});
 const playerBox=await page.locator('#movie_player').boundingBox();console.log('PLAYER_GEOMETRY',playerBox);assert.ok(Math.abs(playerBox.y-164)<3,'Player must sit below the Paper header');
 pass('Live search → focused native player; autoplay off');
 await page.setViewportSize({width:600,height:850});await page.screenshot({path:path.join(output,'watch-narrow.png'),fullPage:true});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.setViewportSize({width:1440,height:900});
 assert.equal(await page.locator('ytd-watch-metadata #description.ytd-watch-metadata').isVisible(),true);
 let creator=page.locator('ytd-watch-metadata #owner a[href^="/@"],ytd-watch-metadata #owner a[href^="/channel/"]').first();
 if(!await creator.count()){
  await page.locator('ytd-watch-metadata #attributed-channel-name a[role="button"]').click();
  creator=page.locator('ytd-popup-container a[href^="/@"],ytd-popup-container a[href^="/channel/"]').filter({visible:true}).first();
 }
 await creator.waitFor();const creatorUrl=await creator.getAttribute('href');
 assert.match(creatorUrl,/\/(?:@|channel\/)/);
 await creator.click();await page.waitForURL(u=>u.pathname.endsWith('/videos'));await page.locator('ytd-browse').filter({visible:true}).first().waitFor({timeout:20000});
 assert.equal(await page.locator('#iy-header').count(),0);assert.equal(await page.getByRole('tab',{name:'Shorts',exact:true}).count(),0);await page.screenshot({path:path.join(output,'creator-videos.png')});pass('Creator bypass from actual video metadata',page.url());
 const channelBase=new URL(page.url());channelBase.pathname=channelBase.pathname.replace(/\/videos\/?$/,'');channelBase.search='';
 await go(channelBase.href);await page.waitForURL(u=>u.pathname.endsWith('/videos'));pass('Creator root opens Videos',page.url());
 for(const tab of ['streams','playlists']){
  await page.getByRole('tab',{name:tab==='streams'?'Live':'Playlists',exact:true}).click();await page.waitForURL(u=>u.pathname.endsWith('/'+tab));await page.waitForTimeout(2000);assert.ok(new URL(page.url()).pathname.endsWith('/'+tab));
  assert.equal(await page.locator('html.iy-blocked').count(),0);await page.screenshot({path:path.join(output,`creator-${tab}.png`)});pass(`Creator ${tab} bypass`);
 }
 const playlist=page.locator('a[href^="/playlist?list="]').filter({hasText:'View full playlist'}).first();
 if(await playlist.count()){
  const playlistHref=await playlist.getAttribute('href');await go(new URL(playlistHref,'https://www.youtube.com').href);await page.waitForTimeout(2000);
  assert.equal(new URL(page.url()).pathname,'/playlist');pass('Playlist contents accessible');
  const item=page.locator('a[href^="/watch?"][href*="index="]').first();
  await item.waitFor({timeout:20000});if(await item.count()){await item.click();await page.waitForURL(u=>u.pathname==='/watch'&&!u.searchParams.has('list'));pass('Manual playlist selection removes automatic queue');}
 }
 for(const url of ['https://www.youtube.com/','https://www.youtube.com/shorts/abcdefghijk',channelBase.href+'/shorts','https://www.youtube.com/feed/subscriptions','https://music.youtube.com/']){
  await go(url);await page.waitForURL(base+'/search.html');pass('Blocked route',url);
 }
 await go('https://www.youtube.com'+href);await page.locator('#iy-header').waitFor();
 await page.getByRole('button',{name:'Done watching',exact:true}).first().click();await page.waitForURL(base+'/search.html?done=1');await page.getByRole('heading',{name:"You're done for now."}).waitFor();pass('Done watching ends the session');
 await page.getByRole('button',{name:'Start a new search'}).click();await page.waitForURL(base+'/search.html');pass('New intention returns to search');
 await go('https://www.youtube.com/results?search_query=learn');
 await page.evaluate(()=>history.pushState({},'', '/@username/shorts'));await page.waitForURL(base+'/search.html');pass('History-only Shorts navigation blocked');
 const extensionErrors=pageErrors.filter(s=>s.includes(base));assert.deepEqual(extensionErrors,[]);
 pass('No extension JavaScript errors');
 console.log('PAGE_ERRORS',JSON.stringify(pageErrors));
} catch(error) {results.push({name:'Run',status:'failed',details:String(error)});console.error(error);process.exitCode=1;}
finally {await writeFile(path.join(output,'results.json'),JSON.stringify({results,pageErrors},null,2));await ctx.close();}

import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
const output=path.resolve('output/playwright');await mkdir(output,{recursive:true});
const ext=path.resolve('.output/chrome-mv3');
const ctx=await chromium.launchPersistentContext(await mkdtemp(path.join(tmpdir(),'iy-settings-')),{channel:'chromium',headless:true,args:[`--disable-extensions-except=${ext}`,`--load-extension=${ext}`],viewport:{width:1440,height:1000}});
const results=[];const errors=[];
try{
 const worker=ctx.serviceWorkers()[0]||await ctx.waitForEvent('serviceworker');const base=worker.url().split('/').slice(0,3).join('/');
 await ctx.route('https://example.com/**',r=>r.fulfill({contentType:'text/html',body:'<h1>Destination reached</h1>'}));
 await ctx.route('https://www.youtube.com/**',r=>r.fulfill({contentType:'text/html',body:`<!doctype html><html><head><title>Validate your business idea - YouTube</title><style>body{margin:0}ytd-app{display:block;width:100%}#movie_player{height:585px;background:#171717}#top-row{display:flex;align-items:center}#owner{display:flex;gap:16px}#actions-inner{display:flex}button{padding:10px;border:0;border-radius:20px}#description{display:block}#description p{max-width:900px}ytd-watch-metadata{display:block}</style></head><body><ytd-app><ytd-watch-flexy><div id="columns"><div id="primary"><div id="primary-inner"><div id="player"><div id="movie_player" class="html5-video-player"><video></video><button class="ytp-autonav-toggle-button" aria-checked="true" onclick="this.setAttribute('aria-checked',this.getAttribute('aria-checked')!=='true')">Autoplay</button></div></div><div id="below"><ytd-watch-metadata><h1><yt-formatted-string>Validate your business idea</yt-formatted-string></h1><div id="top-row"><div id="owner"><ytd-channel-name><a href="/@fixture">The Validation Playbook</a></ytd-channel-name><button>Subscribe</button><button>Join</button></div><div id="actions"><div id="actions-inner"><button>Like 227</button><button>Share</button><button>Save</button><button id="more" onclick="document.querySelector('#menu').hidden=!document.querySelector('#menu').hidden">More</button><div id="menu" hidden><button>Download</button><button>Report</button></div></div></div></div><div id="description" class="ytd-watch-metadata"><div id="description-inner"><p>21,229 views · 18 hours ago</p><p>Before you build anything, make sure you’re solving a problem people actually have.</p><a id="external" target="_blank" href="/redirect?event=channel_description&q=https%3A%2F%2Fexample.com%2Flearn%3Fa%3D1%26b%3D2&redir_token=opaque">Worksheet</a><button onclick="document.querySelector('#expanded').hidden=false">Show more</button><p id="expanded" hidden>Chapters and credits</p></div></div></ytd-watch-metadata><div id="comments">Comments</div></div></div></div><div id="secondary"><div id="related">Recommendations</div></div></div></ytd-watch-flexy></ytd-app></body></html>`}));
 const watch=await ctx.newPage();watch.on('pageerror',e=>errors.push(e.message));await watch.goto('https://www.youtube.com/watch?v=abcdefghijk');await watch.locator('#iy-header').waitFor();
 for(const sel of ['#description','#owner','#actions'])assert.equal(await watch.locator(sel).isVisible(),true);
 for(const sel of ['#comments','#related'])assert.equal(await watch.locator(sel).isVisible(),false);
 await watch.getByRole('button',{name:'Show more',exact:true}).click();await watch.getByText('Chapters and credits').waitFor();
 await watch.getByRole('button',{name:'More',exact:true}).click();assert.equal(await watch.getByRole('button',{name:'Download',exact:true}).isVisible(),true);
 results.push('Native description expansion and action menu remain interactive');
 const external=ctx.waitForEvent('page');await watch.locator('#external').click();const dest=await external;await dest.waitForURL('https://example.com/learn?a=1&b=2');await dest.close();results.push('Channel-description redirect opens the exact external destination in a new tab');
 await watch.screenshot({path:path.join(output,'watch-details-fixture.png'),fullPage:true});
 const settings=await ctx.newPage();settings.on('pageerror',e=>errors.push(e.message));await settings.goto(base+'/options.html');await settings.getByText('Changes save automatically.').waitFor();
 await settings.screenshot({path:path.join(output,'settings-desktop.png'),fullPage:true});
 async function toggle(name){await settings.getByRole('switch',{name,exact:true}).click();await settings.getByText('Changes save automatically.').waitFor();}
 for(const [name,sel] of [['Description','#description'],['Creator details','#owner'],['Video actions','#actions']]){await toggle(name);await watch.locator(sel).waitFor({state:'hidden'});await toggle(name);await watch.locator(sel).waitFor({state:'visible'});}
 for(const [name,sel] of [['Comments','#comments'],['Recommendations','#related']]){await toggle(name);await watch.locator(sel).waitFor({state:'visible'});}
 await settings.reload();await settings.getByText('Changes save automatically.').waitFor();assert.equal(await settings.getByRole('switch',{name:'Comments',exact:true}).getAttribute('aria-checked'),'true');
 results.push('All metadata switches apply across tabs immediately and persist after reload');
 await toggle('Home feed');await toggle('Shorts');await toggle('Autoplay');
 const nav=await ctx.newPage();for(const route of ['/','/shorts/abcdefghijk','/@fixture/shorts']){await nav.goto('https://www.youtube.com'+route);await nav.waitForTimeout(700);assert.equal(new URL(nav.url()).pathname,route);}
 await nav.goto('https://www.youtube.com/watch?v=abcdefghijk&list=PL_123&index=2');await nav.locator('#iy-header').waitFor();assert.equal(new URL(nav.url()).searchParams.get('list'),'PL_123');
 results.push('Home and Shorts switches update actual network rules; autoplay keeps selected playlist context');
 await settings.getByRole('button',{name:'Restore defaults'}).click();await settings.getByText('Changes save automatically.').waitFor();
 for(const route of ['/','/shorts/abcdefghijk','/@fixture/shorts']){await nav.goto('https://www.youtube.com'+route);await nav.waitForURL(base+'/search.html');}
 await nav.goto('https://www.youtube.com/redirect?event=channel_description&q=https%3A%2F%2Fexample.com%2Fdirect');await nav.waitForURL('https://example.com/direct');
 results.push('Restore defaults reinstates blocking; direct redirect loads also resolve');
 await settings.setViewportSize({width:390,height:844});await settings.screenshot({path:path.join(output,'settings-mobile.png'),fullPage:true});assert.equal(await settings.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 assert.deepEqual(errors,[]);console.log('PASS',results);
}finally{await writeFile(path.join(output,'settings-results.json'),JSON.stringify({results,errors},null,2));await ctx.close();}

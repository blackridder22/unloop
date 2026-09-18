import {chromium} from 'playwright';import assert from 'node:assert/strict';import {mkdtemp,mkdir,writeFile} from 'node:fs/promises';import {tmpdir} from 'node:os';import path from 'node:path';
const ext=path.resolve('.output/chrome-mv3');const ctx=await chromium.launchPersistentContext(await mkdtemp(path.join(tmpdir(),'iy-theme-')),{channel:'chromium',headless:true,args:[`--disable-extensions-except=${ext}`,`--load-extension=${ext}`],viewport:{width:1440,height:1000},colorScheme:'light'});
const results=[];
try{
 const worker=ctx.serviceWorkers()[0]||await ctx.waitForEvent('serviceworker');const base=worker.url().split('/').slice(0,3).join('/');
 const settings=await ctx.newPage(),search=await ctx.newPage(),watch=await ctx.newPage();
 const errors=[];for(const p of [settings,search,watch])p.on('pageerror',e=>{if(e.stack?.includes(base))errors.push(e.message);});
 await settings.goto(base+'/options.html');await settings.getByRole('button',{name:'System',exact:true}).waitFor();
 await search.goto(base+'/search.html');await watch.goto('https://www.youtube.com/watch?v=PkZNo7MFNFg',{waitUntil:'domcontentloaded'});await watch.locator('#iy-header').waitFor();await watch.locator('#description.ytd-watch-metadata').waitFor();
 async function expectTheme(theme){for(const p of [settings,search,watch])await p.waitForFunction(t=>document.documentElement.dataset.iyTheme===t,theme);}
 await expectTheme('light');assert.equal(await settings.getByRole('button',{name:'System',exact:true}).getAttribute('aria-pressed'),'true');
 await settings.getByRole('button',{name:'Dark',exact:true}).click();await expectTheme('dark');
 assert.equal(await search.locator('body').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(17, 17, 17)');
 assert.equal(await watch.locator('#iy-header .brand-header').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(17, 17, 17)');
 assert.equal(await watch.locator('#description.ytd-watch-metadata').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(29, 29, 29)');
 assert.equal(await watch.locator('html').getAttribute('dark'),'');
 await mkdir('output/playwright',{recursive:true});await settings.screenshot({path:'output/playwright/theme-settings-dark.png',fullPage:true});await search.screenshot({path:'output/playwright/theme-search-dark.png'});await watch.screenshot({path:'output/playwright/theme-watch-dark.png',fullPage:true});
 results.push('Dark mode updates real YouTube metadata, shadow UI, search and settings across open tabs');
 await settings.reload();await settings.getByRole('button',{name:'Dark',exact:true}).waitFor();await settings.waitForFunction(()=>document.documentElement.dataset.iyTheme==='dark');assert.equal(await settings.getByRole('button',{name:'Dark',exact:true}).getAttribute('aria-pressed'),'true');
 for(const p of [settings,search,watch])await p.emulateMedia({colorScheme:'dark'});
 await settings.getByRole('button',{name:'Light',exact:true}).click();await expectTheme('light');
 for(const p of [settings,search,watch])await p.emulateMedia({colorScheme:'light'});
 await expectTheme('light');results.push('Saved manual theme survives reload and overrides system preference');
 await settings.getByRole('button',{name:'System',exact:true}).click();
 for(const p of [settings,search,watch])await p.emulateMedia({colorScheme:'dark'});await expectTheme('dark');
 for(const p of [settings,search,watch])await p.emulateMedia({colorScheme:'light'});await expectTheme('light');results.push('System follows live light/dark media changes without reload');
 await settings.getByRole('button',{name:'Dark',exact:true}).click();await expectTheme('dark');await settings.setViewportSize({width:390,height:844});await settings.screenshot({path:'output/playwright/theme-settings-mobile.png',fullPage:true});assert.equal(await settings.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await settings.getByRole('button',{name:'Restore defaults'}).click();await expectTheme('light');assert.equal(await settings.getByRole('button',{name:'System',exact:true}).getAttribute('aria-pressed'),'true');results.push('Responsive picker and restore-to-System verified');
 assert.deepEqual(errors,[]);console.log('PASS',results);
}finally{await writeFile('output/playwright/theme-results.json',JSON.stringify(results,null,2));await ctx.close();}

import {chromium} from 'playwright';import assert from 'node:assert/strict';import {mkdtemp,mkdir} from 'node:fs/promises';import {tmpdir} from 'node:os';import path from 'node:path';
const ext=path.resolve('.output/chrome-mv3');const ctx=await chromium.launchPersistentContext(await mkdtemp(path.join(tmpdir(),'iy-details-')),{channel:'chromium',headless:true,args:[`--disable-extensions-except=${ext}`,`--load-extension=${ext}`],viewport:{width:1440,height:1000}});
try{
 const p=await ctx.newPage();await p.goto('https://www.youtube.com/watch?v=PkZNo7MFNFg',{waitUntil:'domcontentloaded'});await p.locator('#iy-details h1').waitFor();
 const description=p.locator('#description.ytd-watch-metadata');await description.waitFor();
 await description.locator('#expand').click();await description.locator('#collapse').waitFor();
 assert.ok(await description.locator('a[href]').count()>0);console.log('PASS Live description expands with links and chapters');
 await description.locator('#collapse').click();
 await p.evaluate(()=>document.documentElement.setAttribute('dark',''));
 await p.waitForTimeout(700);await mkdir('output/playwright',{recursive:true});await p.screenshot({path:'output/playwright/watch-dark-preference.png',fullPage:true});
 console.log('GEOMETRY',await p.locator('#below,ytd-watch-metadata,#description.ytd-watch-metadata').evaluateAll(els=>els.map(el=>({node:el.tagName,id:el.id,rect:{x:el.getBoundingClientRect().x,width:el.getBoundingClientRect().width},margin:getComputedStyle(el).margin,padding:getComputedStyle(el).padding,color:getComputedStyle(el).color}))));
 const w=ctx.serviceWorkers()[0];const base=w.url().split('/').slice(0,3).join('/');const s=await ctx.newPage();await s.goto(base+'/options.html');await s.getByText('Changes save automatically.').waitFor();
 for(const [name,selector] of [['Description','#description.ytd-watch-metadata'],['Creator details','ytd-watch-metadata #owner'],['Video actions','ytd-watch-metadata #actions']]){await s.getByRole('switch',{name,exact:true}).click();await s.getByText('Changes save automatically.').waitFor();await p.locator(selector).waitFor({state:'hidden'});await s.getByRole('switch',{name,exact:true}).click();await s.getByText('Changes save automatically.').waitFor();await p.locator(selector).waitFor({state:'visible'});}
 console.log('PASS Visibility switches control the real YouTube metadata');
 await p.setViewportSize({width:390,height:844});await p.screenshot({path:'output/playwright/watch-390.png',fullPage:true});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
}finally{await ctx.close();}

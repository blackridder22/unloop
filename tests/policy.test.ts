import {defaults,normalizeSettings} from '../lib/settings';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {classify,searchTarget} from '../lib/policy';
import {readFileSync} from 'node:fs';
const origin='https://www.youtube.com';
test('every creator can use Videos, Live and Playlists, including Unicode handles',()=>{
 for(const creator of ['@username','@freecodecamp','@日本語','@hello.world','channel/UC123','c/example','user/example']) {
  for(const tab of ['videos','streams','playlists'])assert.equal(classify(`${origin}/${creator}/${tab}`).kind,'creator');
  assert.deepEqual(classify(`${origin}/${creator}`),{kind:'creator',url:`${origin}/${encodeURI(creator)}/videos`});
 }
});
test('creator home routes go to Videos, never a trailer or home feed',()=>{
 assert.deepEqual(classify(origin+'/@username/featured'),{kind:'creator',url:origin+'/@username/videos'});
});
test('Shorts, feeds, and unsupported creator tabs remain blocked',()=>{
 for(const path of ['/','/shorts/abcdefghijk','/feed/subscriptions','/@name/shorts','/@name/community','/@name/posts','/results?search_query=%20','/watch?v=bad','/playlist?list='])assert.equal(classify(origin+path).kind,'blocked',path);
 for(const raw of ['https://youtube.com.evil.test/watch?v=abcdefghijk','ftp://www.youtube.com/@name/videos','javascript:alert(1)'])assert.equal(classify(raw).kind,'blocked');
});
test('playlist browsing works but video links lose automatic queue context',()=>{
 assert.equal(classify(origin+'/playlist?list=PL_123').kind,'playlist');
 assert.deepEqual(classify(origin+'/watch?v=abcdefghijk&list=PL_123&index=2&autoplay=1&t=30'),{kind:'watch',url:origin+'/watch?v=abcdefghijk&t=30'});
});
test('search supports explicit creator URLs, videos, short links and safe text encoding',()=>{
 assert.equal(searchTarget('  '),null);
 assert.equal(searchTarget('C++ & design'),origin+'/results?search_query=C%2B%2B%20%26%20design');
 assert.equal(searchTarget('https://youtu.be/abcdefghijk?t=30'),origin+'/watch?v=abcdefghijk&t=30');
 assert.equal(searchTarget(origin+'/@username'),origin+'/@username/videos');
 assert.equal(searchTarget(origin+'/@username/playlists'),origin+'/@username/playlists');
 assert.ok(searchTarget('https://evil.test/watch?v=abcdefghijk')?.includes('/results?'));
});
test('network rules admit approved routes and reject Shorts directly',()=>{
 const rules=JSON.parse(readFileSync(new URL('../public/rules.json',import.meta.url),'utf8'));
 const allowed=(path:string)=>rules.some((r:any)=>r.action.type==='allow' && new RegExp(r.condition.regexFilter).test(origin+path));
 for(const path of ['/@name','/@name/videos','/@name/streams','/@name/playlists','/playlist?list=PL_123','/watch?v=abcdefghijk','/results?search_query=learn'])assert.equal(allowed(path),true,path);
 for(const path of ['/','/@name/shorts','/shorts/abcdefghijk','/feed/subscriptions','/@name/posts'])assert.equal(allowed(path),false,path);
});

test('description redirects unwrap web destinations and preserve native token-only redirects',()=>{
 const redirect=(target:string)=>origin+'/redirect?event=channel_description&q='+encodeURIComponent(target)+'&redir_token=opaque';
 assert.deepEqual(classify(redirect('https://example.com/learn?a=1&b=2')),{kind:'redirect',url:'https://example.com/learn?a=1&b=2'});
 assert.deepEqual(classify(redirect(origin+'/@creator')),{kind:'creator',url:origin+'/@creator/videos'});
 assert.equal(classify(redirect(origin+'/shorts/abcdefghijk')).kind,'blocked');
 assert.equal(classify(redirect('javascript:alert(1)')).kind,'blocked');
 assert.equal(classify(redirect('data:text/html,test')).kind,'blocked');
 assert.equal(classify(redirect('https://user:pass@example.com')).kind,'blocked');
 assert.equal(classify(origin+'/redirect?event=channel_description&redir_token=opaque').kind,'redirect');
 assert.equal(classify(redirect('https://youtu.be/abcdefghijk?t=30')).kind,'watch');
 let nested='https://example.com';for(let i=0;i<8;i++)nested=redirect(nested);assert.equal(classify(nested).kind,'blocked');
});

test('settings are validated and enabled routes respect individual choices',()=>{
 assert.deepEqual(normalizeSettings({description:false,shorts:'true'}),{...defaults,description:false});
 const enabled={...defaults,homeFeed:true,shorts:true,autoplay:true};
 assert.equal(classify(origin+'/',enabled).kind,'home');
 assert.equal(classify(origin+'/shorts/abcdefghijk',enabled).kind,'shorts');
 assert.equal(classify(origin+'/@name/shorts',enabled).kind,'shorts');
 assert.deepEqual(classify(origin+'/watch?v=abcdefghijk&list=PL_123&index=2',enabled),{kind:'watch',url:origin+'/watch?v=abcdefghijk&list=PL_123&index=2'});
 assert.equal(classify(origin+'/feed/subscriptions',enabled).kind,'blocked');
});

test('YouTube Music passes through unchanged, including queues and description links',()=>{
 for(const path of ['/','/explore','/library','/watch?v=abcdefghijk&list=RDAMVMabcdefghijk&index=2&autoplay=1','/playlist?list=PL_123']){
  const url='https://music.youtube.com'+path;
  assert.deepEqual(classify(url),{kind:'redirect',url});
  assert.equal(searchTarget(url),url);
  assert.deepEqual(classify(origin+'/redirect?q='+encodeURIComponent(url)),{kind:'redirect',url});
 }
 for(const url of ['https://music.youtube.com.evil.test/','https://music.youtube.com@evil.test/','https://user:pass@music.youtube.com/','ftp://music.youtube.com/'])assert.equal(classify(url).kind,'blocked');
});

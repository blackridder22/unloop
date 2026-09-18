import React, { useState } from 'react';
import {createRoot} from 'react-dom/client';
import {ArrowRight, Search} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Brand} from '@/components/Brand';
import {useSettings} from '@/lib/use-settings';
import {searchTarget} from '@/lib/policy';
import '@/styles/app.css';
function SearchPage() {
  const {settings}=useSettings();
  const [query,setQuery]=useState('');
  const done=new URLSearchParams(location.search).has('done');
  return <div className="search-page"><Brand home="search.html"/><main className="search-workspace">
    <div className="search-heading"><h1>{done ? "You're done for now." : 'What are you here for?'}</h1><p>{done ? 'Close this tab and get back to your day.' : 'Find the video you need. Then get on with your day.'}</p></div>
    {!done ? <><form className="search-field" onSubmit={event=>{event.preventDefault();const target=searchTarget(query,settings);if(target)location.assign(target);}}><Search size={22} strokeWidth={1.6} aria-hidden="true"/><label className="sr-only" htmlFor="query">Search YouTube or paste a video link</label><Input unstyled className="search-input" id="query" type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search YouTube or paste a video link" autoComplete="off" required autoFocus/><Button className="search-submit" type="submit" size="icon" aria-label="Search YouTube"><ArrowRight size={22} strokeWidth={1.7}/></Button></form><p className="search-hint">Just search and video. No feed to fall into.</p></> : <Button variant="outline" className="new-search" onClick={()=>location.replace('search.html')}>Start a new search <ArrowRight size={16}/></Button>}
  </main><footer className="search-footer"><span>YouTube, on your terms.</span><div>{!settings.shorts&&<span>No Shorts</span>}{!settings.recommendations&&<span>No recommendations</span>}{!settings.autoplay&&<span>No autoplay</span>}</div></footer></div>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><SearchPage/></React.StrictMode>);

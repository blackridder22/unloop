import {ArrowLeft,ArrowRight,ToggleLeft} from 'lucide-react';
import {Brand} from './Brand';
import {Button} from './ui/button';
export function WatchHeader({home,back}: {home:string;back:string}) {
 return <><Brand home={home}/><nav className="watch-navigation" aria-label="Video navigation"><Button variant="ghost" onClick={()=>location.assign(back)}><ArrowLeft size={16}/>Back to search</Button><Button variant="ghost" onClick={()=>location.assign(home+'?done=1')}>Done watching<ArrowRight size={16}/></Button></nav></>;
}
export function WatchDetails({title,creator,creatorUrl,ended,home,showCreator,autoplay}:{title:string;creator:string;creatorUrl:string;ended:boolean;home:string;showCreator:boolean;autoplay:boolean}) {
 return <div className="watch-details"><div><h1>{title || 'Loading video…'}</h1>{showCreator && creator && <a className="creator-link" href={creatorUrl}>{creator}</a>}{ended && <p className="finished-note" role="status">Video finished. <Button variant="link" onClick={()=>location.assign(home+'?done=1')}>Done watching<ArrowRight size={14}/></Button></p>}</div><span className="autoplay-status"><ToggleLeft size={16} strokeWidth={1.3}/>Autoplay {autoplay?'on':'off'}</span></div>;
}

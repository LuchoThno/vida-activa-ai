import {NextResponse} from 'next/server';
function plain(s:string){return s.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim()}
export async function GET(){
 try {const r=await fetch('https://wger.de/api/v2/exerciseinfo/?limit=35&offset=0&format=json',{next:{revalidate:86400},signal:AbortSignal.timeout(9000)});
 if(!r.ok)throw Error('source unavailable'); const d=await r.json();
 const items=(d.results||[]).map((x:any)=>{const t=(x.translations||[]).find((t:any)=>t.language===4&&(t.name||'').trim())||(x.translations||[]).find((t:any)=>t.language===2&&(t.name||'').trim())||(x.translations||[]).find((t:any)=>(t.name||'').trim()); const media=(x.images||[]).find((i:any)=>i.image); const video=(x.videos||[]).find((v:any)=>v.video); return {id:String(x.id),title:t?.name||'',description:plain(t?.description||''),image:media?.image||'',video:video?.video||'',source:`https://wger.de/en/exercise/${x.id}/`,category:x.category?.name||'Ejercicio',equipment:(x.equipment||[]).map((e:any)=>e.name).join(', ')||'Sin material especificado'}}).filter((x:any)=>x.title).slice(0,24);
 return NextResponse.json({items,source:'wger'});
 }catch{return NextResponse.json({items:[],error:'No se pudo conectar con la fuente de ejercicios.'},{status:503})}
}

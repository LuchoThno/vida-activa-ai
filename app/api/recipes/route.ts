import {NextRequest,NextResponse} from 'next/server';
export async function GET(req:NextRequest){
 const q=(req.nextUrl.searchParams.get('q')||'chicken').trim().slice(0,60);
 try {const r=await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(q)}`,{next:{revalidate:3600},signal:AbortSignal.timeout(9000)});
 if(!r.ok)throw Error('source unavailable'); const data=await r.json();
 const meals=(data.meals||[]).slice(0,18).map((m:Record<string,string>)=>({id:m.idMeal,title:m.strMeal,image:m.strMealThumb,category:m.strCategory,origin:m.strArea,source:`https://www.themealdb.com/meal/${m.idMeal}`,video:m.strYoutube||'',instructions:m.strInstructions||'',ingredients:Array.from({length:20},(_,i)=>({name:m[`strIngredient${i+1}`]?.trim(),amount:m[`strMeasure${i+1}`]?.trim()})).filter(x=>x.name)}));
 return NextResponse.json({items:meals,source:'TheMealDB',nutrition:'not_available'});
 }catch{return NextResponse.json({items:[],error:'No se pudo conectar con la fuente de recetas.'},{status:503})}
}

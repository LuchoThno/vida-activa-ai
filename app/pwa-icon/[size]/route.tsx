import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export async function GET(_request: Request, { params }: { params: Promise<{size: string}> }) {
  const { size: requestedSize } = await params;
  const size = Number(requestedSize);
  if (![180, 192, 512].includes(size)) return new Response('Not found', { status: 404 });
  const scale = size / 512;
  return new ImageResponse(
    <div style={{display:'flex',width:'100%',height:'100%',background:'#438f74',alignItems:'center',justifyContent:'center',borderRadius:Math.round(110*scale),position:'relative'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',width:Math.round(350*scale),height:Math.round(350*scale),borderRadius:Math.round(105*scale),background:'#ecf8f0'}}>
        <span style={{fontSize:Math.round(180*scale),fontWeight:800,color:'#27684f',letterSpacing:-Math.round(16*scale)}}>VA</span>
      </div>
    </div>,
    { width:size,height:size,headers:{'Cache-Control':'public, max-age=86400'} }
  );
}

import React from 'react';
import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(_request: Request, context: { params: Promise<{ size: string }> }) {
  const { size: sizeParam } = await context.params;
  const size = Number(sizeParam);
  if (size !== 180 && size !== 192 && size !== 512) {
    return new Response('Not found', { status: 404 });
  }
  const square = React.createElement('div', {
    style: {
      display: 'flex', width: '100%', height: '100%',
      background: '#2f8a67', alignItems: 'center', justifyContent: 'center'
    }
  }, React.createElement('div', {
    style: {
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      width: '68%', height: '68%', borderRadius: '24%',
      background: '#ecf8f0', fontWeight: 800,
      fontSize: Math.round(size * .30), color: '#27684f'
    }
  }, 'VA'));
  return new ImageResponse(square, {
    width: size, height: size,
    headers: { 'Cache-Control': 'public, max-age=86400' }
  });
}

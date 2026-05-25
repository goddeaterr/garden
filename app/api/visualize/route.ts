import { NextRequest, NextResponse } from 'next/server';
import OpenAI, { toFile } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { canvasImage } = await req.json() as { canvasImage: string };

    if (!canvasImage) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 });
    }

    const raw = canvasImage.replace(/^data:image\/\w+;base64,/, '');
    const buf = Buffer.from(raw, 'base64');
    const mime = canvasImage.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
    const file = await toFile(buf, 'garden.jpg', { type: mime });

    const response = await openai.images.edit({
      model: 'gpt-image-1.5',
      image: file,
      prompt:
        "Make the plants PNG's that are in this garden background actually look realistic as if they are really growing in this garden, without changing the garden itself.",
      size: '1024x1024',
      quality: 'high',
    });

    const b64 = response.data?.[0]?.b64_json;
    if (!b64) {
      return NextResponse.json({ error: 'No image returned' }, { status: 502 });
    }

    return NextResponse.json({ result: `data:image/png;base64,${b64}` });

  } catch (err) {
    console.error('Visualize error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}

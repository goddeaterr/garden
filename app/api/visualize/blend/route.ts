import { NextRequest, NextResponse } from 'next/server';
import OpenAI, { toFile } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function b64ToFile(b64: string, filename: string) {
  const raw = b64.replace(/^data:image\/\w+;base64,/, '');
  const buf = Buffer.from(raw, 'base64');
  const isJpeg = b64.startsWith('data:image/jpeg');
  return toFile(buf, filename, { type: isJpeg ? 'image/jpeg' : 'image/png' });
}

export async function POST(req: NextRequest) {
  try {
    const { compositeImage, backgroundImage } = await req.json() as {
      compositeImage: string;
      backgroundImage: string | null;
    };

    if (!compositeImage) {
      return NextResponse.json({ error: 'No composite image provided' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 });
    }

    // Send background first (reference), then the composite so the model understands
    // exactly what the untouched garden looks like vs what was added
    const imageFiles = [];
    if (backgroundImage) {
      imageFiles.push(await b64ToFile(backgroundImage, 'original_garden.jpg'));
    }
    imageFiles.push(await b64ToFile(compositeImage, 'composite.png'));

    const prompt = backgroundImage
      ? `You are a professional photo retoucher specialising in garden and landscape photography.

You are given two images:
- Image 1: The ORIGINAL garden photograph — untouched, no plants added. This is your ground truth for the background. Every pixel of this scene (the grass, the brick wall, the background trees, the overcast sky, the overall light direction) must be preserved exactly in the final output.
- Image 2: The same garden photo with realistic plant images digitally composited onto it at correct positions. The plants are in the right places but look digitally pasted — their edges are too crisp, their lighting does not match the garden's diffuse overcast light, and they have no ground shadow.

Your task: Produce a single photorealistic garden photograph that looks like it was shot by a professional photographer on the same overcast day as the original. Specifically:
1. Keep every plant at its exact position — do not move, scale, or remove any plant.
2. Blend the base of each plant into the grass or soil: the stems and lower leaves should emerge naturally from the ground with no hard edge or halo.
3. Add a soft elliptical cast shadow under each plant on the ground, matching the flat overcast light direction already visible in the original photo (no strong directional shadow — diffuse and gentle).
4. Subtly adjust each plant's colour temperature and brightness to match the cool, soft ambient light of the scene.
5. Apply a very gentle depth-of-field softening to plants that are closer to the background wall, consistent with a camera focused on the mid-ground.
6. The final image must look indistinguishable from a real photograph — not a render, not a composite, not a painting.

Do NOT alter the garden background (grass, wall, trees, sky) in any way.`
      : `You are a professional photo retoucher specialising in garden and landscape photography.

This image is a garden photo with realistic plant images digitally composited onto it. The plants are in the correct positions but look digitally pasted — their edges are too crisp, they lack natural ground shadows, and their lighting does not match the garden's ambient conditions.

Your task: Transform this into a single, cohesive, photorealistic garden photograph that looks like it was shot on location. Specifically:
1. Keep every plant exactly where it is — do not move, scale, or remove any plant.
2. Blend the base of each plant naturally into the grass and soil — no hard edges or halos.
3. Add a soft diffuse cast shadow under each plant on the ground surface.
4. Adjust each plant's colour and brightness to match the scene's ambient light.
5. Apply gentle depth-of-field softening to background plants.
6. The result must look like a single real photograph, not a composite.

Do NOT change the garden background.`;

    const response = await openai.images.edit({
      model: 'gpt-image-1',
      image: imageFiles.length === 1 ? imageFiles[0] : imageFiles as unknown as ReturnType<typeof toFile> extends Promise<infer F> ? F : never,
      prompt,
      size: '1024x1024',
      quality: 'high',
    });

    const b64 = response.data?.[0]?.b64_json;
    if (!b64) {
      return NextResponse.json({ error: 'No image returned from model' }, { status: 502 });
    }

    return NextResponse.json({ result: `data:image/png;base64,${b64}` });

  } catch (err) {
    console.error('Blend error:', err);
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

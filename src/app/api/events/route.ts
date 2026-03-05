import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';

const eventSchema = z.object({
  type: z.enum(['click', 'outbound', 'cta_view']),
  page_slug: z.string().min(1),
  target_url: z.string().optional(),
  product_id: z.string().uuid().optional(),
  position: z.number().int().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = eventSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const { data } = parsed;
    const userAgent = req.headers.get('user-agent') ?? undefined;
    const referer = req.headers.get('referer') ?? undefined;

    await supabase.from('events').insert({
      type: data.type,
      page_slug: data.page_slug,
      target_url: data.target_url,
      product_id: data.product_id,
      position: data.position,
      user_agent: userAgent,
      referer: referer,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

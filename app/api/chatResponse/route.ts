import { NextResponse, NextRequest } from 'next/server';
import OpenAI from 'openai';
import { env } from '../../../config/env';

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const message = body.message;

  if (env.PROMPT) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: env.PROMPT },
          { role: 'user', content: message },
        ],
      });

      console.log('Response:', response);
      return NextResponse.json(response);
    } catch (error) {
      console.error('Error processing message:', error);
      return NextResponse.error();
    }
  } else {
    console.error('No prompt provided');
    return NextResponse.error();
  }
}

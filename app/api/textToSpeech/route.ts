//use openai text-to-speech, from a request you have to return an audio using the model tts-1
import { NextResponse, NextRequest } from 'next/server';
import fs from 'fs';
import * as dotenv from 'dotenv';
import OpenAI from 'openai';
import { env } from '../../../config/env';

dotenv.config();

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const text = body.text;
  const filePath = 'tmp/output.mp3';

  try {
    const response = await openai.audio.speech.create({
      input: text,
      model: 'tts-1',
      voice: 'alloy',
      response_format: 'mp3',
    });

    const data = await response.arrayBuffer();
    fs.writeFileSync(filePath, Buffer.from(data));
    const audio = fs.readFileSync(filePath);
    fs.unlinkSync(filePath);

    console.log('Audio:', data);
    return NextResponse.json({ audio: audio.toString('base64') });
  } catch (error) {
    console.error('Error processing text:', error);
    return NextResponse.error();
  }
}

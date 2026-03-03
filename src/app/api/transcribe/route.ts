import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

// Initialize ZAI instance
let zaiInstance: any = null;

async function getZAIInstance() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

// POST transcribe audio to text using ASR
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { audioData } = body;

    if (!audioData) {
      return NextResponse.json(
        { error: 'Audio data is required' },
        { status: 400 }
      );
    }

    // Use z-ai-web-dev-sdk for ASR
    const zai = await getZAIInstance();

    // Remove data URL prefix if present (e.g., "data:audio/webm;base64,")
    const base64Audio = audioData.includes(',')
      ? audioData.split(',')[1]
      : audioData;

    const response = await zai.audio.asr.create({
      file_base64: base64Audio
    });

    return NextResponse.json({ transcription: response.text });
  } catch (error) {
    console.error('Error transcribing audio:', error);
    return NextResponse.json(
      { error: 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}

// Local test runner for processAudio logic
// Run from backend directory with: npx ts-node src/test-process-audio.ts
import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

const ASSEMBLYAI_API_KEY = '39211856f7bf4e6e9eed34d05d344a00';

async function test() {
  console.log('[1] Testing AssemblyAI upload...');
  
  // Create a tiny fake audio buffer (simulate small file)
  const fakeBuffer = Buffer.alloc(1024, 0);
  
  try {
    const uploadRes = await axios.post('https://api.assemblyai.com/v2/upload', fakeBuffer, {
      headers: {
        authorization: ASSEMBLYAI_API_KEY,
        'content-type': 'application/octet-stream'
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity
    });
    console.log('[2] Upload response:', uploadRes.data);
    
    const audioUrl = uploadRes.data.upload_url;
    
    console.log('[3] Starting transcription with speech_model=best, language_code=es...');
    const transcriptRes = await axios.post('https://api.assemblyai.com/v2/transcript', {
      audio_url: audioUrl,
      language_code: 'es',
      speech_model: 'best'
    }, {
      headers: { authorization: ASSEMBLYAI_API_KEY }
    });
    console.log('[4] Transcription started:', transcriptRes.data);
  } catch (e: any) {
    console.error('ERROR at step:', e.message);
    console.error('Response status:', e.response?.status);
    console.error('Response data:', JSON.stringify(e.response?.data, null, 2));
  }
}

test();

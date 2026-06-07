// voice.js

// voice.js

// ⚠️ Hardcoded API key (not secure for production)
const API_KEY = "sk_3a859fa851fe553bc78e844d599a0211621d536f6e1ae097";

// Your ElevenLabs voice ID
const VOICE_ID = "tV5ScfLKKNm3uOQthVMZ";

// ElevenLabs TTS endpoint
const TTS_URL = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;

async function speakText(text, opts = {}){
  text = (text || '').trim();
  if (!text) return Promise.resolve();

  // ensure there's an audio player in the DOM
  let audioPlayer = document.getElementById('audioPlayer');
  if (!audioPlayer){
    audioPlayer = document.createElement('audio');
    audioPlayer.id = 'audioPlayer';
    audioPlayer.hidden = true;
    document.body.appendChild(audioPlayer);
  }

  try {
    const response = await fetch(TTS_URL, {
      method: 'POST',
      headers: {
        'xi-api-key': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text, voice_settings: { stability: 0.5, similarity_boost: 0.75 } })
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error('TTS Error:', response.status, errorText);
      throw new Error(`TTS request failed: ${response.status}`);
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    audioPlayer.src = audioUrl;
    await audioPlayer.play();
  } catch (err){
    console.error('Error generating speech:', err);
    throw err;
  }
}

// wire existing Voice Mode controls if present
const _speakBtn = document.getElementById('speakBtn');
const _voiceInput = document.getElementById('voiceInput');
if (_speakBtn && _voiceInput){
  _speakBtn.addEventListener('click', async () => {
    const text = (_voiceInput.value || '').trim();
    if (!text) { alert('Please enter text to speak.'); return; }

    _speakBtn.disabled = true; _speakBtn.textContent = 'Speaking...';
    try { await speakText(text); }
    catch (err){ alert('Error generating speech: ' + (err.message || err)); }
    finally { _speakBtn.disabled = false; _speakBtn.textContent = 'Speak'; }
  });
}

// expose globally for UI integrations
window.speakText = speakText;

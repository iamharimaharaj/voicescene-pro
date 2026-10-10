import { useState } from 'react';
import { AudioLines, ArrowUpRight, Download, Globe2, LoaderCircle, Mic2, Sparkles, Volume2 } from 'lucide-react';
import { LANGUAGES, MAX_TEXT_LENGTH, PACES, TONES, VOICES } from './data/voices';

type Recording = { mp3Base64: string; wavBase64: string; duration: number; voice: string; label: string; filename: string };
export default function App() {
  const [text, setText] = useState('');
  const [languageId, setLanguageId] = useState('en');
  const language = LANGUAGES.find(item => item.id === languageId)!;
  const [region, setRegion] = useState('United States');
  const [gender, setGender] = useState('female');
  const [voice, setVoice] = useState('Sulafat');
  const [tone, setTone] = useState<string>('Natural');
  const [pace, setPace] = useState<string>('Normal');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [recording, setRecording] = useState<Recording | null>(null);

  async function generate() {
    if (busy || !text.trim()) return;
    setBusy(true);
    setError('');
    const label = `${voice} · ${language.name} · ${region} · ${tone} · ${pace}`;
    try {
      const response = await fetch('/api/tts/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script: text, voice, language: languageId, region, tone, pace }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to generate audio. Please try again.');
      setRecording({ ...data, label, filename: `Voiceover-Pro-${languageId}-${voice}-${Date.now()}` });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to connect. Please try again.');
    } finally { setBusy(false); }
  }

  return <div className="studio">
    <header className="topbar"><a className="brand" href="/"><span className="brand-icon"><AudioLines size={23}/></span>Voiceover<span className="pro">PRO</span></a><span className="header-note"><span className="status-dot"/>Text to voice</span></header>
    <main>
      <div className="intro"><div><p className="eyebrow">YOUR WORDS. A WORLD OF VOICES.</p><h1>Give your words a voice<span>.</span></h1><p className="subtitle">From a first idea to a finished voiceover. Make it sound like you imagined.</p></div><span className="intro-icon"><Mic2 size={34}/></span></div>
      <div className="workspace">
        <section className="editor panel" aria-labelledby="editor-heading">
          <div className="panel-heading"><div><span className="step">01</span><h2 id="editor-heading">Your text</h2></div><button className="text-button" disabled={busy} onClick={() => setText(language.sample)}><Sparkles size={15}/>Try a sample</button></div>
          <label className="sr-only" htmlFor="script">Text to speak</label>
          <textarea id="script" lang={languageId} value={text} disabled={busy} onChange={event => setText(event.target.value)} maxLength={MAX_TEXT_LENGTH} placeholder={languageId === 'ne' ? 'यहाँ आफ्नो नेपाली पाठ लेख्नुहोस् वा टाँस्नुहोस्…' : 'Write or paste your text here. A story, a script, a big idea…'} />
          <div className="editor-footer"><span>Write in the language you choose below.</span><span>{text.length.toLocaleString()} / {MAX_TEXT_LENGTH.toLocaleString()}</span></div>
          <div className="language-row"><Globe2 size={18}/><div><label htmlFor="language">Language</label><select id="language" disabled={busy} value={languageId} onChange={event => { const next = LANGUAGES.find(item => item.id === event.target.value)!; setLanguageId(next.id); setRegion(next.regions[0]); }}>
            {LANGUAGES.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select></div><div><label htmlFor="region">Region / accent</label><select id="region" disabled={busy} value={region} onChange={event => setRegion(event.target.value)}>{language.regions.map(item => <option key={item}>{item}</option>)}</select></div></div>
          <p className="helper">{languageId === 'ne' ? 'नेपालीमा प्रयास गर्नुहोस् — use Devanagari text for clear Nepali pronunciation.' : 'Language sets pronunciation, not translation. Regional accents are guided and may vary.'}</p>
        </section>
        <aside className="settings panel" aria-labelledby="voice-heading">
          <div className="panel-heading"><div><span className="step">02</span><h2 id="voice-heading">Make it yours</h2></div><Volume2 size={19}/></div>
          <fieldset disabled={busy}><legend>Voice</legend><div className="gender-switch">{['female', 'male'].map(item => <button key={item} aria-pressed={gender === item} className={gender === item ? 'active' : ''} onClick={() => { setGender(item); setVoice(item === 'female' ? 'Sulafat' : 'Charon'); }}>{item === 'female' ? 'Female' : 'Male'}</button>)}</div>
          <div className="voice-list">{VOICES.filter(item => item.gender === gender).map(item => <button key={item.id} className={`voice-card ${voice === item.id ? 'selected' : ''}`} aria-pressed={voice === item.id} onClick={() => setVoice(item.id)}><span className="voice-avatar"><AudioLines size={20}/></span><span><strong>{item.id}</strong><small>{item.description}</small></span><span className="radio-dot"/></button>)}</div>
          <div className="delivery"><div><label htmlFor="tone">Delivery style</label><select id="tone" value={tone} onChange={event => setTone(event.target.value)}>{TONES.map(item => <option key={item}>{item}</option>)}</select></div><div><label htmlFor="pace">Pace</label><select id="pace" value={pace} onChange={event => setPace(event.target.value)}>{PACES.map(item => <option key={item}>{item}</option>)}</select></div></div>
          </fieldset>
          <button className="generate" disabled={busy || !text.trim()} onClick={generate}>{busy ? <LoaderCircle size={19} className="spin"/> : <Sparkles size={19}/>} {busy ? 'Creating your voice…' : 'Generate voice'}{!busy && <ArrowUpRight size={18}/>}</button>
          <p className="generation-note" role="status">{busy ? 'This can take a minute. Your audio will appear below.' : 'Ready to listen. Ready to download.'}</p>
        </aside>
      </div>
      {error && <div role="alert" className="error">{error}</div>}
      <section className="output panel" aria-labelledby="output-heading"><div className="output-icon"><AudioLines size={25}/></div><div className="output-content"><h2 id="output-heading">{recording ? 'Your voiceover is ready' : 'Your next great voiceover starts here'}</h2><p>{recording ? recording.label : 'Add your text, find your voice, and press generate. Listen and download right here.'}</p>{recording && <audio key={recording.filename} controls src={recording.mp3Base64} aria-label="Generated voiceover"/>}</div>{recording && <div className="downloads"><a className="download-primary" href={recording.mp3Base64} download={`${recording.filename}.mp3`}><Download size={16}/>MP3</a><a href={recording.wavBase64} download={`${recording.filename}.wav`}><Download size={16}/>WAV</a></div>}</section>
      <footer><span>Made for stories worth hearing.</span><span>AI-generated voices · Powered by Gemini</span></footer>
    </main>
  </div>;
}

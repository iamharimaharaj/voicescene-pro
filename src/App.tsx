import { useRef, useState } from 'react';
import JSZip from 'jszip';
import { ArrowDown, ArrowUp, AudioLines, Download, FileArchive, Globe2, LoaderCircle, Mic2, PenLine, Plus, Sparkles, Trash2, Volume2, Wand2 } from 'lucide-react';
import { LANGUAGES, MAX_BRIEF_LENGTH, MAX_SCENES, MAX_TEXT_LENGTH, PACES, PLATFORMS, TONES, VOICES } from './data/voices';
import type { Gender, LanguageId, Pace, PlatformId, ToneId, VoiceId } from './data/voices';

const PORTFOLIO_URL = 'https://harinepal.com/';

type Recording ={ mp3Base64: string; wavBase64: string; duration: number; label: string };
type Scene = { id: number; title: string; text: string; recording?: Recording; error?: string };

// Empty when the page and API share a server; set VITE_API_BASE when the API is hosted elsewhere.
const API_BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '');

async function postJson(path: string, body: unknown) {
  const response = await fetch(`${API_BASE}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = response.headers.get('content-type')?.includes('application/json') ? await response.json() : {};
  if (!response.ok || !data.success) throw new Error(data.error || 'Something went wrong. Please try again.');
  return data;
}

function fileBase(scene: Scene, index: number) {
  const slug = scene.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${String(index + 1).padStart(2, '0')}-${slug || 'scene'}`;
}

export default function App() {
  const nextId = useRef(2);
  const [scenes, setScenes] = useState<Scene[]>([{ id: 1, title: 'Scene 1', text: '' }]);
  const [languageId, setLanguageId] = useState<LanguageId>('en');
  const language = LANGUAGES.find(item => item.id === languageId)!;
  const [region, setRegion] = useState<string>('United States');
  const [gender, setGender] = useState<Gender>('female');
  const [voice, setVoice] = useState<VoiceId>('Sulafat');
  const [tone, setTone] = useState<ToneId>('Confident brand');
  const [pace, setPace] = useState<Pace>('Normal');
  const [brief, setBrief] = useState('');
  const [audience, setAudience] = useState('');
  const [cta, setCta] = useState('');
  const [platform, setPlatform] = useState<PlatformId>('Instagram Reel');
  const [sceneCount, setSceneCount] = useState(4);
  const [writing, setWriting] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [batch, setBatch] = useState(false);
  const [error, setError] = useState('');

  const busy = writing || activeId !== null;
  const voiceProfile = VOICES.find(item => item.id === voice)!;
  const readyScenes = scenes.filter(scene => scene.text.trim());
  const recorded = scenes.filter(scene => scene.recording);

  function updateScene(id: number, patch: Partial<Scene>) {
    setScenes(current => current.map(scene => scene.id === id ? { ...scene, ...patch } : scene));
  }

  function addScene() {
    const id = nextId.current++;
    setScenes(current => [...current, { id, title: `Scene ${current.length + 1}`, text: '' }]);
  }

  function moveScene(index: number, offset: number) {
    setScenes(current => {
      const next = [...current];
      [next[index], next[index + offset]] = [next[index + offset], next[index]];
      return next;
    });
  }

  async function writeCopy() {
    if (busy || !brief.trim()) return;
    setWriting(true);
    setError('');
    try {
      const data = await postJson('/api/copy/generate', { brief, audience, cta, platform, tone, language: languageId, sceneCount });
      setScenes(data.scenes.map((scene: { title: string; text: string }) => ({ id: nextId.current++, ...scene })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to connect. Please try again.');
    } finally { setWriting(false); }
  }

  async function voiceScene(scene: Scene) {
    setActiveId(scene.id);
    updateScene(scene.id, { error: undefined });
    try {
      const data = await postJson('/api/tts/generate', { script: scene.text, voice, language: languageId, region, tone, pace });
      const label = `${voiceProfile.personality} (${voice}) · ${tone} · ${pace} · ${language.name} · ${region}`;
      updateScene(scene.id, { recording: { mp3Base64: data.mp3Base64, wavBase64: data.wavBase64, duration: data.duration, label } });
      return true;
    } catch (err) {
      updateScene(scene.id, { error: err instanceof Error ? err.message : 'Unable to connect. Please try again.' });
      return false;
    } finally { setActiveId(null); }
  }

  async function voiceAll() {
    if (busy || !readyScenes.length) return;
    setBatch(true);
    setError('');
    for (const scene of readyScenes) {
      if (!await voiceScene(scene)) break;
    }
    setBatch(false);
  }

  async function downloadZip() {
    const zip = new JSZip();
    const script: string[] = [];
    scenes.forEach((scene, index) => {
      script.push(`${index + 1}. ${scene.title}\n${scene.text}\n`);
      if (scene.recording) zip.file(`${fileBase(scene, index)}.mp3`, scene.recording.mp3Base64.split(',')[1], { base64: true });
    });
    zip.file('script.txt', script.join('\n'));
    const url = URL.createObjectURL(await zip.generateAsync({ type: 'blob' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `Voiceover-Pro-${Date.now()}.zip`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return <div className="studio">
    <header className="topbar">
      <div className="topbar__inner">
        <a className="brand" href={PORTFOLIO_URL} aria-label="Hari Nepal portfolio home">
          <span className="brand__mark">H</span>
          <span className="brand__name">Hari Nepal</span>
          <span className="brand__product">Voiceover Pro</span>
        </a>
        <div className="topbar__actions">
          <a className="topbar__link" href={PORTFOLIO_URL}>Portfolio</a>
          <a className="btn btn--primary" href={`${PORTFOLIO_URL}#contact`}>Let’s talk <span className="btn__arrow" aria-hidden="true">↗</span></a>
        </div>
      </div>
    </header>
    <main>
      <div className="intro">
        <p className="eyebrow">AI marketing studio</p>
        <h1>Write it, voice it, ship the ad<span>.</span></h1>
        <p className="lead">Turn a product brief into scene-by-scene marketing copy, then give every scene a voice with real personality.</p>
      </div>

      <div className="workspace">
        <div className="column">
          <section className="panel brief" aria-labelledby="brief-heading">
            <div className="panel-heading">
              <div><span className="step">01</span><h2 id="brief-heading">Marketing brief</h2></div>
              <PenLine size={18}/>
            </div>
            <div className="brief-body">
              <label htmlFor="brief">Product or offer</label>
              <textarea id="brief" rows={3} value={brief} disabled={busy} maxLength={MAX_BRIEF_LENGTH} onChange={event => setBrief(event.target.value)}
                placeholder="e.g. Flowdesk, an all-in-one dashboard for small business owners. 14-day free trial, no card needed."/>
              <div className="brief-grid">
                <div><label htmlFor="audience">Audience <span className="optional">optional</span></label>
                  <input id="audience" value={audience} disabled={busy} maxLength={MAX_BRIEF_LENGTH} onChange={event => setAudience(event.target.value)} placeholder="Busy founders, 25–45"/></div>
                <div><label htmlFor="cta">Call to action <span className="optional">optional</span></label>
                  <input id="cta" value={cta} disabled={busy} maxLength={MAX_BRIEF_LENGTH} onChange={event => setCta(event.target.value)} placeholder="Start your free trial"/></div>
                <div><label htmlFor="platform">Format</label>
                  <select id="platform" value={platform} disabled={busy} onChange={event => setPlatform(event.target.value as PlatformId)}>
                    {PLATFORMS.map(item => <option key={item.id}>{item.id}</option>)}
                  </select></div>
                <div><label htmlFor="scene-count">Scenes</label>
                  <select id="scene-count" value={sceneCount} disabled={busy} onChange={event => setSceneCount(Number(event.target.value))}>
                    {Array.from({ length: MAX_SCENES }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}
                  </select></div>
              </div>
              <button className="btn btn--ghost btn--block" disabled={busy || !brief.trim()} onClick={writeCopy}>
                {writing ? <LoaderCircle size={17} className="spin"/> : <Wand2 size={17}/>}
                {writing ? 'Writing your copy…' : 'Write my copy'}
              </button>
              <p className="helper-inline">Uses the tone and language from step 03. This replaces the scenes below.</p>
            </div>
          </section>

          <section className="panel scenes" aria-labelledby="scenes-heading">
            <div className="panel-heading">
              <div><span className="step">02</span><h2 id="scenes-heading">Scenes</h2></div>
              <button className="text-button" disabled={busy} onClick={() => setScenes([{ id: nextId.current++, title: 'Scene 1', text: language.sample }])}><Sparkles size={15}/>Try a sample</button>
            </div>
            <ol className="scene-list">
              {scenes.map((scene, index) => {
                const generating = activeId === scene.id;
                return <li key={scene.id} className={`scene ${generating ? 'generating' : ''}`}>
                  <div className="scene-top">
                    <span className="scene-number">{String(index + 1).padStart(2, '0')}</span>
                    <label className="sr-only" htmlFor={`title-${scene.id}`}>Scene {index + 1} title</label>
                    <input id={`title-${scene.id}`} className="scene-title" value={scene.title} disabled={busy} maxLength={80} onChange={event => updateScene(scene.id, { title: event.target.value })}/>
                    <div className="scene-tools">
                      <button aria-label={`Move scene ${index + 1} up`} disabled={busy || index === 0} onClick={() => moveScene(index, -1)}><ArrowUp size={15}/></button>
                      <button aria-label={`Move scene ${index + 1} down`} disabled={busy || index === scenes.length - 1} onClick={() => moveScene(index, 1)}><ArrowDown size={15}/></button>
                      <button aria-label={`Delete scene ${index + 1}`} disabled={busy || scenes.length === 1} onClick={() => setScenes(current => current.filter(item => item.id !== scene.id))}><Trash2 size={15}/></button>
                    </div>
                  </div>
                  <label className="sr-only" htmlFor={`text-${scene.id}`}>Scene {index + 1} text</label>
                  <textarea id={`text-${scene.id}`} lang={languageId} value={scene.text} disabled={busy} maxLength={MAX_TEXT_LENGTH} rows={4}
                    onChange={event => updateScene(scene.id, { text: event.target.value })}
                    placeholder={languageId === 'ne' ? 'यहाँ यो दृश्यको पाठ लेख्नुहोस्…' : 'Write or paste the words for this scene…'}/>
                  <div className="scene-footer">
                    <span>{scene.text.length.toLocaleString()} / {MAX_TEXT_LENGTH.toLocaleString()}</span>
                    <button className="text-button" disabled={busy || !scene.text.trim()} onClick={() => { setError(''); voiceScene(scene); }}>
                      {generating ? <LoaderCircle size={15} className="spin"/> : <Mic2 size={15}/>}
                      {generating ? 'Voicing…' : scene.recording ? 'Re-voice scene' : 'Voice this scene'}
                    </button>
                  </div>
                  {scene.error && <p role="alert" className="scene-error">{scene.error}</p>}
                  {scene.recording && <div className="scene-audio">
                    <audio controls src={scene.recording.mp3Base64} aria-label={`Scene ${index + 1} voiceover`}/>
                    <div className="downloads">
                      <a className="download-primary" href={scene.recording.mp3Base64} download={`${fileBase(scene, index)}.mp3`}><Download size={14}/>MP3</a>
                      <a href={scene.recording.wavBase64} download={`${fileBase(scene, index)}.wav`}><Download size={14}/>WAV</a>
                    </div>
                    <small>{scene.recording.label} · {scene.recording.duration}s</small>
                  </div>}
                </li>;
              })}
            </ol>
            <button className="add-scene" disabled={busy || scenes.length >= MAX_SCENES} onClick={addScene}><Plus size={16}/>Add scene</button>
          </section>
        </div>

        <aside className="settings panel" aria-labelledby="voice-heading">
          <div className="panel-heading">
            <div><span className="step">03</span><h2 id="voice-heading">Voice & tone</h2></div>
            <Volume2 size={19}/>
          </div>
          <fieldset disabled={busy}>
            <legend className="sr-only">Voice and tone settings</legend>
            <div className="language-grid">
              <div><label htmlFor="language"><Globe2 size={12}/> Language</label>
                <select id="language" value={languageId} onChange={event => { const next = LANGUAGES.find(item => item.id === event.target.value)!; setLanguageId(next.id); setRegion(next.regions[0]); }}>
                  {LANGUAGES.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select></div>
              <div><label htmlFor="region">Accent</label>
                <select id="region" value={region} onChange={event => setRegion(event.target.value)}>
                  {language.regions.map(item => <option key={item}>{item}</option>)}
                </select></div>
            </div>
            <p className="field-label" id="personality-label">Personality</p>
            <div className="gender-switch">
              {(['female', 'male'] as const).map(item => <button key={item} aria-pressed={gender === item} className={gender === item ? 'active' : ''}
                onClick={() => { setGender(item); setVoice(item === 'female' ? 'Sulafat' : 'Charon'); }}>{item === 'female' ? 'Female' : 'Male'}</button>)}
            </div>
            <div className="voice-list" role="group" aria-labelledby="personality-label">
              {VOICES.filter(item => item.gender === gender).map(item => <button key={item.id} className={`voice-card ${voice === item.id ? 'selected' : ''}`} aria-pressed={voice === item.id} onClick={() => setVoice(item.id)}>
                <span className="voice-avatar"><AudioLines size={18}/></span>
                <span><strong>{item.personality}</strong><small>{item.id} · {item.description}</small></span>
                <span className="radio-dot"/>
              </button>)}
            </div>
            <div className="delivery">
              <div><label htmlFor="tone">Marketing tone</label>
                <select id="tone" value={tone} onChange={event => setTone(event.target.value as ToneId)}>{TONES.map(item => <option key={item.id}>{item.id}</option>)}</select></div>
              <div><label htmlFor="pace">Pace</label>
                <select id="pace" value={pace} onChange={event => setPace(event.target.value as Pace)}>{PACES.map(item => <option key={item}>{item}</option>)}</select></div>
            </div>
          </fieldset>
          <button className="btn btn--primary" disabled={busy || !readyScenes.length} onClick={voiceAll}>
            {batch ? <LoaderCircle size={19} className="spin"/> : <Sparkles size={19}/>}
            {batch ? `Voicing scene ${readyScenes.findIndex(scene => scene.id === activeId) + 1} of ${readyScenes.length}…` : `Voice all scenes (${readyScenes.length})`}
          </button>
          <button className="btn btn--ghost" disabled={busy || !recorded.length} onClick={downloadZip}><FileArchive size={16}/>Download all as ZIP ({recorded.length})</button>
          <p className="generation-note" role="status">{busy ? 'This can take a minute per scene.' : 'Each scene gets its own MP3 and WAV.'}</p>
        </aside>
      </div>
      {error && <div role="alert" className="error">{error}</div>}
      <footer>
        <span>© {new Date().getFullYear()} <a href={PORTFOLIO_URL}>Hari Nepal</a> · Web design, SEO & digital marketing</span>
        <span>AI-generated copy & voices · Powered by Gemini</span>
      </footer>
    </main>
  </div>;
}

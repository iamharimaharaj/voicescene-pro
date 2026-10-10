import { Mp3Encoder } from '@breezystack/lamejs';

export function encodeAudio(input: Buffer, mimeType: string) {
  let pcm = input;
  let sampleRate = 24000;
  let channels = 1;
  if (input.toString('ascii', 0, 4) === 'RIFF' && input.toString('ascii', 8, 12) === 'WAVE') {
    let foundData = false;
    let foundFormat = false;
    for (let offset = 12; offset + 8 <= input.length;) {
      const id = input.toString('ascii', offset, offset + 4);
      const size = input.readUInt32LE(offset + 4);
      const start = offset + 8;
      if (start + size > input.length) throw new Error('Incomplete WAV audio received. Please retry.');
      if (id === 'fmt ') {
        if (size < 16 || input.readUInt16LE(start) !== 1 || input.readUInt16LE(start + 14) !== 16) throw new Error('Expected 16-bit PCM WAV audio.');
        channels = input.readUInt16LE(start + 2);
        sampleRate = input.readUInt32LE(start + 4);
        foundFormat = true;
      }
      if (id === 'data') { pcm = input.subarray(start, start + size); foundData = true; }
      offset = start + size + (size % 2);
    }
    if (!foundData || !foundFormat) throw new Error('WAV audio is missing its format or data chunk.');
  } else {
    if (!/^audio\/(L16|pcm)(;|$)/i.test(mimeType)) throw new Error('Unsupported audio format received. Please retry.');
    sampleRate = Number(mimeType.match(/rate=(\d+)/i)?.[1] || 24000);
  }
  if (![1, 2].includes(channels) || ![8000,11025,12000,16000,22050,24000,32000,44100,48000].includes(sampleRate) || !pcm.length || pcm.length % (channels * 2)) throw new Error('Invalid PCM audio received.');
  const frames = pcm.length / (channels * 2);
  const left = new Int16Array(frames);
  const right = channels === 2 ? new Int16Array(frames) : undefined;
  for (let i = 0; i < frames; i++) {
    left[i] = pcm.readInt16LE(i * channels * 2);
    if (right) right[i] = pcm.readInt16LE(i * 4 + 2);
  }
  const encoder = new Mp3Encoder(channels, sampleRate, 128);
  const chunks: Buffer[] = [];
  for (let i = 0; i < frames; i += 1152) chunks.push(Buffer.from(encoder.encodeBuffer(left.subarray(i, i + 1152), right?.subarray(i, i + 1152))));
  chunks.push(Buffer.from(encoder.flush()));
  const header = Buffer.alloc(44);
  header.write('RIFF', 0); header.writeUInt32LE(36 + pcm.length, 4); header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24); header.writeUInt32LE(sampleRate * channels * 2, 28);
  header.writeUInt16LE(channels * 2, 32); header.writeUInt16LE(16, 34);
  header.write('data', 36); header.writeUInt32LE(pcm.length, 40);
  return { wavBuffer: Buffer.concat([header, pcm]), mp3Buffer: Buffer.concat(chunks), duration: Math.round(frames / sampleRate * 10) / 10 };
}

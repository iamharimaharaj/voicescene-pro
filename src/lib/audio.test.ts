import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encodeAudio } from './audio';

function tone(channels = 1) {
  const pcm = Buffer.alloc(24000 * 2 * channels);
  for (let i = 0; i < 24000; i++) for (let c = 0; c < channels; c++) pcm.writeInt16LE(Math.round(Math.sin(i / 24000 * Math.PI * 880) * 4000), (i * channels + c) * 2);
  return pcm;
}
test('raw PCM produces a complete WAV and nonempty MP3 with the correct duration', () => {
  const pcm = tone();
  const audio = encodeAudio(pcm, 'audio/L16;codec=pcm;rate=24000');
  assert.equal(audio.duration, 1);
  assert.equal(audio.wavBuffer.toString('ascii', 0, 4), 'RIFF');
  assert.equal(audio.wavBuffer.readUInt32LE(40), pcm.length);
  assert.deepEqual(audio.wavBuffer.subarray(44), pcm);
  assert.ok(audio.mp3Buffer.length > 1000);
  const roundtrip = encodeAudio(audio.wavBuffer, 'audio/wav');
  assert.deepEqual(roundtrip.wavBuffer, audio.wavBuffer);
});
test('stereo WAV retains both channels and duration', () => {
  const base = encodeAudio(tone(), 'audio/L16;rate=24000').wavBuffer.subarray(0,44);
  const pcm = tone(2);
  base.writeUInt32LE(36 + pcm.length,4); base.writeUInt16LE(2,22); base.writeUInt32LE(96000,28); base.writeUInt16LE(4,32); base.writeUInt32LE(pcm.length,40);
  const output = encodeAudio(Buffer.concat([base,pcm]), 'audio/wav');
  assert.equal(output.duration,1);
  assert.equal(output.wavBuffer.readUInt16LE(22),2);
  assert.ok(output.mp3Buffer.length > 1000);
});
test('rejects corrupt or unsupported audio', () => {
  assert.throws(() => encodeAudio(Buffer.alloc(13), 'audio/L16'));
  assert.throws(() => encodeAudio(Buffer.alloc(20), 'audio/mpeg'));
  const wav = encodeAudio(tone(), 'audio/L16').wavBuffer;
  assert.throws(() => encodeAudio(wav.subarray(0,100), 'audio/wav'));
});

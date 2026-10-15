export type PlaybackStatus = "idle" | "loading" | "playing" | "paused" | "finished" | "error";
export function createPagePlayback(keys: string[], media: Pick<HTMLAudioElement, "src" | "play" | "pause">,
  load: (key: string, signal: AbortSignal) => Promise<string>,
  report: (status: PlaybackStatus, index: number) => void) {
  let index = 0, generation = 0, active = false, loaded = false;
  let abort: AbortController | undefined;
  const ahead = new Map<number, { abort: AbortController; result: Promise<string | null> }>();
  function clearAhead() { for (const item of ahead.values()) item.abort.abort(); ahead.clear(); }
  function prepareNext() {
    const next = index + 1;
    if (next >= keys.length || ahead.has(next)) return;
    const request = new AbortController();
    // Catch speculative failures: retry normally when this ayah is reached.
    const result = load(keys[next], request.signal).catch(() => null);
    ahead.set(next, { abort: request, result });
  }
  function pause() {
    active = false; generation++; abort?.abort(); clearAhead(); media.pause(); report("paused", index);
  }
  async function play() {
    if (active || !keys.length) return;
    if (index === keys.length) { index = 0; loaded = false; }
    active = true;
    const token = ++generation;
    abort = new AbortController();
    try {
      if (!loaded) {
        report("loading", index);
        const prepared = ahead.get(index);
        const cached = prepared ? await prepared.result : null;
        if (token !== generation) return;
        ahead.delete(index);
        const src = cached ?? await load(keys[index], abort.signal);
        if (token !== generation) return;
        media.src = src; loaded = true;
      }
      await media.play();
      if (token !== generation) return;
      report("playing", index);
      prepareNext();
    } catch {
      if (token !== generation) return;
      active = false; loaded = false; media.pause(); report("error", index);
    }
  }
  function ended() {
    if (!active) return;
    active = false; loaded = false; index++;
    if (index === keys.length) { report("finished", index - 1); return; }
    void play();
  }
  function error() { pause(); loaded = false; report("error", index); }
  function dispose() { active = false; generation++; abort?.abort(); clearAhead(); media.pause(); }
  return { play, pause, ended, error, dispose };
}

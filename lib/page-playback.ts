export type PlaybackStatus =
  | "idle"
  | "loading"
  | "playing"
  | "paused"
  | "finished"
  | "error";

export function createPagePlayback(
  keys: string[],
  media: HTMLAudioElement,
  load: (
    key: string,
    signal: AbortSignal,
  ) => Promise<string>,
  report: (
    status: PlaybackStatus,
    index: number,
  ) => void,
  initialKey?: string,
) {
  let index = Math.max(
    0,
    keys.indexOf(initialKey ?? ""),
  );

  let generation = 0;
  let active = false;
  let loaded = false;

  let abort:
    | AbortController
    | undefined;

  const ahead = new Map<
    number,
    {
      abort: AbortController;
      result: Promise<string | null>;
    }
  >();

  /*
   * Cache resolved audio URLs so the user
   * doesn't have to wait for the API every time.
   */
  const resolved = new Map<
    number,
    string
  >();

  function clearAhead() {
    for (const item of ahead.values()) {
      item.abort.abort();
    }

    ahead.clear();
  }

  /*
   * Preload an audio URL without starting playback.
   */
  async function prepare(
    target: number,
  ) {
    if (
      target < 0 ||
      target >= keys.length ||
      resolved.has(target)
    ) {
      return;
    }

    if (ahead.has(target)) {
      return;
    }

    const request =
      new AbortController();

    const result = load(
      keys[target],
      request.signal,
    )
      .then((url) => {
        if (request.signal.aborted) return null;
        resolved.set(
          target,
          url,
        );

        return url;
      })
      .catch(() => null);

    ahead.set(target, {
      abort: request,
      result,
    });

    try {
      await result;
    } finally {
      ahead.delete(target);
    }
  }

  function prepareNext() {
    const next = index + 1;

    if (
      next >= keys.length
    ) {
      return;
    }

    void prepare(next);
  }

  async function ensureSource(token: number) {
    const target = index;
    if (
      loaded &&
      media.src
    ) {
      return true;
    }

    report(
      "loading",
      index,
    );

    let src =
      resolved.get(index);

    if (!src) {
      const prepared =
        ahead.get(index);

      if (prepared) {
        src =
          (await prepared.result) ??
          undefined;
      }
    }

    if (token !== generation) return false;

    if (!src) {
      abort =
        new AbortController();

      src = await load(
        keys[index],
        abort.signal,
      );

      if (token !== generation) return false;
      resolved.set(target, src);
    }

    if (token !== generation || !src) {
      return false;
    }

    media.src = src;
    media.preload = "auto";
    media.load();

    loaded = true;

    return true;
  }

  function pause() {
    active = false;

    generation++;

    abort?.abort();

    media.pause();

    report(
      "paused",
      index,
    );
  }

  async function play() {
    if (
      active ||
      !keys.length
    ) {
      return;
    }

    if (
      index >=
      keys.length
    ) {
      index = 0;
      loaded = false;
    }

    active = true;

    const token =
      ++generation;

    try {
      /*
       * If the URL was already prepared,
       * this completes immediately.
       */
      const ready =
        await ensureSource(token);

      if (
        token !== generation ||
        !ready
      ) {
        return;
      }

      /*
       * Start playback.
       */
      await media.play();

      if (
        token !== generation
      ) {
        return;
      }

      report(
        "playing",
        index,
      );

      /*
       * While the current ayah plays,
       * prepare the next one.
       */
      prepareNext();
    } catch (error) {
      if (
        token !== generation
      ) {
        return;
      }

      active = false;
      loaded = false;

      media.pause();

      console.error(
        "Qur'an page playback error:",
        error,
      );

      report(
        "error",
        index,
      );
    }
  }

  function ended() {
    if (!active) {
      return;
    }

    active = false;
    loaded = false;

    index++;

    if (
      index >=
      keys.length
    ) {
      report(
        "finished",
        Math.max(
          0,
          keys.length - 1,
        ),
      );

      return;
    }

    /*
     * The next URL should normally
     * already be cached.
     */
    void play();
  }

  function error() {
    generation++;
    abort?.abort();
    clearAhead();
    active = false;
    loaded = false;

    media.pause();

    report(
      "error",
      index,
    );
  }

  function dispose() {
    active = false;

    generation++;

    abort?.abort();

    clearAhead();

    media.pause();

    resolved.clear();
  }

  /*
   * Start resolving the first audio URL
   * immediately when the controller is created.
   *
   * This is the important change:
   * when the user clicks Play, the URL will
   * usually already be available.
   */
  if (keys.length) {
    void prepare(index);
  }

  return {
    play,
    pause,
    ended,
    error,
    dispose,
  };
}
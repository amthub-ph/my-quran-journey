"use client";

import {
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";

import { createPortal } from "react-dom";
import {
  createPagePlayback,
  type PlaybackStatus,
} from "@/lib/page-playback";

import { useI18n } from "./language-provider";

export function PageRecitation({
  keys,
  reciter,
  audioRef,
  onActiveAyah,
  playbackTarget,
  onPauseSave,
  saving,
  autoPlay,
  onRecitationEnabled,
  onVerseCompleted,
}: {
  onVerseCompleted?: (key: string) => void;
  autoPlay?: boolean;
  onRecitationEnabled?: (enabled: boolean) => void;
  onPauseSave?: (key: string) => Promise<void>;
  saving?: boolean;
  playbackTarget?: HTMLDivElement | null;
  keys: string[];
  reciter: string;
  audioRef: RefObject<HTMLAudioElement | null>;
  onActiveAyah?: (key: string | null) => void;
}) {
  const { language } = useI18n();

  const ar = language === "ar";

  const [status, setStatus] =
    useState<PlaybackStatus>("idle");

  const [index, setIndex] =
    useState(0);

  const controller =
    useRef<ReturnType<typeof createPagePlayback> | null>(
      null,
    );

  const startAutomatically =
    useRef(autoPlay);

  const playingKey =
    useRef<string | null>(null);

  const signature =
    keys.join(",");

  useEffect(() => {
    const media =
      audioRef.current;

    if (!media) return;

    /*
     * This resolver gets the audio URL from our own API.
     *
     * IMPORTANT:
     * We now return the provider's audio URL directly.
     *
     * We do NOT fetch the external MP3 as a Blob first.
     * Some Qur'an audio providers block cross-origin fetch()
     * while still allowing normal HTML audio playback.
     */
    const playback =
      createPagePlayback(
        signature
          ? signature.split(",")
          : [],

        media,

        async (
          key,
          signal,
        ) => {
          const response =
            await fetch(
              `/api/recitation/${key}?reciter=${encodeURIComponent(
                reciter,
              )}`,
              {
                signal,
                cache: "no-store",
              },
            );

          if (!response.ok) {
            throw new Error(
              "Audio unavailable",
            );
          }

          const data =
            await response.json();

          if (
            data.key !== key ||
            data.reciter !== reciter ||
            typeof data.audio !== "string" ||
            !data.audio
          ) {
            throw new Error(
              "Invalid audio",
            );
          }

          /*
           * Allow normal secure audio URLs.
           * Also allow same-site relative URLs if your
           * recitation server ever returns one later.
           */
          const validAudio =
            data.audio.startsWith(
              "https://",
            ) ||
            data.audio.startsWith(
              "/",
            );

          if (!validAudio) {
            throw new Error(
              "Invalid audio URL",
            );
          }

          return data.audio;
        },

        (
          next,
          cursor,
        ) => {
          playingKey.current =
            signature
              .split(",")[
              cursor
            ] ?? null;

          if (
            next !==
            "playing"
          ) {
            onActiveAyah?.(
              null,
            );
          }

          if (
            next ===
            "error"
          ) {
            onRecitationEnabled?.(
              false,
            );
          }

          setStatus(next);

          setIndex(cursor);
        },
      );

    controller.current =
      playback;

    /*
     * Continue autoplay only when it was
     * already enabled by the parent reader.
     */
    if (
      startAutomatically.current &&
      signature
    ) {
      void playback.play();
    }

    return () => {
      playback.dispose();

      media.pause();

      media.removeAttribute(
        "src",
      );

      media.load();

      controller.current =
        null;

      playingKey.current =
        null;

      onActiveAyah?.(
        null,
      );
    };
  }, [
    signature,
    reciter,
    audioRef,
    onActiveAyah,
    onRecitationEnabled,
  ]);

  const active =
    status ===
      "loading" ||
    status ===
      "playing";

  const controls = (
    <div
      className="space-y-2 text-center"
      dir={
        ar ? "rtl" : "ltr"
      }
    >
      <button
        type="button"
        className="quran-btn-primary"
        aria-label={
          active
            ? ar
              ? "إيقاف مؤقت والمتابعة لاحقًا"
              : "Pause & Continue Later"
            : status ===
                "error"
              ? ar
                ? "إعادة المحاولة"
                : "Retry recitation"
              : ar
                ? "تشغيل التلاوة"
                : "Play recitation"
        }
        disabled={
          !keys.length ||
          saving
        }
        onClick={() => {
          /*
           * PAUSE
           */
          if (active) {
            onRecitationEnabled?.(
              false,
            );

            const key =
              playingKey.current ??
              keys[index];

            controller.current?.pause();

            if (
              key &&
              onPauseSave
            ) {
              void onPauseSave(
                key,
              );
            }

            return;
          }

          /*
           * PLAY / RETRY
           */
          onRecitationEnabled?.(
            true,
          );

          void controller.current?.play();
        }}
      >
        {active ? (
          ar ? (
            "إيقاف مؤقت والمتابعة لاحقًا"
          ) : (
            "Pause & Continue Later"
          )
        ) : status ===
          "error" ? (
          ar ? (
            "إعادة المحاولة"
          ) : (
            "Retry recitation"
          )
        ) : (
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            width="24"
            height="24"
            fill="currentColor"
            className="mx-auto"
          >
            <path d="M7 4v16l14-8z" />
          </svg>
        )}
      </button>

      <p
        role="status"
        className="text-sm"
      >
        {status ===
        "finished"
          ? ar
            ? "اكتملت تلاوة الصفحة. يمكنك الانتقال إلى الصفحة التالية."
            : "Page recitation finished. You can now turn to the next page."
          : status ===
              "error"
            ? ar
              ? "تعذّر تشغيل التلاوة. أعد المحاولة للمتابعة من الآية نفسها."
              : "Playback stopped. Retry to continue from the same ayah."
            : status ===
                "loading"
              ? ar
                ? "جارٍ تحميل التلاوة…"
                : "Loading recitation…"
              : keys.length
                ? (
                    <>
                      {ar
                        ? "الآية "
                        : "Ayah "}

                      <bdi>
                        {
                          keys[
                            index
                          ]
                        }
                      </bdi>

                      {" · "}

                      {ar
                        ? "تلاوة آيات الصفحة بالتتابع"
                        : "Continuous page recitation"}
                    </>
                  )
                : ar
                  ? "جارٍ تجهيز الصفحة…"
                  : "Preparing page…"}
      </p>
    </div>
  );

  return (
    <>
      <audio
        ref={audioRef}
        preload="metadata"
        playsInline
        onPlaying={() => {
          onActiveAyah?.(
            playingKey.current,
          );
        }}
        onPause={() => {
          onActiveAyah?.(
            null,
          );
        }}
        onWaiting={() => {
          /*
           * Do not mark this as an error.
           * Waiting can happen briefly between ayahs.
           */
        }}
        onEnded={() => {
          const completedKey =
            playingKey.current;

          controller.current?.ended();

          if (
            completedKey
          ) {
            onVerseCompleted?.(
              completedKey,
            );
          }
        }}
        onError={() => {
          controller.current?.error();
        }}
      />

      {playbackTarget
        ? createPortal(
            controls,
            playbackTarget,
          )
        : playbackTarget ===
            undefined
          ? controls
          : null}
    </>
  );
}
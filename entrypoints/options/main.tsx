import { ThemeSetting } from "@/components/ThemeSetting";
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { browser } from "wxt/browser";
import { ArrowLeft } from "lucide-react";
import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { defaults, normalizeSettings, type Settings } from "@/lib/settings";
import { useSettings } from "@/lib/use-settings";
import { youtubeHosts } from "@/lib/policy";
import "@/styles/app.css";
const sections: { title: string; rows: [keyof Settings, string, string][] }[] =
  [
    {
      title: "Video details",
      rows: [
        ["description", "Description", "Text, links, chapters, and credits."],
        [
          "creator",
          "Creator details",
          "Channel, subscribers, Subscribe, and Join.",
        ],
        ["actions", "Video actions", "Like, share, save, download, and more."],
        ["comments", "Comments", "Read and join the conversation."],
      ],
    },
    {
      title: "Feeds & playback",
      rows: [
        [
          "recommendations",
          "Recommendations",
          "Suggested videos beside and after the player.",
        ],
        ["homeFeed", "Home feed", "Show the YouTube homepage feed."],
        ["shorts", "Shorts", "Show short videos and the Shorts feed."],
        [
          "autoplay",
          "Autoplay",
          "Allow the next video to start automatically.",
        ],
      ],
    },
  ];
function SettingsPage() {
  const { settings, ready, error } = useSettings();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const home = browser.runtime.getURL("/search.html");
  let back = home;
  try {
    const u = new URL(new URLSearchParams(location.search).get("return") || "");
    if (
      (youtubeHosts.includes(u.hostname) &&
        ["http:", "https:"].includes(u.protocol)) ||
      u.href === home ||
      u.href === home + "?done=1"
    )
      back = u.href;
  } catch {}
  async function save(key?: keyof Settings) {
    setSaving(true);
    setSaveError("");
    try {
      const latest = normalizeSettings(
        (await browser.storage.local.get("settings")).settings,
      );
      await browser.storage.local.set({
        settings: key ? { ...latest, [key]: !latest[key] } : { ...defaults },
      });
      if (!key) await browser.storage.local.set({ theme: "system" });
      const response = await browser.runtime.sendMessage({
        type: "settings:sync",
      });
      if (!response?.ok) throw new Error("Rules failed");
    } catch {
      setSaveError("Could not apply your settings. Please try again.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <>
      <Brand home={home} />
      <main className="settings-workspace">
        <div className="settings-heading">
          <a className="back-link" href={back}>
            <ArrowLeft size={14} />
            {back.includes("youtube.com/watch")
              ? "Back to video"
              : "Back to YouTube"}
          </a>
          <h1>Keep what matters to you.</h1>
          <p>
            Choose what appears on YouTube. Make it useful for the way you
            watch.
          </p>
        </div>
        <ThemeSetting />
        {sections.map((section) => (
          <section className="settings-section" key={section.title}>
            <h2>{section.title}</h2>
            {section.rows.map(([key, label, description]) => (
              <div className="settings-row" key={key}>
                <div>
                  <div id={key + "-label"} className="setting-label">
                    {label}
                  </div>
                  <p id={key + "-description"}>{description}</p>
                </div>
                <div className="setting-control">
                  <span aria-hidden="true">{settings[key] ? "On" : "Off"}</span>
                  <Button
                    className="visibility-switch"
                    onPointerDown={(e) =>
                      (e.currentTarget.dataset.motion = "pointer")
                    }
                    onKeyDown={(e) =>
                      (e.currentTarget.dataset.motion = "keyboard")
                    }
                    role="switch"
                    aria-checked={settings[key]}
                    aria-labelledby={key + "-label"}
                    aria-describedby={key + "-description"}
                    disabled={!ready || saving}
                    onClick={() => save(key)}
                  >
                    <span />
                  </Button>
                </div>
              </div>
            ))}
          </section>
        ))}
        <div className="settings-footer">
          <p>Creator Videos, Live, and Playlists stay accessible.</p>
          <Button
            variant="ghost"
            disabled={!ready || saving}
            onClick={() => save()}
          >
            Restore defaults
          </Button>
        </div>
        <p
          className="save-status"
          role={error || saveError ? "alert" : "status"}
        >
          {error ||
            saveError ||
            (saving
              ? "Saving…"
              : ready
                ? "Changes save automatically."
                : "Loading your settings…")}
        </p>
      </main>
    </>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <SettingsPage />
  </React.StrictMode>,
);

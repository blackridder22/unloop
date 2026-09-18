import { Logo } from "./Logo";
import { useEffect } from "react";
import { bindTheme } from "@/lib/theme";
import { ShieldCheck, Settings2 } from "lucide-react";
import { browser } from "wxt/browser";
import { useSettings } from "@/lib/use-settings";
export function Brand({ home }: { home: string }) {
  useEffect(() => {
    if (location.protocol === "chrome-extension:") return bindTheme();
  }, []);
  const { settings } = useSettings();
  const focused =
    !settings.shorts &&
    !settings.recommendations &&
    !settings.homeFeed &&
    !settings.autoplay;
  const options =
    browser.runtime.getURL("/options.html") +
    "?return=" +
    encodeURIComponent(location.href);
  return (
    <header className="brand-header">
      <a className="brand" href={home} aria-label="Unloop search">
        <Logo size={28} />
        <span>unloop</span>
      </a>
      <div className="brand-tools">
        <span className="protection-status">
          <ShieldCheck size={16} strokeWidth={1.4} />
          <span>
            {focused ? "Distractions blocked" : "Your viewing preferences"}
          </span>
        </span>
        <a className="settings-link" href={options}>
          <Settings2 size={15} />
          Settings
        </a>
      </div>
    </header>
  );
}

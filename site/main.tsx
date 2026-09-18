import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowUpRight,
  ArrowDown,
  Download,
  Check,
  Sun,
  Moon,
  Monitor,
  ExternalLink,
} from "lucide-react";
import { Logo } from "../components/Logo";
import { Button } from "../components/ui/button";
import "./style.css";
const repo = "https://github.com/blackridder22/unloop";
const download = repo + "/releases/latest/download/unloop-chrome.zip";
const asset = (name: string) => import.meta.env.BASE_URL + name;
const initial = {
  Description: true,
  "Creator details": true,
  Recommendations: false,
  Shorts: false,
  Autoplay: false,
};
function App() {
  const [settings, setSettings] = useState(initial);
  const [theme, setTheme] = useState("System");
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText("chrome://extensions");
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      setCopied(false);
    }
  }
  return (
    <>
      <header className="nav wrap">
        <a className="wordmark" href="#" aria-label="Unloop home">
          <Logo />
          <span>unloop</span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#your-rules">Your rules</a>
          <a href={repo}>
            GitHub <ArrowUpRight size={14} />
          </a>
          <a className="nav-download" href="#install">
            Get Unloop <ArrowDown size={15} />
          </a>
        </nav>
      </header>
      <main>
        <section className="hero wrap">
          <div className="hero-copy">
            <p className="eyebrow">
              <span /> A LITTLE LESS YOUTUBE
            </p>
            <h1>
              You came for
              <br />
              one <em>video.</em>
            </h1>
            <p className="intro">
              Find what you need. Learn something.
              <br />
              Get back to your life.
            </p>
            <a className="cta" href={download}>
              <Download size={19} /> Download for Chrome{" "}
              <ArrowUpRight size={18} />
            </a>
            <p className="fine">Free. Open source. Yours to control.</p>
            <a className="text-link" href="#install">
              Installs manually in Chrome <ArrowDown size={14} />
            </a>
          </div>
          <figure className="hero-art">
            <img
              src={asset("unloop-object.png")}
              alt="A coral loop, opened into a forward arrow"
              width="1536"
              height="1024"
            />
            <figcaption>Break the loop. Keep the good stuff.</figcaption>
          </figure>
        </section>
        <section className="product wrap" aria-labelledby="product-title">
          <div className="product-heading">
            <h2 id="product-title">
              A purpose. A search.
              <br />A place to stop.
            </h2>
            <p>
              Opening YouTube starts with your question. The homepage feed,
              Shorts, recommendations, and autoplay are off by default.
            </p>
          </div>
          <figure className="app-shot">
            <div className="browser-bar">
              <span />
              <span />
              <span />
              <p>YOUR YOUTUBE, WITH UNLOOP</p>
            </div>
            <img
              src={asset("search-preview.png")}
              alt="The real Unloop search screen, with a single search field and no recommendation feed"
              width="1280"
              height="800"
              loading="lazy"
            />
          </figure>
          <div className="feature-notes">
            <p>
              <Check size={17} /> Search and watch as usual
            </p>
            <p>
              <Check size={17} /> Creator Videos, Live & Playlists
            </p>
            <p>
              <Check size={17} /> A clear finish after every video
            </p>
          </div>
        </section>
        <section id="your-rules" className="rules wrap">
          <div className="rules-copy">
            <h2>
              Keep the parts
              <br />
              you came for.
            </h2>
            <p>
              Descriptions, links, chapters, and creator details stay. You
              decide what else belongs on the page.
            </p>
            <p className="secondary-copy">
              Every switch is yours. Change your mind whenever you want.
            </p>
            <a className="text-link" href={repo + "#features"}>
              Explore all the controls <ArrowUpRight size={16} />
            </a>
          </div>
          <div className="preferences">
            <div className="preview-label">
              <span>TRY THE SETTINGS</span>
              <span>Interactive preview</span>
            </div>
            <div className="preview-settings">
              {Object.entries(settings).map(([name, on]) => (
                <div className="preview-row" key={name}>
                  <span>{name}</span>
                  <div>
                    <small>{on ? "On" : "Off"}</small>
                    <Button
                      className="visibility-switch"
                      role="switch"
                      aria-label={name}
                      aria-checked={on}
                      onPointerDown={(e) =>
                        (e.currentTarget.dataset.motion = "pointer")
                      }
                      onKeyDown={(e) =>
                        (e.currentTarget.dataset.motion = "keyboard")
                      }
                      onClick={() =>
                        setSettings((s) => ({ ...s, [name]: !on }))
                      }
                    >
                      <span />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="theme-preview">
              <p>Feels right, day or night.</p>
              <div role="group" aria-label="Preview appearance">
                {(
                  [
                    ["Light", Sun],
                    ["Dark", Moon],
                    ["System", Monitor],
                  ] as const
                ).map(([name, Icon]) => (
                  <button
                    key={String(name)}
                    aria-pressed={theme === name}
                    onClick={() => setTheme(String(name))}
                  >
                    <Icon size={16} />
                    {String(name)}
                  </button>
                ))}
              </div>
              <div
                className={
                  "sample " +
                  (theme === "Dark" ? "dark" : theme === "System" ? "auto" : "")
                }
              >
                <Logo size={22} />
                <span>
                  {theme === "System"
                    ? "Follows your device"
                    : theme + " appearance"}
                </span>
                <Check size={15} />
              </div>
            </div>
            <p className="preview-note" role="status">
              {Object.values(settings).filter(Boolean).length} of 5 preview
              options on. Your browser settings are unchanged.
            </p>
          </div>
        </section>
        <section className="principles wrap">
          <h2>
            Your attention.
            <br />
            Your browser.
          </h2>
          <div>
            <article>
              <span>01</span>
              <h3>No account to create.</h3>
              <p>
                Preferences stay in your browser. Unloop adds no analytics or
                tracking.
              </p>
            </article>
            <article>
              <span>02</span>
              <h3>Nothing to subscribe to.</h3>
              <p>
                Free to use, with the source available under the MIT license.
              </p>
            </article>
            <article>
              <span>03</span>
              <h3>Comfortable in any light.</h3>
              <p>
                Choose light, dark, or let Unloop follow your device
                automatically.
              </p>
            </article>
          </div>
        </section>
        <section id="install" className="install wrap">
          <div>
            <p className="eyebrow">A SMALL CHANGE TO YOUR BROWSER</p>
            <h2>
              Make your next
              <br />
              visit a short one.
            </h2>
            <a className="cta" href={download}>
              <Download size={18} /> Download Unloop <ArrowUpRight size={18} />
            </a>
            <p className="fine">Chrome on desktop · ZIP download · v3.0.0</p>
          </div>
          <ol>
            <li>
              <span>1</span>
              <div>
                <h3>Download & unzip.</h3>
                <p>Keep the extracted folder somewhere permanent.</p>
              </div>
            </li>
            <li>
              <span>2</span>
              <div>
                <h3>Open Chrome’s extensions page.</h3>
                <p>
                  Paste <code>chrome://extensions</code> into the address bar
                  and turn on Developer mode.
                </p>
                <button className="text-link" onClick={copy}>
                  {copied ? "Copied" : "Copy extensions address"}{" "}
                  {copied ? <Check size={14} /> : <ExternalLink size={14} />}
                </button>
                <span className="sr-only" role="status">
                  {copied ? "Extensions address copied" : ""}
                </span>
              </div>
            </li>
            <li>
              <span>3</span>
              <div>
                <h3>Load unpacked. You’re in.</h3>
                <p>
                  Choose the extracted folder, then open YouTube. Already using
                  Unloop? Replace your existing folder’s contents and click
                  Reload.
                </p>
              </div>
            </li>
          </ol>
        </section>
        <section className="faq wrap">
          <h2>A few useful answers.</h2>
          <div>
            <details>
              <summary>Can I still visit my favorite creators?</summary>
              <p>
                Yes. Creator pages and their Videos, Live, and Playlists tabs
                remain accessible. Shorts follow your Shorts preference.
              </p>
            </details>
            <details>
              <summary>What about video descriptions and links?</summary>
              <p>
                Descriptions have their own space, with links, chapters, and
                credits intact. Creator-description redirect links still lead to
                their original destinations.
              </p>
            </details>
            <details>
              <summary>Is this in the Chrome Web Store?</summary>
              <p>
                This release installs manually using the steps above. Download
                updates from GitHub and reload the extension after replacing its
                files.
              </p>
            </details>
            <details>
              <summary>What can Unloop access?</summary>
              <p>
                It runs on YouTube pages to adjust the layout and navigation. It
                stores preferences locally and does not send your browsing
                history to a server. YouTube’s own data practices still apply.
              </p>
            </details>
          </div>
        </section>
      </main>
      <footer className="wrap">
        <a className="wordmark" href="#">
          <Logo size={26} />
          <span>unloop</span>
        </a>
        <p>Less wandering. More doing.</p>
        <div>
          <a href={repo}>Source</a>
          <a href={repo + "/blob/main/LICENSE"}>MIT license</a>
          <a href={repo + "/issues"}>Feedback</a>
        </div>
        <small>An independent extension for YouTube.</small>
      </footer>
    </>
  );
}
createRoot(document.getElementById("root")!).render(<App />);

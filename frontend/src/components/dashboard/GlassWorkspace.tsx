"use client";

import React, {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import {
  Settings2,
  X,
  Layers,
  Check,
} from "lucide-react";

gsap.registerPlugin(useGSAP);

export type GlassSettings = {
  blur: number;
  opacity: number;
  saturation: number;
  tint: string;
  edge: number;
};

export const defaults: GlassSettings = {
  blur: 22,
  opacity: 0.3,
  saturation: 1.2,
  tint: "#ffffff",
  edge: 0.6,
};

const bounded = (value: number, min: number, max: number, fallback: number) =>
  Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;

export const normalize = (v: Partial<GlassSettings>): GlassSettings => ({
  blur: bounded(v.blur ?? defaults.blur, 0, 40, defaults.blur),
  opacity: bounded(v.opacity ?? defaults.opacity, 0.08, 0.9, defaults.opacity),
  saturation: bounded(
    v.saturation ?? defaults.saturation,
    0.5,
    2,
    defaults.saturation
  ),
  edge: bounded(v.edge ?? defaults.edge, 0, 1, defaults.edge),
  tint: /^#[0-9a-f]{6}$/i.test(v.tint ?? "") ? v.tint! : defaults.tint,
});

export interface GlassContextValue {
  settingsOpen: boolean;
  setSettingsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  material: GlassSettings;
  updateGlass: (patch: Partial<GlassSettings>) => void;
  resetGlass: () => void;
}

export const GlassContext = React.createContext<GlassContextValue>({
  settingsOpen: false,
  setSettingsOpen: () => {},
  material: defaults,
  updateGlass: () => {},
  resetGlass: () => {},
});

export const useGlass = () => React.useContext(GlassContext);

export interface GlassWorkspaceProps {
  brand?: string;
  userName?: string;
  backgroundImage?: string;
  glass?: Partial<GlassSettings>;
  onGlassChange?: (settings: GlassSettings) => void;
  theme?: "system" | "light" | "dark";
  useHostTheme?: boolean;
  className?: string;
  style?: CSSProperties;
  children?: React.ReactNode;
}

export default function GlassWorkspace({
  brand = "SkillSphere",
  userName,
  backgroundImage,
  glass = defaults,
  onGlassChange,
  theme = "system",
  useHostTheme = true,
  className = "",
  style,
  children,
}: GlassWorkspaceProps) {
  const root = useRef<HTMLDivElement>(null);
  const id = useId().replace(/:/g, "");
  const [material, setMaterial] = useState(() => normalize(glass));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [backgroundFailed, setBackgroundFailed] = useState(false);

  useEffect(() => {
    setMaterial(normalize(glass));
  }, [glass.blur, glass.opacity, glass.saturation, glass.tint, glass.edge]);

  const updateGlass = (patch: Partial<GlassSettings>) => {
    setMaterial((prev) => {
      const next = normalize({ ...prev, ...patch });
      onGlassChange?.(next);
      return next;
    });
  };

  const resetGlass = () => {
    const next = normalize(glass);
    setMaterial(next);
    onGlassChange?.(next);
  };

  const closeSettings = () => setSettingsOpen(false);

  return (
    <GlassContext.Provider
      value={{
        settingsOpen,
        setSettingsOpen,
        material,
        updateGlass,
        resetGlass,
      }}
    >
      <div
        ref={root}
        className={`gw-root ${className}`}
        data-theme={useHostTheme ? "system" : theme}
        data-host-theme={useHostTheme}
        style={
          {
            "--gw-blur": `${material.blur}px`,
            "--gw-opacity": material.opacity,
            "--gw-saturation": material.saturation,
            "--gw-tint": useHostTheme
              ? `color-mix(in srgb, var(--color-background, Canvas) 80%, ${material.tint})`
              : material.tint,
            "--gw-edge": material.edge,
            ...style,
          } as CSSProperties
        }
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            if (settingsOpen) closeSettings();
          }
        }}
      >
        <style>{styles}</style>

        {backgroundImage && !backgroundFailed && (
          <img
            className="gw-room"
            src={backgroundImage}
            alt=""
            onError={() => setBackgroundFailed(true)}
          />
        )}
        <div className="gw-room-shade" aria-hidden="true" />

        <div className="gw-workspace w-full max-w-7xl mx-auto space-y-6">
          {children}
        </div>

        {/* Adjust Glass Material Popover / Drawer */}
        {settingsOpen && (
          <aside
            className="gw-material gw-glass"
            id={`${id}-material`}
            aria-label="Glass appearance"
          >
            <div className="gw-material-title">
              <div className="flex items-center gap-2">
                <span className="gw-material-icon">
                  <Settings2 size={18} aria-hidden="true" />
                </span>
                <h2>Glass appearance</h2>
              </div>
              <button
                type="button"
                className="gw-icon-button"
                aria-label="Close glass settings"
                onClick={closeSettings}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <p>Fine-tune frosted glass material & specular shine.</p>

            <div className="gw-material-sample" aria-hidden="true">
              <Layers size={26} strokeWidth={1.3} />
              <span>Live material preview</span>
            </div>

            <div className="gw-presets" aria-label="Glass presets">
              {[
                {
                  name: "Clear",
                  value: { blur: 10, opacity: 0.15, saturation: 1.1, edge: 0.8 },
                },
                { name: "Frosted", value: defaults },
                {
                  name: "Solid",
                  value: { blur: 32, opacity: 0.82, saturation: 1, edge: 0.35 },
                },
              ].map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => updateGlass(p.value)}
                >
                  {p.name}
                </button>
              ))}
            </div>

            {[
              {
                key: "blur",
                label: "Blur",
                min: 0,
                max: 40,
                step: 1,
                value: `${Math.round(material.blur)} px`,
              },
              {
                key: "opacity",
                label: "Opacity",
                min: 0.08,
                max: 0.9,
                step: 0.01,
                value: `${Math.round(material.opacity * 100)}%`,
              },
              {
                key: "saturation",
                label: "Saturation",
                min: 0.5,
                max: 2,
                step: 0.05,
                value: `${Math.round(material.saturation * 100)}%`,
              },
              {
                key: "edge",
                label: "Edge light",
                min: 0,
                max: 1,
                step: 0.05,
                value: `${Math.round(material.edge * 100)}%`,
              },
            ].map((c) => (
              <label className="gw-range" key={c.key}>
                <span>
                  {c.label}
                  <output>{c.value}</output>
                </span>
                <input
                  type="range"
                  aria-label={c.label}
                  min={c.min}
                  max={c.max}
                  step={c.step}
                  value={material[c.key as keyof GlassSettings]}
                  onChange={(e) =>
                    updateGlass({ [c.key]: Number(e.target.value) })
                  }
                />
              </label>
            ))}

            <label className="gw-tint">
              Glass tint{" "}
              <input
                type="color"
                value={material.tint}
                onChange={(e) => updateGlass({ tint: e.target.value })}
              />
            </label>

            <button
              className="gw-reset"
              type="button"
              onClick={resetGlass}
            >
              Reset appearance
            </button>
          </aside>
        )}
      </div>
    </GlassContext.Provider>
  );
}

const styles = `
.gw-root {
  --gw-ink: var(--color-foreground, CanvasText);
  --gw-muted: var(--color-muted-foreground, GrayText);
  --gw-accent: var(--color-primary, Highlight);
  --gw-line: color-mix(
    in srgb,
    var(--color-border, CanvasText) 35%,
    transparent
  );
  --gw-background: var(--color-background, Canvas);
  --gw-shade: color-mix(
    in srgb,
    var(--color-background, Canvas) 22%,
    transparent
  );
  --gw-surface: var(--color-card, var(--color-background, Canvas));
  --gw-panel: var(--color-card, var(--color-background, Canvas));
  --gw-highlight: var(--color-card, Canvas);
  --gw-shadow: color-mix(
    in srgb,
    var(--color-foreground, CanvasText) 14%,
    transparent
  );
  position: relative;
  isolation: isolate;
  min-height: 100%;
  overflow: visible;
  padding: 8px 4px;
  background: transparent;
  color: var(--gw-ink);
  font-family: inherit;
  box-sizing: border-box;
}

.gw-root * {
  box-sizing: border-box;
}

.gw-room {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: -3;
}

.gw-room-shade {
  position: absolute;
  inset: 0;
  background: var(--gw-shade);
  z-index: -2;
  pointer-events: none;
}

.gw-workspace {
  position: relative;
  width: 100%;
  margin: auto;
}

.gw-glass {
  background: color-mix(
    in srgb,
    var(--gw-surface) calc(var(--gw-opacity) * 100%),
    transparent
  );
  backdrop-filter: blur(var(--gw-blur)) saturate(var(--gw-saturation));
  -webkit-backdrop-filter: blur(var(--gw-blur)) saturate(var(--gw-saturation));
  box-shadow:
    inset 0 1px 0
      color-mix(
        in srgb,
        var(--gw-highlight) calc(var(--gw-edge) * 100%),
        transparent
      ),
    inset 0 0 0 1px
      color-mix(
        in srgb,
        var(--gw-highlight) calc(var(--gw-edge) * 34%),
        transparent
      ),
    0 16px 40px -20px var(--gw-shadow);
  position: relative;
}

.gw-glass:before {
  content: "";
  position: absolute;
  inset: 0;
  background: var(--gw-tint);
  opacity: 0.08;
  pointer-events: none;
  border-radius: inherit;
}

.gw-material {
  position: fixed;
  top: 76px;
  right: 28px;
  width: 310px;
  max-width: calc(100vw - 40px);
  padding: 22px;
  border-radius: 20px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: 0 24px 60px -15px rgba(0, 0, 0, 0.4);
}

.gw-material-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.gw-material-title h2 {
  font-size: 15px;
  font-weight: 700;
  margin: 0;
}

.gw-material-icon {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--gw-accent) 20%, transparent);
  color: var(--gw-accent);
}

.gw-material p {
  font-size: 12px;
  color: var(--gw-muted);
  margin: 0;
}

.gw-material-sample {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--gw-surface) 65%, transparent);
  font-size: 12px;
  font-weight: 600;
}

.gw-presets {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.gw-presets button {
  padding: 7px 0;
  font-size: 11px;
  font-weight: 600;
  border-radius: 8px;
  border: 1px solid var(--gw-line);
  background: color-mix(in srgb, var(--gw-surface) 50%, transparent);
  cursor: pointer;
  transition: all 0.2s ease;
}

.gw-presets button:hover {
  background: var(--gw-surface);
  border-color: var(--gw-accent);
}

.gw-range {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 11px;
  font-weight: 600;
}

.gw-range span {
  display: flex;
  justify-content: space-between;
  color: var(--gw-muted);
}

.gw-range output {
  font-family: monospace;
  color: var(--gw-ink);
}

.gw-range input[type="range"] {
  width: 100%;
  accent-color: var(--gw-accent);
  cursor: pointer;
}

.gw-tint {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 600;
  color: var(--gw-muted);
}

.gw-tint input[type="color"] {
  border: none;
  width: 32px;
  height: 24px;
  border-radius: 6px;
  cursor: pointer;
  background: none;
}

.gw-reset {
  margin-top: 4px;
  padding: 8px;
  font-size: 11px;
  font-weight: 700;
  border-radius: 8px;
  border: 1px solid var(--gw-line);
  background: color-mix(in srgb, var(--gw-surface) 40%, transparent);
  cursor: pointer;
  transition: all 0.2s ease;
}

.gw-reset:hover {
  background: var(--gw-surface);
}

.gw-icon-button {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: none;
  background: color-mix(in srgb, var(--gw-surface) 40%, transparent);
  cursor: pointer;
}
`;

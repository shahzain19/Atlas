"use client";

import { useState } from "react";

const code = `const atlas = new Atlas();
const drone = atlas.drone();

await drone.takeoff(20);
await drone.flyTo({ latitude: 37.7749, longitude: -122.4194 });
await drone.captureImage();
await drone.returnHome();`;

const demos = [
  { cmd: "npm run demo:drone",     desc: "Quadcopter autonomous patrol with real-time telemetry" },
  { cmd: "npm run demo:rover",     desc: "Ground rover obstacle avoidance + waypoint navigation" },
  { cmd: "npm run demo:fleet",     desc: "Multi-agent fleet coordination with mission planning" },
  { cmd: "npm run demo:simulation", desc: "Full 3D simulation with live sensor visualization" },
];

const problems = [
  "Sensor initialization", "Hardware drivers", "Navigation stacks",
  "Networking layers", "Custom control loops", "State management",
];

const solutions = [
  "Perception", "Planning", "Coordination", "Telemetry", "Recovery", "Simulation sync",
];

const layers = [
  {
    title: "API Layer",
    items: ["Atlas, Robot, Drone, Fleet", "Mission interface", "Event-driven commands"],
  },
  {
    title: "Runtime Layer",
    items: ["EventBus system", "Task scheduler", "Mission planner", "Memory system"],
  },
  {
    title: "Intelligence Layer",
    items: ["Perception pipeline", "Decision engine", "Planning system", "Multi-agent coordination"],
  },
];

const features = [
  { title: "Simulation-first design", desc: "Every mission runs identically in simulation before touching hardware." },
  { title: "Event-driven core", desc: "Everything communicates through events, not function calls." },
  { title: "Multi-agent native", desc: "Fleet coordination is built into the core, not added as an afterthought." },
  { title: "Hardware-agnostic", desc: "Same API works in simulation, real drones, rovers, and hybrid systems." },
];

export default function Page() {
  const [copied, setCopied] = useState(false);

  const copyInstall = async () => {
    await navigator.clipboard.writeText("git clone https://github.com/anomalyco/atlas.git && cd atlas && npm install && npm run demo");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-deep">

      {/* ─────── Nav ─────── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-deep border-b border-border">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 h-14">
          <a href="#" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center text-white font-bold text-xs">A</div>
            <span className="font-semibold text-white">Atlas</span>
          </a>
          <div className="hidden sm:flex items-center gap-6">
            <a href="#why" className="text-sm text-muted hover:text-white transition-colors">Why</a>
            <a href="#architecture" className="text-sm text-muted hover:text-white transition-colors">Architecture</a>
            <a href="#features" className="text-sm text-muted hover:text-white transition-colors">Features</a>
            <a href="#demos" className="text-sm text-muted hover:text-white transition-colors">Demos</a>
            <a href="https://github.com/anomalyco/atlas" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-muted hover:text-white transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
              GitHub
            </a>
          </div>
        </div>
      </nav>

      {/* ─────── Hero ─────── */}
      <section className="pt-32 pb-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs bg-surface border border-border text-muted mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-green" />
            Universal Platform for Intelligent Machines
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] text-white">
            Build autonomy.<br />
            <span className="text-accent">Not infrastructure.</span>
          </h1>

          <p className="mt-4 text-base sm:text-lg text-muted max-w-lg mx-auto">
            An event-driven autonomy runtime for robots, drones, and multi-agent systems.
          </p>

          {/* Code */}
          <div className="mt-10 max-w-xl mx-auto bg-surface border border-border rounded-lg p-4 text-left text-sm leading-relaxed overflow-x-auto">
            {code.split("\n").map((line, i) => {
              const trimmed = line.trim();
              const isComment = trimmed.startsWith("//");
              const isKeyword = /^(const|await|import|from|new)\b/.test(trimmed);
              return (
                <div key={i} className="whitespace-nowrap">
                  {isComment ? (
                    <span className="text-muted/40">{line}</span>
                  ) : isKeyword ? (
                    <>
                      <span className="text-accent font-medium">{trimmed.match(/^(const|await|import|from|new)/)?.[0]}</span>
                      <span className="text-white/80">{trimmed.slice(trimmed.match(/^(const|await|import|from|new)/)?.[0].length)}</span>
                    </>
                  ) : (
                    <span className="text-white/80">{line}</span>
                  )}
                </div>
              );
            })}
          </div>

          <p className="mt-4 text-sm text-muted max-w-md mx-auto">
            No drivers. No sensor setup. No boilerplate. Just intent → execution.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="#install" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-sm bg-accent text-white hover:bg-accent-dim transition-colors">
              <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none"><path d="M3 2l10 6-10 6V2z" fill="currentColor"/></svg>
              Get Started
            </a>
            <a href="#architecture" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-sm border border-border text-muted hover:text-white hover:border-white/30 transition-colors">
              View Architecture
            </a>
          </div>

          <div className="mt-16 flex justify-center gap-12 border-t border-border pt-6">
            {[
              { value: "1 API", label: "Unified interface" },
              { value: "3 Layers", label: "Clean design" },
              { value: "∞ Scale", label: "Single drone to fleet" },
            ].map((s) => (
              <div key={s.value} className="text-center">
                <div className="text-lg font-bold text-white">{s.value}</div>
                <div className="text-xs text-muted mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────── Problem → Solution ─────── */}
      <section id="why" className="py-24 border-t border-border">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold tracking-widest text-muted uppercase">The Problem</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2">Robotics is still too low-level.</h2>
            <p className="text-muted mt-2 text-sm max-w-sm mx-auto">Every system is rebuilt from scratch. Atlas removes that.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="text-xs font-semibold text-muted mb-3 uppercase tracking-wider">Before</div>
              <div className="grid grid-cols-2 gap-2">
                {problems.map((item) => (
                  <div key={item} className="flex items-center gap-2 bg-surface border border-border rounded-lg px-3.5 py-2.5 text-sm text-muted">
                    <span className="text-red-400/50 text-base leading-none">✕</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-muted mb-3 uppercase tracking-wider">After</div>
              <div className="grid grid-cols-2 gap-2">
                {solutions.map((item) => (
                  <div key={item} className="flex items-center gap-2 bg-surface border border-border rounded-lg px-3.5 py-2.5 text-sm text-white">
                    <span className="text-green font-bold">✓</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-10 text-center">
            <div className="inline-block bg-surface border border-border rounded-xl p-5">
              <p className="text-xs text-muted mb-2">You don&apos;t program motors. You declare missions:</p>
              <div className="text-sm font-mono text-white/80 leading-relaxed">
                <span className="text-accent font-medium">await</span> robot.<span className="text-white">explore</span>();<br />
                <span className="text-accent font-medium">await</span> drone.<span className="text-white">inspectBridge</span>();<br />
                <span className="text-accent font-medium">await</span> fleet.<span className="text-white">deploy</span>(<span className="text-muted">&quot;perimeter sweep&quot;</span>);
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────── Architecture ─────── */}
      <section id="architecture" className="py-24 border-t border-border">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold tracking-widest text-muted uppercase">Architecture</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2">Three layers. No bloat.</h2>
            <p className="text-muted mt-2 text-sm">Designed for autonomy from the ground up.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {layers.map((layer) => (
              <div key={layer.title} className="bg-surface border border-border rounded-xl p-5 hover:border-white/20 transition-colors">
                <h3 className="font-semibold text-white mb-3">{layer.title}</h3>
                <ul className="space-y-1.5">
                  {layer.items.map((item) => (
                    <li key={item} className="text-sm text-muted flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-accent flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────── Features ─────── */}
      <section id="features" className="py-24 border-t border-border">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold tracking-widest text-muted uppercase">Why Atlas</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2">What makes Atlas different</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {features.map((f) => (
              <div key={f.title} className="bg-surface border border-border rounded-xl p-5 hover:border-white/20 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center mb-3">
                  <div className="w-3 h-3 rounded-sm border border-accent" />
                </div>
                <h3 className="font-semibold text-white mb-1">{f.title}</h3>
                <p className="text-sm text-muted">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────── Demos ─────── */}
      <section id="demos" className="py-24 border-t border-border">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold tracking-widest text-muted uppercase">Demos</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2">See it in action</h2>
            <p className="text-muted mt-2 text-sm">Each demo runs a full autonomous scenario with telemetry + 3D simulation.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {demos.map((demo) => (
              <div key={demo.cmd} className="bg-surface border border-border rounded-lg p-4 hover:border-white/20 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green/60" />
                  <code className="text-sm font-medium text-white font-mono">{demo.cmd}</code>
                </div>
                <p className="text-sm text-muted ml-3.5">{demo.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────── Install ─────── */}
      <section id="install" className="py-24 border-t border-border">
        <div className="max-w-xl mx-auto px-6 text-center">
          <span className="text-xs font-semibold tracking-widest text-muted uppercase">Get Started</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2 mb-2">Install in under a minute</h2>
          <p className="text-muted text-sm mb-8">Clone, install, and run your first autonomous mission.</p>

          <div className="bg-surface border border-border rounded-lg p-4 text-left text-sm font-mono leading-relaxed">
            <div><span className="text-muted/40"># Clone the repo</span></div>
            <div className="text-white/80">git clone https://github.com/anomalyco/atlas.git</div>
            <div className="text-white/80 mb-3">cd atlas</div>
            <div><span className="text-muted/40"># Install &amp; run</span></div>
            <div className="text-white/80">npm install</div>
            <div className="text-white/80">npm run demo</div>
          </div>

          <button
            onClick={copyInstall}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium border border-border text-muted hover:text-white hover:border-white/30 transition-colors bg-surface cursor-pointer"
          >
            {copied ? (
              <><span className="text-green">✓</span> Copied</>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                Copy install command
              </>
            )}
          </button>
        </div>
      </section>

      {/* ─────── Vision ─────── */}
      <section className="py-24 border-t border-border">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs bg-surface border border-border text-muted mb-6">
            Vision
          </div>
          <p className="text-xl sm:text-2xl font-semibold text-white leading-relaxed">
            Atlas is not just a robotics framework.
          </p>
          <p className="text-xl sm:text-2xl font-semibold mt-2 leading-relaxed">
            It is <span className="text-accent">an operating system for autonomous machines.</span>
          </p>
        </div>
      </section>

      {/* ─────── Final CTA ─────── */}
      <section className="pb-24 pt-4">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="bg-surface border border-border rounded-2xl p-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Start building autonomous systems today.
            </h2>
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {["drones", "rovers", "fleets", "simulation"].map((item) => (
                <span key={item} className="px-3 py-1 rounded-full text-xs border border-border text-muted">{item}</span>
              ))}
            </div>
            <p className="text-muted text-sm mb-5">All from one API.</p>
            <div className="max-w-xs mx-auto bg-deep border border-border rounded-lg p-3 text-left text-sm font-mono">
              <span className="text-accent font-medium">const</span> <span className="text-white/80">atlas</span> = <span className="text-accent font-medium">new</span> <span className="text-white/80">Atlas</span>();
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <a href="#install" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-sm bg-accent text-white hover:bg-accent-dim transition-colors">
                <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none"><path d="M3 2l10 6-10 6V2z" fill="currentColor"/></svg>
                Get Started
              </a>
              <a href="https://github.com/shahzain19/Atlas" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-sm border border-border text-muted hover:text-white hover:border-white/30 transition-colors">
                <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
                GitHub
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─────── Footer ─────── */}
      <footer className="border-t border-border py-8">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-5 h-5 rounded bg-accent flex items-center justify-center text-white font-bold text-[10px]">A</div>
            <span className="font-semibold text-white text-sm">Atlas</span>
          </div>
          <p className="text-xs text-muted">
            <a href="https://github.com/anomalyco/atlas" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub</a>
            <span className="mx-2">·</span>MIT License
            <span className="mx-2">·</span>
            Built by <a href="https://github.com/anomalyco" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">anomalyco</a>
          </p>
        </div>
      </footer>
    </div>
  );
}

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
  { cmd: "npm run demo:simulation",desc: "Full 3D simulation with live sensor visualization" },
];

export default function Page() {
  const [copied, setCopied] = useState(false);

  const copyInstall = async () => {
    await navigator.clipboard.writeText("git clone https://github.com/anomalyco/atlas.git && cd atlas && npm install && npm run demo");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-white">

      {/* ─────── Nav ─────── */}
      <nav className="flex items-center justify-between max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center gap-2 font-bold text-lg text-black">
          <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none">
            <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2"/>
            <circle cx="16" cy="16" r="4" fill="currentColor"/>
          </svg>
          Atlas<span className="text-black">.</span>
        </div>
        <div className="hidden sm:flex items-center gap-6 text-sm text-[#666666]">
          <a href="#problem" className="hover:text-black transition-colors">Why</a>
          <a href="#architecture" className="hover:text-black transition-colors">Architecture</a>
          <a href="#demos" className="hover:text-black transition-colors">Demos</a>
          <a href="#vision" className="hover:text-black transition-colors">Vision</a>
          <a href="https://github.com/anomalyco/atlas" target="_blank" rel="noopener noreferrer" className="hover:text-black transition-colors">GitHub</a>
        </div>
      </nav>

      {/* ─────── Hero ─────── */}
      <section className="relative overflow-hidden pt-24 pb-20 sm:pt-32 sm:pb-28">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(0,0,0,0.03) 0%, transparent 60%)" }} />
        <div className="max-w-6xl mx-auto px-6 text-center relative">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] text-black">
            Universal Platform for<br />
            <span className="text-black">Intelligent Machines</span>
          </h1>
          <p className="mt-5 text-lg sm:text-xl text-[#666666] max-w-2xl mx-auto">
            Build drones, robots, and autonomous systems with one API.
          </p>

          {/* Code block */}
          <div className="mt-10 max-w-xl mx-auto bg-[#fafafa] border border-[#e5e5e5] rounded-xl p-5 text-left text-sm leading-relaxed overflow-x-auto">
            {code.split("\n").map((line, i) => {
              const isComment = line.startsWith("//");
              const isKeyword = /^(const|await|import|from|new)\b/.test(line.trim());
              return (
                <div key={i} className="whitespace-nowrap">
                  {isComment ? (
                    <span className="text-[#9ca3af]">{line}</span>
                  ) : isKeyword ? (
                    <>
                      <span className="font-semibold text-black">{line.match(/^\s*(const|await|import|from|new)\s*/)?.[0]}</span>
                      <span className="text-[#333333]">{line.replace(/^\s*(const|await|import|from|new)\s*/, "")}</span>
                    </>
                  ) : (
                    <span className="text-[#333333]">{line}</span>
                  )}
                </div>
              );
            })}
          </div>

          <p className="mt-6 text-sm text-[#666666] max-w-lg mx-auto leading-relaxed">
            No drivers. No sensor setup. No robotics boilerplate.<br />
            <span className="text-black font-medium">Just intent → execution.</span>
          </p>

          <p className="mt-10 text-base sm:text-lg text-[#666666] max-w-xl mx-auto">
            Atlas is an event-driven autonomy runtime for robots, drones, and multi-agent systems.
          </p>

          {/* CTA buttons */}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="#install" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm bg-black text-white hover:bg-[#333333] transition-all hover:-translate-y-0.5">
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none"><path d="M3 2l10 6-10 6V2z" fill="currentColor"/></svg>
              Get Started
            </a>
            <a href="#architecture" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm border border-[#e5e5e5] text-black hover:border-black transition-all">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
              View Architecture
            </a>
            <a href="#demos" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm border border-[#e5e5e5] text-black hover:border-black transition-all">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polygon points="10 8 10 16 16 12" fill="currentColor" stroke="none"/></svg>
              Run Demo
            </a>
          </div>
        </div>
      </section>

      {/* ─────── Problem ─────── */}
      <section id="problem" className="py-20 sm:py-28">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-black mb-4">Robotics is still too low-level.</h2>
          <p className="text-[#666666] mb-10 max-w-xl">
            Today you still have to deal with:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              "Sensor initialization",
              "Hardware drivers",
              "Navigation stacks",
              "Networking layers",
              "Custom control loops",
              "State management",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 bg-[#f5f5f5] border border-[#e5e5e5] rounded-lg px-4 py-3 text-sm text-black">
                <span className="text-[#9ca3af]">✕</span>
                {item}
              </div>
            ))}
          </div>
          <p className="mt-8 text-[#666666] italic">
            Every system is rebuilt from scratch.
          </p>
          <p className="mt-2 text-lg font-semibold text-black">
            Atlas removes that.
          </p>
        </div>
      </section>

      {/* ─────── Solution ─────── */}
      <section className="py-20 sm:py-28 bg-[#f5f5f5]">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-black mb-4">Atlas abstracts intelligence, not hardware.</h2>
          <p className="text-[#666666] mb-10">
            You don&apos;t program motors. You declare missions:
          </p>
          <div className="bg-[#fafafa] border border-[#e5e5e5] rounded-xl p-5 text-sm leading-relaxed font-mono text-black mb-10">
            <span className="font-semibold text-black">await</span> robot.<span className="text-black">explore</span>();<br />
            <span className="font-semibold text-black">await</span> drone.<span className="text-black">inspectBridge</span>();<br />
            <span className="font-semibold text-black">await</span> fleet.<span className="text-black">deploy</span>(<span className="text-black">&quot;perimeter sweep&quot;</span>);
          </div>
          <p className="text-[#666666] mb-6">Atlas handles:</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {["Perception", "Planning", "Coordination", "Telemetry", "Recovery", "Simulation sync"].map((item) => (
              <div key={item} className="flex items-center gap-3 border border-[#e5e5e5] rounded-lg px-4 py-3 text-sm text-black bg-white">
                <span className="text-black font-bold">✓</span>
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────── Architecture ─────── */}
      <section id="architecture" className="py-20 sm:py-28">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-black mb-2">Core Architecture</h2>
          <p className="text-[#666666] mb-10">Three layers. No bloat.</p>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { title: "API Layer", items: ["Atlas, Robot, Drone, Fleet", "Mission interface"] },
              { title: "Runtime Layer", items: ["EventBus", "Task system", "Mission planner", "Memory system"] },
              { title: "Intelligence Layer", items: ["Perception", "Decision engine", "Planning system"] },
            ].map((layer) => (
              <div key={layer.title} className="bg-[#f5f5f5] border border-[#e5e5e5] rounded-xl p-6">
                <div className="w-8 h-1 rounded-full bg-black mb-4" />
                <h3 className="text-lg font-semibold text-black mb-3">{layer.title}</h3>
                <ul className="space-y-2">
                  {layer.items.map((item) => (
                    <li key={item} className="text-sm text-[#666666] flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-black" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────── What makes Atlas different ─────── */}
      <section className="py-20 sm:py-28 bg-[#f5f5f5]">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-black mb-10">What makes Atlas different</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { title: "Simulation-first design", desc: "Every mission runs in simulation before hardware." },
              { title: "Event-driven core", desc: "Everything communicates through events, not function calls." },
              { title: "Multi-agent native", desc: "Fleet coordination is not an addon — it's built in." },
              { title: "Hardware-agnostic", desc: "Same API works in simulation, real drones, robots, and hybrid systems." },
            ].map((item) => (
              <div key={item.title} className="bg-white border border-[#e5e5e5] rounded-xl p-6 hover:border-black transition-colors">
                <div className="w-10 h-10 rounded-lg bg-black/5 flex items-center justify-center mb-4">
                  <div className="w-4 h-4 rounded-sm border-2 border-black" />
                </div>
                <h3 className="font-semibold text-black mb-2">{item.title}</h3>
                <p className="text-sm text-[#666666]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────── Live Demos ─────── */}
      <section id="demos" className="py-20 sm:py-28">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-black mb-2">Live Demos</h2>
          <p className="text-[#666666] mb-8">Each demo runs a full autonomous scenario with telemetry + visual simulation.</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {demos.map((demo) => (
              <div key={demo.cmd} className="bg-[#f5f5f5] border border-[#e5e5e5] rounded-xl p-5 hover:border-black transition-colors">
                <code className="text-sm font-semibold text-black font-mono">{demo.cmd}</code>
                <p className="text-sm text-[#666666] mt-2">{demo.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────── Install ─────── */}
      <section id="install" className="py-20 sm:py-28 bg-[#f5f5f5]">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-black mb-2">Install</h2>
          <p className="text-[#666666] mb-8">Clone, install, and run in under a minute.</p>
          <div className="bg-[#fafafa] border border-[#e5e5e5] rounded-xl p-5 text-left text-sm font-mono leading-relaxed">
            <span className="text-[#9ca3af]"># Clone the repo</span><br />
            <span className="text-black">git clone https://github.com/anomalyco/atlas.git</span><br />
            <span className="text-black">cd atlas</span><br /><br />
            <span className="text-[#9ca3af]"># Install &amp; run</span><br />
            <span className="text-black">npm install</span><br />
            <span className="text-black">npm run demo</span>
          </div>
          <button
            onClick={copyInstall}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium border border-[#e5e5e5] text-black hover:border-black transition-all cursor-pointer"
          >
            {copied ? (
              <>✓ Copied</>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                Copy install command
              </>
            )}
          </button>
        </div>
      </section>

      {/* ─────── Vision ─────── */}
      <section id="vision" className="py-20 sm:py-28">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium bg-black/5 text-black border border-black/10 mb-6">
            Vision
          </div>
          <p className="text-xl sm:text-2xl font-semibold text-black leading-relaxed">
            Atlas is not just a robotics framework.
          </p>
          <p className="text-xl sm:text-2xl font-semibold text-black mt-2 leading-relaxed">
            It is <span className="text-black">an operating system for autonomous machines.</span>
          </p>
        </div>
      </section>

      {/* ─────── Final CTA ─────── */}
      <section className="pb-28 pt-8">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-black mb-4">
            Start building autonomous systems today.
          </h2>
          <div className="flex flex-wrap justify-center gap-3 text-sm mb-10">
            {["drones", "rovers", "fleets", "simulation agents"].map((item) => (
              <span key={item} className="px-4 py-1.5 rounded-full border border-[#e5e5e5] text-black">
                {item}
              </span>
            ))}
          </div>
          <p className="text-[#666666] mb-6">All from one API.</p>
          <div className="max-w-lg mx-auto bg-[#fafafa] border border-[#e5e5e5] rounded-xl p-4 text-left text-sm font-mono">
            <span className="font-semibold text-black">const</span> <span className="text-black">atlas</span> = <span className="font-semibold text-black">new</span> <span className="text-black">Atlas</span>();
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="#install" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm bg-black text-white hover:bg-[#333333] transition-all hover:-translate-y-0.5">
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none"><path d="M3 2l10 6-10 6V2z" fill="currentColor"/></svg>
              Get Started
            </a>
            <a href="https://github.com/anomalyco/atlas" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm border border-[#e5e5e5] text-black hover:border-black transition-all">
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
              GitHub
            </a>
          </div>
        </div>
      </section>

      {/* ─────── Footer ─────── */}
      <footer className="border-t border-[#e5e5e5] py-8 text-center text-sm text-[#666666]">
        <p>
          Atlas —{" "}
          <a href="https://github.com/anomalyco/atlas" target="_blank" rel="noopener noreferrer" className="text-black hover:underline">GitHub</a>
          {" · "}MIT License
        </p>
        <p className="mt-2">
          Built by{" "}
          <a href="https://github.com/anomalyco" target="_blank" rel="noopener noreferrer" className="text-black hover:underline">anomalyco</a>
        </p>
      </footer>
    </div>
  );
}

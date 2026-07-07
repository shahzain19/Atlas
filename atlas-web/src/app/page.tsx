"use client";

import { useState, useEffect, useRef } from "react";

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
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
      </svg>
    ),
  },
  {
    title: "Runtime Layer",
    items: ["EventBus system", "Task scheduler", "Mission planner", "Memory system"],
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
  },
  {
    title: "Intelligence Layer",
    items: ["Perception pipeline", "Decision engine", "Planning system", "Multi-agent coordination"],
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>
    ),
  },
];

const features = [
  {
    title: "Simulation-first design",
    desc: "Every mission runs identically in simulation before touching hardware. Validate your logic without risk.",
    gradient: "from-indigo-500 to-cyan-500",
  },
  {
    title: "Event-driven core",
    desc: "Everything communicates through events, not function calls. Decoupled, scalable, and observable by design.",
    gradient: "from-cyan-500 to-teal-500",
  },
  {
    title: "Multi-agent native",
    desc: "Fleet coordination is not an addon — it's built into the core. Swarm intelligence out of the box.",
    gradient: "from-violet-500 to-indigo-500",
  },
  {
    title: "Hardware-agnostic",
    desc: "The same API drives simulation, real drones, rovers, and hybrid systems. Swap hardware, keep your code.",
    gradient: "from-emerald-500 to-cyan-500",
  },
];

const navLinks = ["Why Atlas", "Architecture", "Features", "Demos"];

export default function Page() {
  const [copied, setCopied] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const sectionRefs = useRef<Map<string, HTMLElement | null>>(new Map());

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set(prev).add(entry.target.id));
          }
        });
      },
      { threshold: 0.15 }
    );

    sectionRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    addEventListener("scroll", onScroll, { passive: true });
    return () => {
      removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, []);

  const setSectionRef = (id: string) => (el: HTMLElement | null) => {
    sectionRefs.current.set(id, el);
  };

  const copyInstall = async () => {
    await navigator.clipboard.writeText("git clone https://github.com/anomalyco/atlas.git && cd atlas && npm install && npm run demo");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const visible = (id: string) => visibleSections.has(id);

  return (
    <div className="min-h-screen bg-deep overflow-hidden">
      {/* ─────── Background Effects ─────── */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(99,102,241,0.08),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_80%,rgba(6,182,212,0.06),transparent_50%)]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* ─────── Nav ─────── */}
      <nav
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-deep/80 backdrop-blur-xl border-b border-white/5" : "bg-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
          <a href="#" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm group-hover:scale-105 transition-transform">
              A
            </div>
            <span className="font-bold text-lg text-white">Atlas</span>
          </a>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link}
                href={`#${link.toLowerCase().replace(/\s+/g, "-")}`}
                className="text-sm text-white/60 hover:text-white transition-colors"
              >
                {link}
              </a>
            ))}
            <a
              href="https://github.com/anomalyco/atlas"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white hover:bg-white/10 transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
              GitHub
            </a>
          </div>
        </div>
      </nav>

      {/* ─────── Hero ─────── */}
      <section className="relative min-h-screen flex items-center pt-20 pb-28">
        <div className="max-w-6xl mx-auto px-6 w-full">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 mb-8 animate-fade-in">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse-glow" />
              Universal Platform for Intelligent Machines
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.05] text-white">
              Build autonomy.
              <br />
              <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
                Not infrastructure.
              </span>
            </h1>

            <p className="mt-5 text-lg sm:text-xl text-white/50 max-w-xl mx-auto">
              An event-driven autonomy runtime for robots, drones, and multi-agent systems. One API to build, simulate, and deploy.
            </p>
          </div>

          {/* Code Block */}
          <div className="mt-12 max-w-2xl mx-auto">
            <div className="rounded-xl border border-white/5 bg-white/[0.03] backdrop-blur-sm overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
                <span className="w-3 h-3 rounded-full bg-red-500/50" />
                <span className="w-3 h-3 rounded-full bg-amber-500/50" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/50" />
                <span className="text-xs text-white/30 ml-2">atlas-examples/drone-patrol.ts</span>
              </div>
              <div className="p-5 text-sm leading-relaxed overflow-x-auto">
                {code.split("\n").map((line, i) => {
                  const trimmed = line.trim();
                  const isComment = trimmed.startsWith("//");
                  const isKeyword = /^(const|await|import|from|new)\b/.test(trimmed);
                  return (
                    <div key={i} className="whitespace-nowrap">
                      {isComment ? (
                        <span className="text-white/20">{line}</span>
                      ) : isKeyword ? (
                        <>
                          <span className="text-indigo-400 font-semibold">{line.match(/^\s*/)?.[0]}</span>
                          <span className="text-indigo-400 font-semibold">{trimmed.match(/^(const|await|import|from|new)/)?.[0]}</span>
                          <span className="text-white/80">{trimmed.slice(trimmed.match(/^(const|await|import|from|new)/)?.[0].length)}</span>
                        </>
                      ) : (
                        <span className="text-white/80">{line}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a
              href="#install"
              className="group relative inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-sm text-white overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-cyan-600 rounded-xl transition-transform group-hover:scale-105" />
              <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.15),transparent_60%)]" />
              <svg className="w-4 h-4 relative" viewBox="0 0 16 16" fill="none"><path d="M3 2l10 6-10 6V2z" fill="currentColor"/></svg>
              <span className="relative">Get Started</span>
            </a>
            <a
              href="#architecture"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-sm text-white/80 border border-white/10 hover:border-white/20 hover:text-white transition-all bg-white/[0.03]"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              View Architecture
            </a>
          </div>

          {/* Stats bar */}
          <div className="mt-20 grid grid-cols-3 gap-8 max-w-lg mx-auto border-t border-white/5 pt-8">
            {[
              { value: "1 API", label: "Unified interface" },
              { value: "3 Layers", label: "Clean architecture" },
              { value: "∞ Scale", label: "Single drone to fleet" },
            ].map((s) => (
              <div key={s.value} className="text-center">
                <div className="text-lg font-bold text-white">{s.value}</div>
                <div className="text-xs text-white/40 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────── Problem → Solution ─────── */}
      <section id="why-atlas" ref={setSectionRef("why-atlas")} className="py-28">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold tracking-widest text-white/30 uppercase">The Problem</span>
            <h2 className={`text-3xl sm:text-4xl font-bold text-white mt-3 transition-all duration-700 ${visible("why-atlas") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              Robotics is still too low-level.
            </h2>
            <p className="text-white/50 mt-3 max-w-md mx-auto">
              Every system is rebuilt from scratch. Atlas removes that.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="text-sm font-semibold text-white/40 mb-4 uppercase tracking-wider">Before Atlas</div>
              <div className="grid grid-cols-2 gap-3">
                {problems.map((item) => (
                  <div key={item} className="flex items-center gap-3 bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3 text-sm text-white/60">
                    <span className="text-red-400/60 text-lg leading-none">✕</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 rounded-3xl blur-xl" />
              <div className="relative">
                <div className="text-sm font-semibold text-white/40 mb-4 uppercase tracking-wider">With Atlas</div>
                <div className="grid grid-cols-2 gap-3">
                  {solutions.map((item) => (
                    <div key={item} className="flex items-center gap-3 bg-white/[0.05] border border-indigo-500/20 rounded-xl px-4 py-3 text-sm text-white">
                      <span className="text-emerald-400 font-bold">✓</span>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className={`mt-12 text-center transition-all duration-700 delay-200 ${visible("why-atlas") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <div className="inline-block bg-white/[0.03] border border-white/5 rounded-2xl p-6 max-w-lg">
              <p className="text-sm text-white/60 mb-2">You don&apos;t program motors. You declare missions:</p>
              <div className="text-base font-mono text-white leading-relaxed">
                <span className="text-indigo-400 font-semibold">await</span> robot.<span className="text-cyan-400">explore</span>();<br />
                <span className="text-indigo-400 font-semibold">await</span> drone.<span className="text-cyan-400">inspectBridge</span>();<br />
                <span className="text-indigo-400 font-semibold">await</span> fleet.<span className="text-cyan-400">deploy</span>(<span className="text-amber-400/80">&quot;perimeter sweep&quot;</span>);
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────── Architecture ─────── */}
      <section id="architecture" ref={setSectionRef("architecture")} className="py-28 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/[0.02] to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto px-6 relative">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold tracking-widest text-white/30 uppercase">Architecture</span>
            <h2 className={`text-3xl sm:text-4xl font-bold text-white mt-3 transition-all duration-700 ${visible("architecture") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              Three layers. No bloat.
            </h2>
            <p className="text-white/50 mt-3">Designed for autonomy from the ground up.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {layers.map((layer, i) => (
              <div
                key={layer.title}
                className={`group relative bg-white/[0.03] border border-white/5 rounded-2xl p-6 hover:border-indigo-500/30 transition-all duration-500 ${visible("architecture") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
                style={{ transitionDelay: `${i * 150}ms` }}
              >
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.06),transparent_60%)]" />
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-white/5 flex items-center justify-center text-indigo-400 mb-4">
                    {layer.icon}
                  </div>
                  <div className="w-8 h-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-3">{layer.title}</h3>
                  <ul className="space-y-2">
                    {layer.items.map((item) => (
                      <li key={item} className="text-sm text-white/50 flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-white/20 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────── Features ─────── */}
      <section id="features" ref={setSectionRef("features")} className="py-28">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold tracking-widest text-white/30 uppercase">Why Atlas</span>
            <h2 className={`text-3xl sm:text-4xl font-bold text-white mt-3 transition-all duration-700 ${visible("features") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              What makes Atlas different
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {features.map((f, i) => (
              <div
                key={f.title}
                className={`group relative bg-white/[0.03] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all duration-500 ${visible("features") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
                style={{ transitionDelay: `${i * 150}ms` }}
              >
                <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br ${f.gradient} opacity-[0.03]`} />
                <div className="relative">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${f.gradient} bg-opacity-20 flex items-center justify-center mb-4`}>
                    <div className="w-3 h-3 rounded-sm border-2 border-white/80" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────── Demos ─────── */}
      <section id="demos" ref={setSectionRef("demos")} className="py-28 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/[0.02] to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto px-6 relative">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold tracking-widest text-white/30 uppercase">Live Demos</span>
            <h2 className={`text-3xl sm:text-4xl font-bold text-white mt-3 transition-all duration-700 ${visible("demos") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              See it in action
            </h2>
            <p className="text-white/50 mt-3">Each demo runs a full autonomous scenario with telemetry + 3D simulation.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {demos.map((demo, i) => (
              <div
                key={demo.cmd}
                className={`group bg-white/[0.03] border border-white/5 rounded-xl p-5 hover:border-indigo-500/30 transition-all duration-500 ${visible("demos") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
                style={{ transitionDelay: `${i * 150}ms` }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60" />
                  <code className="text-sm font-semibold text-white font-mono">{demo.cmd}</code>
                </div>
                <p className="text-sm text-white/50 ml-3.5">{demo.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────── Install ─────── */}
      <section id="install" ref={setSectionRef("install")} className="py-28">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <span className="text-xs font-semibold tracking-widest text-white/30 uppercase">Get Started</span>
          <h2 className={`text-3xl sm:text-4xl font-bold text-white mt-3 mb-3 transition-all duration-700 ${visible("install") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            Install in under a minute
          </h2>
          <p className="text-white/50 mb-10">Clone, install, and run your first autonomous mission.</p>

          <div className={`rounded-xl border border-white/5 bg-white/[0.03] overflow-hidden transition-all duration-700 delay-150 ${visible("install") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
              <span className="w-3 h-3 rounded-full bg-red-500/50" />
              <span className="w-3 h-3 rounded-full bg-amber-500/50" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/50" />
              <span className="text-xs text-white/30 ml-2">terminal</span>
            </div>
            <div className="p-5 text-left text-sm font-mono leading-relaxed">
              <div><span className="text-white/30"># Clone the repo</span></div>
              <div className="text-white/90">git clone https://github.com/anomalyco/atlas.git</div>
              <div className="text-white/90 mb-3">cd atlas</div>
              <div><span className="text-white/30"># Install &amp; run</span></div>
              <div className="text-white/90">npm install</div>
              <div className="text-white/90">npm run demo</div>
            </div>
          </div>

          <button
            onClick={copyInstall}
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium border border-white/10 text-white/70 hover:border-white/20 hover:text-white transition-all bg-white/[0.03] cursor-pointer"
          >
            {copied ? (
              <><span className="text-emerald-400">✓</span> Copied</>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                Copy install command
              </>
            )}
          </button>
        </div>
      </section>

      {/* ─────── Vision ─────── */}
      <section className="py-28 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/[0.03] to-transparent pointer-events-none" />
        <div className="max-w-3xl mx-auto px-6 text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 border border-indigo-500/20 text-indigo-300 mb-8">
            Vision
          </div>
          <blockquote className="text-2xl sm:text-3xl font-semibold text-white leading-relaxed">
            <span className="text-white/40">&ldquo;</span>Atlas is not just a robotics framework.
          </blockquote>
          <div className="mt-3 text-2xl sm:text-3xl font-semibold leading-relaxed">
            It is <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">an operating system for autonomous machines.</span>
            <span className="text-white/40">&rdquo;</span>
          </div>
        </div>
      </section>

      {/* ─────── Final CTA ─────── */}
      <section className="pb-32 pt-8">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="relative rounded-3xl bg-gradient-to-br from-indigo-500/10 via-transparent to-cyan-500/10 border border-white/5 p-12 sm:p-16 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(99,102,241,0.06),transparent_60%)]" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Start building autonomous systems today.
              </h2>
              <div className="flex flex-wrap justify-center gap-2 mb-8">
                {["drones", "rovers", "fleets", "simulation agents"].map((item) => (
                  <span key={item} className="px-4 py-1.5 rounded-full text-sm border border-white/10 text-white/60">
                    {item}
                  </span>
                ))}
              </div>
              <p className="text-white/50 mb-6">All from one API.</p>
              <div className="max-w-xs mx-auto bg-white/[0.05] border border-white/5 rounded-xl p-4 text-left text-sm font-mono">
                <span className="text-indigo-400 font-semibold">const</span> <span className="text-white/90">atlas</span> = <span className="text-indigo-400 font-semibold">new</span> <span className="text-white/90">Atlas</span>();
              </div>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <a
                  href="#install"
                  className="group relative inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-sm text-white overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-cyan-600 rounded-xl transition-transform group-hover:scale-105" />
                  <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.15),transparent_60%)]" />
                  <svg className="w-4 h-4 relative" viewBox="0 0 16 16" fill="none"><path d="M3 2l10 6-10 6V2z" fill="currentColor"/></svg>
                  <span className="relative">Get Started</span>
                </a>
                <a
                  href="https://github.com/shahzain19/Atlas"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-sm text-white/80 border border-white/10 hover:border-white/20 hover:text-white transition-all bg-white/[0.03]"
                >
                  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
                  GitHub
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────── Footer ─────── */}
      <footer className="border-t border-white/5 py-10">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2.5 mb-4">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xs">A</div>
            <span className="font-semibold text-white">Atlas</span>
          </div>
          <p className="text-sm text-white/30">
            <a href="https://github.com/anomalyco/atlas" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white/80 transition-colors">GitHub</a>
            <span className="mx-2">·</span>MIT License
          </p>
          <p className="mt-1 text-xs text-white/20">
            Built by{" "}
            <a href="https://github.com/anomalyco" target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-white/50 transition-colors">anomalyco</a>
          </p>
        </div>
      </footer>
    </div>
  );
}

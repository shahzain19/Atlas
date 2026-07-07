import {
  ArrowRight,
  Cpu,
  Globe,
  Network,
  Shield,
  Bot,
  Code2,
  Database,
  Layers,
  Radio,
  Terminal,
  Rocket,
  Brain,
  Eye,
} from "lucide-react";

const features = [
  {
    icon: Cpu,
    title: "Hardware Agnostic",
    text: "Control drones, rovers, robots, and custom machines through one unified abstraction layer.",
  },
  {
    icon: Brain,
    title: "Autonomous Intelligence",
    text: "Observe, remember, reason, plan, act, and learn through Atlas agents.",
  },
  {
    icon: Network,
    title: "Fleet Coordination",
    text: "Deploy and coordinate multiple autonomous systems as one intelligent network.",
  },
  {
    icon: Eye,
    title: "Advanced Perception",
    text: "Camera, LiDAR, GPS, IMU, radar, thermal, and sensor fusion pipelines.",
  },
  {
    icon: Database,
    title: "Machine Memory",
    text: "Short-term, long-term, and semantic memory for persistent world understanding.",
  },
  {
    icon: Shield,
    title: "Production Ready",
    text: "Authentication, permissions, telemetry, recovery, and mission monitoring.",
  },
];

const stats = [
  ["332+", "Integration Tests"],
  ["11", "Autonomous Agents"],
  ["4", "SDK Languages"],
  ["14", "Core Modules"],
];

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#16a34a22,transparent_67%)]" />

      <section className="relative max-w-7xl mx-auto px-6">
        {/* NAV */}

        <nav className="flex justify-between items-center py-10">
          <h1 className="text-3xl font-semibold">
            Atlas<span className="text-green-400">.</span>
          </h1>

          <div className="flex gap-8 text-sm text-zinc-400">
            <span>Platform</span>
            <span>SDK</span>
            <span>Docs</span>
            <span>GitHub</span>
          </div>
        </nav>

        {/* HERO */}

        <section className="pt-24 text-center">
          <p className="text-green-400 mb-6">UNIVERSAL AUTONOMY PLATFORM</p>

          <h2 className="text-8xl font-light tracking-tight leading-[0.9]">
            Build intelligent
            <br />
            machines with one API.
          </h2>

          <p className="max-w-3xl mx-auto mt-8 text-xl text-zinc-400">
            Atlas provides the complete infrastructure layer for autonomous
            systems — from simulation and AI reasoning to hardware deployment.
          </p>

          <div className="flex justify-center gap-4 mt-10">
            <button className="bg-green-400 text-black px-7 py-4 rounded-xl flex gap-2 items-center">
              Start Building
              <ArrowRight size={18} />
            </button>

            <button className="border border-zinc-800 px-7 py-4 rounded-xl">
              Read Documentation
            </button>
          </div>
        </section>

        {/* CODE */}

        <section className="mt-24">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-8">
            <div className="flex items-center gap-2 text-zinc-500 mb-5">
              <Code2 size={18} />
              typescript
            </div>

            <pre className="text-green-300 text-sm">
              {`import { Atlas } from "@atlas/sdk";

const atlas = new Atlas();

const drone = atlas.drone();

await drone.takeoff(20);

await drone.flyTo({
 latitude:37.7749,
 longitude:-122.4194
});

await drone.returnHome();`}
            </pre>
          </div>
        </section>

        {/* DEMO VIDEO */}

        <section className="mt-24">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden">
            <video className="w-full h-auto" src="/demo.webm" controls autoPlay loop muted playsInline />
          </div>
        </section>

        {/* STATS */}

        <section className="grid grid-cols-2 md:grid-cols-4 gap-5 mt-20">
          {stats.map(([number, label]) => (
            <div className="border border-zinc-800 rounded-2xl p-8">
              <h3 className="text-4xl font-semibold">{number}</h3>

              <p className="mt-3 text-zinc-400">{label}</p>
            </div>
          ))}
        </section>

        {/* FEATURES */}

        <section className="mt-32">
          <h2 className="text-5xl font-semibold text-center">
            Everything required for autonomy
          </h2>

          <p className="text-center text-zinc-400 mt-5">
            A complete robotics stack, from software to physical machines.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mt-14">
            {features.map((item) => {
              const Icon = item.icon;

              return (
                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-7">
                  <Icon className="text-green-400" />

                  <h3 className="text-xl font-medium mt-5">{item.title}</h3>

                  <p className="text-zinc-400 mt-3">{item.text}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ARCHITECTURE */}

        <section className="mt-36">
          <h2 className="text-5xl font-semibold">The Autonomous Stack</h2>

          <div className="mt-10 border border-zinc-800 bg-zinc-950 rounded-2xl p-10 font-mono text-green-300">
            {`

APPLICATIONS
Mission Scripts
SDKs
Studio
CLI


        ↓


ATLAS RUNTIME

Scheduler
EventBus
Task Manager
Mission Engine


        ↓


INTELLIGENCE

Agents
Planning
Reasoning
Memory
Learning


        ↓


HARDWARE

Sensors
Actuators
Drivers
Robots
Drones

`}
          </div>
        </section>

        {/* SDK */}

        <section className="mt-36">
          <h2 className="text-5xl font-semibold">
            One platform. Every language.
          </h2>

          <div className="grid md:grid-cols-4 gap-5 mt-10">
            {["Python", "JavaScript", "Go", "Rust"].map((lang) => (
              <div className="border border-zinc-800 rounded-xl p-8">
                <Terminal className="text-green-400" />

                <h3 className="text-xl mt-5">{lang}</h3>

                <p className="text-zinc-500 mt-2">Native Atlas SDK</p>
              </div>
            ))}
          </div>
        </section>

        {/* SIM */}

        <section className="mt-36 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-5xl font-semibold">
              Simulation first. Reality ready.
            </h2>

            <p className="text-zinc-400 mt-6 text-lg">
              Test missions inside a complete 3D environment before deploying to
              real hardware.
            </p>
          </div>

          <div className="border border-zinc-800 rounded-2xl p-10 bg-zinc-950">
            <Rocket className="text-green-400" />

            <h3 className="text-2xl mt-5">Digital → Physical</h3>

            <p className="text-zinc-400 mt-3">
              The same mission logic runs in simulation and real machines.
            </p>
          </div>
        </section>

        {/* FINAL */}

        <section className="py-40 text-center">
          <h2 className="text-6xl font-semibold">
            The operating system
            <br />
            for intelligent machines.
          </h2>

          <button className="mt-10 bg-green-400 text-black px-10 py-5 rounded-xl">
            Build with Atlas
          </button>
        </section>
      </section>
    </main>
  );
}

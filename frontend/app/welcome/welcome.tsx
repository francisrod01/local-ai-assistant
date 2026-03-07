import { Link } from "react-router";

// placeholder logos can be replaced with your own branding later
import logoDark from "./logo-dark.svg";
import logoLight from "./logo-light.svg";

export function Welcome() {
  return (
    <main className="relative flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-12">
        <header className="flex flex-col items-center gap-4">
          <div className="w-[300px] max-w-[80vw] p-4">
            {/* simple branding graphic or text; use existing svg files or replace */}
            <img
              src={logoLight}
              alt="Local AI Assistant logo"
              className="block w-full dark:hidden"
            />
            <img
              src={logoDark}
              alt="Local AI Assistant logo"
              className="hidden w-full dark:block"
            />
          </div>
          {/* intentionally omit page heading on landing */}
          <p className="text-center max-w-[500px] text-gray-700 dark:text-gray-300">
            Chat offline on your device using OpenSource models.
            <br />
            <span className="mt-2 block text-gray-600 dark:text-gray-400">phi3:mini via Ollama today (more in future).</span>
          </p>
        </header>

        <div className="space-y-4">
          <Link
            to="/chat"
            className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
          >
            Get Started&nbsp;→
          </Link>
          <p className="mt-6 text-sm text-gray-600 max-w-[400px]">
            You can also view the raw <Link to="/ollama_status" className="underline">Ollama status</Link> or the <Link to="/metrics" className="underline">Prometheus metrics</Link> directly.
          </p>
        </div>
      </div>
    </main>
  );
}

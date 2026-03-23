import React from "react";
import { Link } from "react-router";

export function Header() {
  return (
    <header className="bg-gray-900 text-white py-2 px-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-gradient-to-br from-indigo-400 via-purple-500 to-fuchsia-500 px-3 py-1">
            <span className="text-base font-bold tracking-tight">Local AI</span>
          </div>
          <nav className="hidden sm:flex gap-4">
            <Link to="/" className="hover:text-indigo-300">
              Home
            </Link>
            <Link to="/chat" className="hover:underline">
              Chat
            </Link>
            <Link to="/ollama_status" className="hover:underline">
              Ollama&nbsp;Status
            </Link>
            <Link to="/insights" className="hover:underline">
              Insights
            </Link>
            <Link to="/environment" className="hover:underline">
              Env
            </Link>
            <Link to="/logs" className="hover:underline">
              Logs
            </Link>
            <Link to="/metrics" className="hover:underline">
              Metrics
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}

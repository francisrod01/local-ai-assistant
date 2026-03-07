import React from "react";
import { Link } from "react-router";

export function Header() {
  return (
    <header className="bg-gray-800 text-white py-2 px-4">
      <div className="flex items-center justify-between">
        <nav className="flex gap-4">
          <Link to="/" className="hover:underline">
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
    </header>
  );
}

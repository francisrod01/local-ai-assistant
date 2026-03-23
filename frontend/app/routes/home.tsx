import { createPageTitle } from "../utils/meta";
import { Welcome } from "../welcome/welcome";

export function meta() {
  return [
    ...createPageTitle("Home"),
    { name: "description", content: "Welcome to Local AI Assistant" },
  ];
}

export default function Home() {
  return <Welcome />;
}

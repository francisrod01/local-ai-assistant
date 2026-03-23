import { createPageTitle } from "../utils/meta";
import ChatView from "../components/chat/ChatView";
import { useChat } from "../components/chat/useChat";

export function meta() {
  return createPageTitle("Chat");
}

export default function Chat() {
  const logic = useChat();
  return <ChatView {...logic} />;
}

import ChatView from "../components/chat/ChatView";
import { useChat } from "../components/chat/useChat";

export default function Chat() {
  const logic = useChat();
  return <ChatView {...logic} />;
}

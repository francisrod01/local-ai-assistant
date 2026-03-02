export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface Conversation {
  id: number;
  title: string;
  messages: Message[];
}

export type Message = {
  role: "user" | "assistant";
  content: string;
};

export type Conversation = {
  id: number;
  title: string;
  messages: Message[];
};

export type Message = {
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type Conversation = {
  id: string;
  title: string;
  description: string;
  messages: Message[];
  interactionIds: number[];
  updatedAt: string;
};

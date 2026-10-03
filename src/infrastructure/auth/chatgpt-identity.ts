import { getChatGPTUser } from "@/app/chatgpt-auth";
import type { IdentityProvider } from "../../application/ports";
export class ChatGPTIdentityProvider implements IdentityProvider {
  async current() { return getChatGPTUser(); }
}

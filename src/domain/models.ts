import type { Fut } from "./catalog";
export type RequestRecord = {
  id: string;
  code: string | null;
  serial: number;
  owner: string;
  content: Fut;
  status: string;
  office: string;
  response: string;
  revision: number;
  created: string;
  updated: string;
  submitted: string | null;
};
export type Attachment = {
  id: string;
  name: string;
  mime: string;
  size: number;
  kind: string;
  retired: number;
  created: string;
};
export type Event = {
  id: string;
  status: string;
  title: string;
  message: string;
  actor: string;
  created: string;
  snapshot: string | null;
};
export type Detail = RequestRecord & { events: Event[]; files: Attachment[] };
export type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  accountKind?: "institutional" | "external" | "administration";
  profile: Partial<Fut>;
};
export type Notice = {
  id: string;
  request: string;
  message: string;
  read: number;
  created: string;
};
export type Bootstrap = {
  user: User;
  mine: RequestRecord[];
  all: RequestRecord[];
  notifications: Notice[];
  users: Pick<User, "id" | "name" | "email" | "role">[];
};

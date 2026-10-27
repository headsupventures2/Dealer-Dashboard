import { createLocalStore } from "./local";

export const PREVIEW_ADMIN = { email: "admin@leadingedge.test", password: "leadingedge" };

export const previewStore = createLocalStore({
  mode: "preview",
  key: "led-preview-v1",
  photoDb: "led-preview-photos",
  seed: () => ({
    users: [{ id: "admin-1", role: "admin", company_id: null, ...PREVIEW_ADMIN }],
    companies: [],
    jobs: [],
    internalNotes: {},
    sessionUserId: null,
  }),
}).store;

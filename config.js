// ============================================================
//  BACKEND CONFIG — JSONBin.io
// ============================================================
//
// ONE-TIME SETUP (≈60 seconds):
//   1. Go to https://jsonbin.io/ and click "Sign Up" (free — use Google).
//   2. After signing in, click "CREATE BIN" (top right).
//      - Paste this into the editor:  {"ballots":[]}
//      - Name it "c4c-posters-2026" and click "Create".
//      - Copy the BIN ID shown in the URL (a ~24-char hex string).
//   3. Click your avatar → "API Keys". Copy the "X-Master-Key".
//   4. Paste BIN_ID and MASTER_KEY below, then commit + push.
//
//  That's it. No server, no FormSubmit, no CORS headaches.
//
//  Security note: the Master Key grants read/write access to EVERY
//  bin on this JSONBin account. Since this account only holds the
//  voting bin, exposing it in-page is fine for a judging window.
//  Rotate the key after voting closes (Settings → API Keys → New Key).
// ============================================================

window.C4C_CONFIG = {
  BACKEND: "jsonbin",               // "jsonbin" or "local" (offline-only test mode)
  JSONBIN_BIN_ID: "69deeefa36566621a8b4636a",
  JSONBIN_MASTER_KEY: "$2a$10$0fWcGvfYKWPi68MiU/FcSuuW05ucRQPGAAV6Hr3QMo/t6oKO28vnC",
  DEDUPE_BY_NAME: true,             // re-submissions replace your previous ballot
};

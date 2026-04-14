// Backend config. Uses JSONBlob (anonymous public JSON store, no signup required).
// The blob holds { ballots: [ { voterName, voterAffiliation, submittedAt, ballot: [...] }, ... ] }.
// If you ever want to reset results, just PUT {"ballots":[]} to the same URL,
// or generate a fresh blob via `curl -X POST https://jsonblob.com/api/jsonBlob -H "Content-Type: application/json" -d '{"ballots":[]}' -i`
// and paste the new ID into BLOB_ID below.
window.C4C_CONFIG = {
  BLOB_URL: "https://jsonblob.com/api/jsonBlob/019d8e65-7c8f-7ecc-ba1e-77a5e03ece3f",
  // If true: when the same voterName submits twice, the newer ballot replaces the older.
  DEDUPE_BY_NAME: true,
};

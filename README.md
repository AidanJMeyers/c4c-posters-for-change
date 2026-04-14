# Counselors for Change — Posters for Change 2026 Voting

A single-page judging ballot for the 2026 Posters for Change contest.

## What it does

- Displays all 22 poster submissions on one page with click-to-zoom.
- Collects the judge's name (required) and optional affiliation.
- Lets judges rank their top **8** posters in order of preference.
- For each ranked poster the judge assigns one of the four awards:
  - **Empower** — resources and skills for mental wellness
  - **Inspire** — challenges myths, stereotypes, and stigma
  - **Connect** — inclusion, equality, equity, social justice
  - **Prevent** — suicide prevention and awareness
- Submits the ballot via FormSubmit.co (forwards to `ameyers@rollins.edu`),
  with a fallback "Download as file" button if the online submission fails.

Winners will be selected from three tiers — up to 4 from junior high (6–8),
up to 4 from senior high (9–12), and up to 2 from undergraduate /
trade-tech school.

## Deploying on GitHub Pages

1. Push this folder to the `c4c-posters-for-change` repo under `AidanJMeyers`.
2. In the repo settings → Pages → choose the `main` branch root.
3. Share the resulting URL (e.g. `https://aidanjmeyers.github.io/c4c-posters-for-change/`).

## First-time FormSubmit setup

The first ballot submitted to `ameyers@rollins.edu` through FormSubmit.co will
trigger a one-time confirmation email from FormSubmit. Click the link in that
email once and every future ballot will be delivered automatically.

If FormSubmit is ever unavailable, judges can click **Download as file** and
email the generated JSON file to the organizers.

## File layout

```
index.html          # the voting page
styles.css          # styling
app.js              # ballot logic
posters.js          # list of poster records (id, artist, grade, image, original)
posters/            # rendered images + original PDFs
README.md           # this file
```

## Updating the poster list

Edit `posters.js` directly, or re-run the conversion script and update the file.
Each poster record needs:

```js
{
  id: "p23-new-artist",
  artist: "New Artist",
  grade: 11,           // or null if unknown
  image: "posters/p23-new-artist.png",
  original: "posters/p23-new-artist.pdf"
}
```

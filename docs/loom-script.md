# Loom Walkthrough Script — 2 minutes

**Setup before recording:**
- Open the deployed app on a mobile-viewport browser (Chrome devtools → iPhone 14 Pro)
- Have the GitHub repo open in another tab
- Have the architecture diagram (`docs/architecture.svg`) pulled up in a third tab
- Camera on, show your face in bottom corner

---

## The script (target: 1:55)

**[0:00–0:15] — Hook + what this is**

> "Hi, I'm Aditya. This is my submission for the ShareChat APM assignment — a system that surfaces what India is trending on, *right now*, built Hindi-first for ShareChat's Bharat audience. Let me show you the app first, then the pipeline behind it."

*Switch to the running app. Scroll the feed once.*

---

**[0:15–0:45] — Product demo**

> "Here's the feed. Notice three things.
>
> **One** — the top trend gets a hero card, not a flat list row. The #1 story of the day is always the story of the day; I didn't want to make users scan 10 equal cards to find it.
>
> **Two** — Hindi hashtag is primary and bold; English is secondary and muted. For a Hindi audience this ordering matters.
>
> **Three** — this heat bar is visual, not just a number. 80+ gets three flames, 60+ gets two. You can feel which trends are hot without reading scores."

*Tap a category pill at the top — e.g. cricket.*

> "Categories filter instantly — and they're ShareChat-native: cricket, entertainment, devotional, festival, not generic news taxonomy."

*Tap into the #1 trend.*

> "When you tap a trend, you get a detail view with an AI briefing — three Hindi bullet points explaining the trend, plus suggested hashtags and a call-to-action for creators. This is generated live by Claude Haiku per-trend, per-tap — the feed stays cheap, and we only pay the token cost when a user actually drills in."

*Point at the source chips.*

> "And we show which sources contributed — Google Trends, News, Reddit — so users can see *why* this is trending. Transparency is a product feature here, not a debug panel."

---

**[0:45–1:30] — How it works**

*Switch to the architecture diagram.*

> "Here's the pipeline. Three sources — Google Trends India RSS for search intent, seven Indian news feeds for recency, Reddit r/india for cultural pulse. Skipped Twitter deliberately; it's urban-English-skewed and a bad proxy for ShareChat's audience.
>
> Everything funnels into one batched Claude Haiku call that clusters duplicates, categorizes, translates to Hindi, writes the description, and filters out communal or irrelevant content — all in one shot. This is roughly ten times cheaper than sequential LLM calls, lower latency, and actually higher quality because the model sees all candidates together.
>
> Then a transparent five-component heat score — signal, cross-source corroboration, recency, category prior, India-relevance. A reviewer can inspect exactly why any tag ranks where it does by hitting `/api/trends?debug=1`.
>
> Then a greedy diversification step so cricket can't take all ten slots.
>
> Cached ten minutes, fresh on every invocation."

---

**[1:30–1:55] — Wrap + what's next**

> "Full stack is Next.js on Vercel, one Claude Haiku call per invocation costs about a tenth of a cent, so production cost is basically nothing.
>
> If I had four more weeks, the single biggest addition would be Hindi-language RSS feeds — Jagran, Bhaskar, Aaj Tak — because right now we're recovering Hindi from English sources, which is lossy. After that, real ShareChat internal signals: post velocity per tag, regional breakdown, engagement-based feedback loops.
>
> Repo and live demo are linked below. Thanks for watching."

---

## Recording tips

- **Speak 10% slower than feels natural** — Loom playback feels faster than live.
- **Click decisively.** One clean tap per beat, not hovering.
- **If you flub a line, keep going** — Loom auto-removes silence but doesn't fix re-takes. Better to re-record the whole thing than splice.
- **End with a smile + nod** — the last frame is the lasting impression.

## Recording order (in case things go wrong)

1. First take: just the demo (0:00–0:45). Get this smooth.
2. Second take: architecture segment (0:45–1:30). This is the hardest part — rehearse twice before recording.
3. Third take: wrap (1:30–1:55).
4. Stitch in Loom, or just record the full thing end-to-end once you've rehearsed each segment.

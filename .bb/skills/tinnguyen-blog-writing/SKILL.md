---
name: tinnguyen-blog-writing
description: Write and revise Tin's blog posts in this tinnguyen workspace. Use when drafting a post, turning a session or technical experiment into a blog narrative, editing content/posts/, or revising a post's tone, length, disclosure, or token-cost summary.
---

# Tin's blog writing

Apply these editorial preferences to blog writing in this workspace. Follow
Tin's latest request when it changes the format or level of detail.

The workspace root is three directories above this skill. Read
[AGENTS.md](../../../AGENTS.md) for repository and privacy constraints and
[README.md](../../../README.md#writing-a-post) for the Markdown format.

## Tell the story

- Write a continuous narrative by default. Work the goal, setup, investigation,
  important difficulties, and outcome into the prose. Avoid report headings
  such as Objective, Setup, Journey, Challenges, and Results unless requested.
- Start with the practical reason for the experiment. Preserve the premise,
  people, and circumstances that Tin actually supplied.
- Explain the tools and hardware when introducing them. Say what they do and
  why they were needed. When relevant, explain a model's lineage, modifications,
  and quantization rather than relying on its name alone.
- Separate the roles of different machines, tools, and physical components.
  Explain enough of the mechanism for the reader to follow the work.
- Keep the turning points and the final outcome. Compress repeated debugging
  attempts and incidental command output.
- Finish with the concrete result, remaining limitations, and any next experiment
  Tin has actually proposed. Describe future work as a plan.
- Shorten repetition before cutting useful technical detail. Keep a complete
  case study when that is the request; avoid reducing it to a thin summary.
  Use the requested length rather than imposing a fixed word count.

## Use a plain personal voice

- Write in Tin's first-person voice when recounting the work. Use ordinary words,
  short paragraphs, and complete sentences.
- Avoid invented emotions, dramatic frustration, self-blame, and generic lessons
  about the future of AI. Describe the actions and their consequences.
- Leave out prompts, dialogue excerpts, and transcript-style narration unless
  Tin explicitly asks for them.
- Remove rhetorical contrast framing such as "X, not Y", "not just X, but Y",
  "this isn't X; it's Y", and repeated "rather than" comparisons. State the
  observed fact directly, then explain any unresolved question in its own
  sentence. Ordinary factual negatives can remain where they are necessary.
- For example, write "We obtained SSH access. Full recovery remained unresolved."
  instead of "We achieved root access, not a recovered phone."
- Avoid fancy vocabulary, filler introductions, promotional language, decorative
  emojis, and stock conclusions. Use straight quotes and no em or en dashes.
- Keep formatting quiet. Use normal Markdown links and occasional emphasis;
  avoid bold labels, metric dashboards, and extra sections for small details.
- Read the workspace's [plain-writing skill](../plain-writing/SKILL.md) for
  general prose guidance. Tin's requested narrative format, cost summary, and
  disclosure wording take precedence where the guidance differs.
- Apply the `unslop` skill too if it is available. No global skill installation
  is required.

## Keep the claims grounded

- Read the supplied material before drafting. For agent-session exports, compare
  assistant claims with tool results and the user's observations. Follow the
  session's branches and account for context compaction when reconstructing
  the sequence.
- Track configuration changes that affect the result, including restores,
  firmware versions, model variants, and hardware changes. Describe the final
  recorded configuration accurately.
- Distinguish a successful build, an on-device test, and demonstrated useful
  operation. Describe exactly what the evidence supports.
- Attribute upstream limitations and model-card claims to their sources.
  Keep observed results and documented claims identifiable without repeated
  contrast sentences.
- Preserve uncertainty about causation, stability, and unverified capabilities.
  A short successful run only establishes that observed interval.
- Keep confirmed links and useful photographs during revisions. Use clear alt
  text and a short factual caption. Explain which equipment is pictured when
  that matters. Strip image metadata before adding a new public asset.
- Keep private exports, identifiers, credentials, and research notes outside
  the public repository. Include only the reviewed facts needed for the story.

## Keep token costs to one paragraph

When Tin wants a token-cost summary, give the total recorded token usage and
an approximate cost in one short paragraph. Mention reused cached context if
it accounts for a substantial part of the total.

For an estimated hosted equivalent of local inference, check current prices
for the relevant base model and calculate from the recorded input, cached-input,
and output counts. A local provider's zero-priced usage fields do not establish
its operating cost. Keep the calculation and detailed evidence outside the post.

In the prose, refer to the model family simply, such as "current Qwen3.8 token
prices", with a link to the pricing source. Label the amount as an estimate and
keep any cache assumption brief. Include an uncached comparison when useful.

Leave out provider names, exact hosted model IDs, per-million rate tables,
pricing dates, branch and compaction counts, formulas, TPS, latency, wattage,
and energy discussion unless Tin specifically requests those details.
Never reuse an old post's numbers as defaults or invent missing measurements.

## Put the AI disclosure up top

AI-generated posts should have one short italic disclosure at the beginning of
the body, after the TOML front matter and before the introduction.

Once a human audit is confirmed, use:

```markdown
*This post was AI-generated and audited by a human.*
```

For an unreviewed draft, disclose AI generation without claiming an audit:

```markdown
*This post was AI-generated.*
```

Confirm review before adding the audited wording. Keep the disclosure within
the article content; no site-wide badge or banner is needed.

## Edit and verify

- Edit posts under [content/posts/](../../../content/posts/) and assets under
  [public/](../../../public/). Preserve an existing post's title, date, slug,
  approved links, photo, and publication state unless the request changes them.
- For new posts, use the repository's TOML front matter and start with
  `draft = true`. Follow the repository's review and publication rules.
- Make targeted revisions. A request to shorten the cost paragraph should leave
  the rest of the technical narrative intact.
- Run `make test`, then `make build`, and `git diff --check` from the workspace
  root after editing posts. Read the generated article to check the disclosure,
  prose, links, and image. Keep generated output untouched by hand.
- Respect the existing website privacy and publication authorization. Loading
  this skill grants no permission to publish or change sharing.

Before finishing, read the post once for facts and once for voice. Check for
invented details, unsupported outcomes, repeated troubleshooting, rhetorical
contrasts, over-shortening, and an unnecessarily long cost explanation.

For a tone reference, consult the
[reviewed iPhone case study](../../../content/posts/2026-10-11-root-access-is-not-a-working-phone.md).
Use its plain narrative style while keeping each new post's facts independent.

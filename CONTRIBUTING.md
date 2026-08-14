# Contributing

Thank you for helping make the DSH ecosystem easier to navigate.

## Add a repository

oh-my-dsh discovers candidates from GitHub's `dsh-plugin` topic. To be
discovered automatically:

1. Publish the canonical repository publicly.
2. Add the `dsh-plugin` GitHub topic.
3. Declare `dsh.bundle.patch` in the root `package.json`.
4. Add a clear README, license, and installation instructions.

The topic only makes a repository a discovery candidate. The public registry
only includes projects with a detected current Bundle manifest. Topic-only,
legacy, placeholder, archived, and otherwise unverified repositories are not
published. A detected manifest is still not proof of runtime compatibility or
security.

## Correct metadata

Use `registry/overrides.json` for facts that cannot be derived reliably from
GitHub, including:

- canonical/duplicate relationships;
- kind and category corrections;
- exclusion of false positives; and
- concise curator notes.

Keep overrides minimal and explain non-obvious decisions in the `note` field.
Do not use an override to claim runtime compatibility.

## Propose a collection

Collections are small, scenario-based shortlists—not popularity rankings. A
collection must explain its audience, remain useful with five or fewer entries
where practical, and avoid promising that untested combinations work together.

## Before opening a pull request

Run:

```sh
npm install
npm run check
```

If your change affects discovery or generated metadata, also run `npm run
update`. Never commit tokens, downloaded third-party source trees, or copied
plugin code without explicit license review.

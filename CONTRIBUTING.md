# Contributing

Thank you for helping make the DSH ecosystem easier to navigate.

## Add a project

oh-my-dsh discovers public GitHub repositories through the `dsh-plugin` topic. To appear automatically:

1. Publish the repository publicly.
2. Add the `dsh-plugin` GitHub topic.
3. Keep the repository non-empty, active, and unarchived.
4. Document installation, required permissions, configuration, updates, and removal in the repository README.

The directory links to repository documentation and does not generate an installation command. A root `dsh.bundle`, legacy manifest, or related structure is recorded only as discovery evidence; it is not a compatibility or security certification.

## Propose a collection

Collections are small, manually reviewed shortlists rather than popularity rankings. A proposal should explain its audience, stay focused, and avoid promising that untested projects work together. Curated repositories must keep the `dsh-plugin` topic and clear project documentation.

## Before opening a pull request

Run:

```sh
npm install
npm run check
```

If the change affects discovery or generated metadata, also run an appropriate update:

```sh
GITHUB_TOKEN=... REGISTRY_SCAN_MODE=incremental npm run update
```

Use `REGISTRY_SCAN_MODE=full` only when changing discovery semantics or rebuilding the baseline. Never commit tokens, downloaded third-party source trees, or copied plugin code without explicit license review.

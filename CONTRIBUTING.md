# Contributing

Maintenance ended on 2026-10-16. The website and registry remain available as a static snapshot of the last successful scan on 2026-10-14. This repository no longer accepts listing requests, collection proposals, or maintenance contributions. Fork the repository under the MIT License to continue development; the notes below are retained for that purpose.

## Add a project

The retained discovery tooling finds public GitHub repositories through the `dsh-plugin` topic. To make a project discoverable on GitHub or by a maintained fork:

1. Publish the repository publicly.
2. Add the `dsh-plugin` GitHub topic.
3. Keep the repository non-empty, active, and unarchived.
4. Document installation, required permissions, configuration, updates, and removal in the repository README.

These steps do not add a project to the frozen upstream directory. Browse the [GitHub topic](https://github.com/topics/dsh-plugin) for current listings.

The directory links to repository documentation and does not generate an installation command. A root `dsh.bundle`, legacy manifest, or related structure is recorded only as discovery evidence; it is not a compatibility or security certification.

## Maintain collections in a fork

Collections are small, manually reviewed shortlists rather than popularity rankings. A proposal should explain its audience, stay focused, and avoid promising that untested projects work together. Curated repositories must keep the `dsh-plugin` topic and clear project documentation.

## Developing a fork

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

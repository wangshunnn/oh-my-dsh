# Security policy

Maintenance ended on 2026-10-16. This repository no longer provides security fixes or monitors indexed projects. The static directory retains the last successful scan from 2026-10-14; check the current source repository before using any listed project.

oh-my-dsh is a discovery directory, not a package manager or security certification authority.

Projects are listed from GitHub's `dsh-plugin` topic. Evidence such as `bundle-manifest` only reports metadata found in the root `package.json`; it does not mean a project is safe, compatible, maintained, or endorsed. The directory deliberately does not generate one-click installation commands.

Before following a repository's installation instructions, review at least:

- source code and recent ownership changes;
- package lifecycle scripts such as `prepare`, `preinstall`, and `postinstall`;
- requested filesystem, shell, browser, network, and credential access;
- lockfiles, releases, and bundled artifacts;
- the repository's license, security policy, and removal instructions; and
- whether the documentation matches the code and current DeepSeek Harness version.

Before maintenance ended, curated repository transfers were treated as review-required changes and were not followed silently. The retained snapshot no longer checks transfers or other repository changes.

Report vulnerabilities in an indexed project directly to that project's current maintainer through its security policy. Maintainers of forks are responsible for security reports and fixes in their forks. Do not include secrets or exploit payloads in a public issue.

# Security policy

oh-my-dsh is a discovery directory, not a package manager or security certification authority.

Projects are listed from GitHub's `dsh-plugin` topic. Evidence such as `bundle-manifest` only reports metadata found in the root `package.json`; it does not mean a project is safe, compatible, maintained, or endorsed. The directory deliberately does not generate one-click installation commands.

Before following a repository's installation instructions, review at least:

- source code and recent ownership changes;
- package lifecycle scripts such as `prepare`, `preinstall`, and `postinstall`;
- requested filesystem, shell, browser, network, and credential access;
- lockfiles, releases, and bundled artifacts;
- the repository's license, security policy, and removal instructions; and
- whether the documentation matches the code and current DeepSeek Harness version.

Curated repository transfers are treated as review-required changes and are not followed silently.

Please report problems with this directory through a private GitHub security advisory when available. Vulnerabilities in an indexed project should also be reported to that project's maintainer. Do not include secrets or exploit payloads in a public issue.

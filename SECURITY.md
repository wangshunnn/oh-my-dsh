# Security policy

oh-my-dsh is a directory, not a security certification authority.

`manifest-detected` means only that a repository exposes the structural package
metadata expected by the DSH CLI. It does not mean the plugin is safe, free of
malware, privacy preserving, or compatible at runtime.

Before installing a plugin, review at least:

- its source and recent ownership changes;
- package lifecycle scripts such as `prepare`, `preinstall`, and `postinstall`;
- requested filesystem, shell, browser, network, and credential access;
- lockfiles and bundled artifacts; and
- the repository's license and security policy.

Please report problems with this directory through a private GitHub security
advisory when available. Vulnerabilities in an indexed plugin should also be
reported to that plugin's maintainer. Do not include secrets or exploit payloads
in a public issue.

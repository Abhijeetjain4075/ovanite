# Ovanite participant portal — repository transfer note

This directory is a complete snapshot of the portal source at Manus-managed commit `83518706fadd5d64355fbd44ba29cc87645bf25c`. It was added without modifying the root Ovanite site.

## Current boundary

The root repository is an existing Caffeine application: a React/Vite frontend, Motoko canister backend, Internet Identity authentication, and an existing owner/editor/viewer admin experience. This portal snapshot is a separate React/Express/tRPC/Drizzle/MySQL application using its own authentication and role model. Those runtimes, identity systems, APIs, and persistence models are not interchangeable.

Accordingly, this commit preserves the full portal implementation under `apps/participant-portal/`, but **does not mount it into the root site's routes, connect it to the root Motoko backend, or claim it is deployed by the root site**. The root public site and its existing admin screens remain unchanged. Complete product integration requires a deliberate port of the portal API/data model to the site's Caffeine/Motoko and Internet Identity architecture, followed by generated binding updates and tests.

## Source and verification

- Source commit: `83518706fadd5d64355fbd44ba29cc87645bf25c`.
- All 154 tracked files from that source commit were transferred byte-for-byte into this directory.
- The source commit's typecheck, 24 unit tests, production build, database migration, and route-manifest smoke check had passed before transfer.
- Only committed project files were copied. No `.git` directory, `node_modules`, ignored runtime files, or secret environment values were transferred.
- Run and configuration details are in [`README.md`](README.md). The portal's participant intake remains fail-closed until an authorized owner provisions access and publishes approved program terms and a rubric.

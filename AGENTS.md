# Project instructions for coding agents

This is a Blender product studio with a Bun, TypeScript, and Vite preview website.
Read `docs/ARCHITECTURE.md` before changing composition or module boundaries.
The native `blender/models/heat-pump.blend` owns geometry, materials, cameras,
lighting and animation. Edit native Blender data or Python scripts; do not
reintroduce procedural Three.js product authoring. The website only displays
published PNG, MP4 and GLB outputs. Preserve absolute-time animation sampling,
named model parts, and explicit ownership of Blender datablocks and web previews.
Model-viewer is the browser display component; it uses Three.js internally.

## Shadow ownership

All current and future models, components, compositions, and inspection animations must be shadow-free. Do not enable cast/receive shadows or add contact-shadow planes, baked shadows, or ambient-occlusion effects to models or inspection. Shadows belong exclusively to showcases and must be disabled when returning to inspection. Keep ordinary material lighting and reflections.

## Required quality workflow

- Before editing, inspect the affected files and their callers. Use
  `bunx --no-install fallow inspect --file src/path.ts` for dependency and symbol
  context. Use `bunx --no-install fallow trace --path src/main.ts src/path.ts` to inspect
  how the browser entry reaches a module. Consult `fallow <command> --help` for the installed syntax.
- Run `bun run lint:fix` after edits; review its changes. This applies formatting,
  import organization, and safe lint fixes. Correct remaining diagnostics yourself.
- Run `bun run validate` before declaring any task complete. It runs tests, Biome,
  Fallow dead-code/complexity/duplication checks, TypeScript, and a production build.
  Changes made after validation require rerunning the affected checks; the final
  source tree must have passed the complete validation command.
- Native scene changes also require `bun run blender:validate`, regenerated
  outputs and visual review. Rendering/publishing must never overwrite the native
  master. CI tests the tracked public assets without requiring Blender.
- Every Biome warning or error is blocking. Every Fallow finding reported by the
  enforced analyses is blocking, including warning-level dead-code findings.
  Do not ignore an unsuccessful command because some other check passed.
- Every TypeScript compiler error is blocking. Run `bun run typecheck` (`tsc
  --noEmit`) for type diagnostics across `src`, `tests`, and `scripts`; Biome and
  Fallow do not replace it. Keep strict checking, unchecked-index checking, and
  unused-local/parameter checking enabled. Do not introduce `any`, unchecked type
  assertions, `@ts-ignore`, `@ts-nocheck`, or `@ts-expect-error` merely to hide an
  error. Fix the types or validate the runtime value instead.
- Read informational Fallow metrics and refactoring suggestions as context. They
  are not proof of a defect; inspect the code before acting. Never delete code
  solely from a tool suggestion. Trace references and check documented extension
  points first. `bun run analyze:json` provides machine-readable evidence.
- Fix causes. Do not disable rules, downgrade severities, increase thresholds, add
  baselines, expand ignores or entry points, use suppression comments, skip checks,
  or use unsafe autofixes solely to obtain a passing result. A necessary exception
  requires a concrete explanation and explicit user authorization.
- If a check cannot run, report the command, blocker, and remaining verification.
  Never claim validation passed when it did not. Report test and build results in
  the final response.

## Tooling conventions

Use the locally installed, pinned Biome and Fallow versions and commit dependency
changes with `bun.lock`. Do not add ESLint or Prettier alongside Biome. `bun run
format` formats only; `bun run lint` is the non-mutating formatting, lint, and
import-order gate. `bun run check` runs the static gates. `bun run build` also runs
those gates, and CI runs the complete validation command.

Fallow's explicit entries are the browser bootstrap, Bun tests, and duplication
gate script; package commands expose the Blender runner. The retired GLTF loader
is no longer an extension API. Do not mark other unused code as an entry point.
Tests are included in dead-code and health analysis. Duplication
uses Fallow's standard exclusions for test fixtures and import wiring.

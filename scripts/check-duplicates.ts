// Fallow 3.27's --fail-on-issues does not fail dupes at its default 0% (unlimited)
// threshold. Enforce zero clone groups from its structured report instead.
const result = Bun.spawnSync(['fallow', 'dupes', '--format', 'json'], {
  stdout: 'pipe',
  stderr: 'inherit',
});
if (result.exitCode !== 0) process.exit(result.exitCode);
const report = JSON.parse(result.stdout.toString());
if (report.kind !== 'dupes' || !Number.isInteger(report.stats?.clone_groups)) {
  throw new Error(
    'Unexpected Fallow duplication report; review the installed tool schema.',
  );
}
if (report.stats.clone_groups > 0) {
  console.error(JSON.stringify(report, null, 2));
  console.error(
    'Duplicate code is blocking. Inspect with bunx --no-install fallow dupes.',
  );
  process.exit(1);
}
console.log('No code duplication found.');

import { resolve } from 'node:path';

const scripts: Record<string, string> = {
  render: 'render.py',
  animate: 'render.py',
  encode: 'encode.py',
  publish: 'export.py',
  validate: 'validate.py',
};
const command = process.argv[2] ?? '';
const script = scripts[command];
if (!script)
  throw new Error('Choose render, animate, encode, publish, or validate.');
const blender =
  process.env.BLENDER_BIN ??
  Bun.which('blender') ??
  (process.platform === 'darwin'
    ? '/Applications/Blender.app/Contents/MacOS/Blender'
    : undefined);
if (!blender || !(await Bun.file(blender).exists())) {
  throw new Error(
    'Install Blender 5.3+ and set BLENDER_BIN to its executable.',
  );
}
const args = [
  blender,
  '--background',
  '--python-exit-code',
  '1',
  '--python',
  resolve('scripts/blender', script),
];
if (command === 'animate') args.push('--', '--animation', '--preview');
const result = Bun.spawn(args, { stdout: 'inherit', stderr: 'inherit' });
process.exit(await result.exited);

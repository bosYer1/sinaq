const { readFileSync } = jest.requireActual('node:fs');
const { transformSync } = jest.requireActual('@babel/core');
const { expoInlineEnvVars } = jest.requireActual('babel-preset-expo/build/plugins/inline-env-vars');

test('Expo discovers both public env references in the actual config module', () => {
  const source = readFileSync('src/lib/config.ts', 'utf8');
  const result = transformSync(source, {
    filename: 'config.ts',
    babelrc: false,
    configFile: false,
    parserOpts: { plugins: ['typescript'] },
    plugins: [expoInlineEnvVars],
    caller: { name: 'metro', isDev: true },
  });
  expect(result.metadata.publicEnvVars.sort()).toEqual([
    'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    'EXPO_PUBLIC_SUPABASE_URL',
  ]);
  expect(result.code).toContain('expo/virtual/env');
});

describe('native Android release configuration', () => {
  const baseConfig = jest.requireActual('../../app.json').expo;
  const easConfig = jest.requireActual('../../eas.json');
  const originalKey = process.env.GOOGLE_MAPS_API_KEY_ANDROID;
  const originalProfile = process.env.EAS_BUILD_PROFILE;
  const originalPlatform = process.env.EAS_BUILD_PLATFORM;

  afterEach(() => {
    if (originalKey === undefined) delete process.env.GOOGLE_MAPS_API_KEY_ANDROID;
    else process.env.GOOGLE_MAPS_API_KEY_ANDROID = originalKey;
    if (originalProfile === undefined) delete process.env.EAS_BUILD_PROFILE;
    else process.env.EAS_BUILD_PROFILE = originalProfile;
    if (originalPlatform === undefined) delete process.env.EAS_BUILD_PLATFORM;
    else process.env.EAS_BUILD_PLATFORM = originalPlatform;
    jest.resetModules();
  });

  test('does not invent or embed a Google Maps key for local JS exports', () => {
    delete process.env.GOOGLE_MAPS_API_KEY_ANDROID;
    delete process.env.EAS_BUILD_PROFILE;
    delete process.env.EAS_BUILD_PLATFORM;
    const createConfig = jest.requireActual('../../app.config.js');
    const config = createConfig({ config: baseConfig });
    expect(config.plugins.some((plugin: unknown) => Array.isArray(plugin) && plugin[0] === 'react-native-maps')).toBe(false);
    expect(config.extra.nativeMapEnabled).toBe(false);
  });

  test('passes an explicitly supplied build key to the native maps plugin', () => {
    process.env.GOOGLE_MAPS_API_KEY_ANDROID = 'restricted-test-key';
    const createConfig = jest.requireActual('../../app.config.js');
    const config = createConfig({ config: baseConfig });
    expect(config.plugins).toContainEqual([
      'react-native-maps',
      { androidGoogleMapsApiKey: 'restricted-test-key' },
    ]);
    expect(config.extra.nativeMapEnabled).toBe(true);
  });

  test('fails closed when a production build has no map configuration', () => {
    delete process.env.GOOGLE_MAPS_API_KEY_ANDROID;
    process.env.EAS_BUILD_PROFILE = 'production';
    process.env.EAS_BUILD_PLATFORM = 'android';
    const createConfig = jest.requireActual('../../app.config.js');
    expect(() => createConfig({ config: baseConfig })).toThrow('Production Android map configuration is incomplete.');
  });

  test('keeps keyless preview APK separate from the production AAB gate', () => {
    expect(easConfig.build.preview).toMatchObject({
      distribution: 'internal',
      android: { buildType: 'apk' },
    });
    expect(easConfig.build.preview.env.GOOGLE_MAPS_API_KEY_ANDROID).toBeUndefined();
    expect(easConfig.build.preview.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY).toMatch(/^sb_publishable_/);
    expect(easConfig.build.production.android.buildType).toBe('app-bundle');
  });

  test('blocks background location and unused legacy storage permissions', () => {
    expect(baseConfig.android.blockedPermissions).toEqual(expect.arrayContaining([
      'android.permission.ACCESS_BACKGROUND_LOCATION',
      'android.permission.FOREGROUND_SERVICE_LOCATION',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
    ]));
  });
});

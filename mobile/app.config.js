module.exports = ({ config }) => {
  const androidGoogleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY_ANDROID?.trim();
  const buildProfile = process.env.EAS_BUILD_PROFILE?.trim();
  const buildPlatform = process.env.EAS_BUILD_PLATFORM?.trim();

  if (buildProfile === 'production' && buildPlatform === 'android' && !androidGoogleMapsApiKey) {
    throw new Error('Production Android map configuration is incomplete.');
  }

  const plugins = [...(config.plugins ?? [])];
  if (androidGoogleMapsApiKey) {
    plugins.push([
      'react-native-maps',
      { androidGoogleMapsApiKey },
    ]);
  }

  return {
    ...config,
    plugins,
  };
};

export function isCloudflareStandby(
  value: string | undefined = process.env.CLOUDFLARE_STANDBY,
): boolean {
  return value?.trim() === '1';
}

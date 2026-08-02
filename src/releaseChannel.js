const configuredReleaseChannel = String(
  import.meta.env.VITE_RELEASE_CHANNEL || "development"
).toLowerCase();

const supportedReleaseChannels = new Set([
  "production",
  "beta",
  "development",
]);

export const releaseChannel = supportedReleaseChannels.has(
  configuredReleaseChannel
)
  ? configuredReleaseChannel
  : "development";

export const releaseChannelLabel =
  releaseChannel === "development" ? "DEV" : releaseChannel.toUpperCase();

/**
 * Baked-in manifest for the `default` agentic-pi-dev image.
 *
 * The image is built and released by `.github/workflows/image.yml`,
 * which tags releases on `image-v*` (independent from the npm `v*`
 * stream). After cutting an `image-v<x.y.z>` release, copy the
 * per-arch URLs and sha256s from the release's `manifest.json` into
 * the placeholders below and ship a new npm version.
 *
 * The sha256 is the authoritative signature — the loader verifies it
 * before extracting. Reproducibility across rebuilds is best-effort
 * (depends on Alpine mirror state), not guaranteed.
 */

export interface ImageArchive {
  url: string;
  sha256: string;
  /** Size hint used for download progress / sanity check. Optional. */
  uncompressedBytes: number;
}

export interface ImageManifest {
  name: string;
  version: string;
  archives: {
    aarch64: ImageArchive;
    x86_64: ImageArchive;
  };
}

// Placeholder values — replaced after the first image-v0.1.0 release
// ships. The loader treats an empty sha256 as "default image not yet
// published" and falls back to `gondolin-builtin` with a warning, so
// shipping the npm package before the image release is safe.
export const DEFAULT_IMAGE_MANIFEST: ImageManifest = {
  name: "agentic-pi-dev",
  version: "0.0.0",
  archives: {
    aarch64: {
      url: "",
      sha256: "",
      uncompressedBytes: 0,
    },
    x86_64: {
      url: "",
      sha256: "",
      uncompressedBytes: 0,
    },
  },
};

export function isManifestPublished(m: ImageManifest = DEFAULT_IMAGE_MANIFEST): boolean {
  return m.archives.aarch64.sha256.length === 64 && m.archives.x86_64.sha256.length === 64;
}

import { useLayoutEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { updateMetaTags } from "../lib/meta-tags";
import type { MetaTagsConfig } from "../lib/meta-tags";

interface MetaTagsProps {
  title?: string;
  description?: string;
  image?: string;
  type?: string;
}

/**
 * Updates document.title and meta tags after the DOM is updated.
 *
 * We use useLayoutEffect instead of pure render phase mutation to prevent
 * inconsistent behavior with concurrent rendering and Suspense.
 */
export function MetaTags({ title, description, image, type }: MetaTagsProps) {
  const router = useRouterState();
  const pathname = router.location.pathname;

  useLayoutEffect(() => {
    const routeMeta = routeMetaTags[pathname];
    const config: MetaTagsConfig = {
      title: title || routeMeta?.title,
      description: description || routeMeta?.description,
      image: image || routeMeta?.image,
      type: type || routeMeta?.type,
      url: window.location.href,
    };

    updateMetaTags(config);
  }, [title, description, image, type, pathname]);

  return null;
}

export const routeMetaTags: Record<string, MetaTagsConfig> = {
  "/": {
    title: "Dock-Dploy — Build Docker Compose Without the Hassle",
    description:
      "Calm, visual surface for Docker Compose, configs, and schedulers. Open source, AGPL-3.0.",
    image: "/og-image.png",
  },
  "/docker/compose-builder": {
    title: "Compose Builder — Dock-Dploy",
    description:
      "Build and manage Docker Compose files with a tabbed editor. Validate, reformat, and export.",
    image: "/og-image.png",
  },
  "/config-builder": {
    title: "Config Builder — Dock-Dploy",
    description: "Generate configs for self-hosted tools like Homepage.dev.",
    image: "/og-image.png",
  },
  "/scheduler-builder": {
    title: "Scheduler Builder — Dock-Dploy",
    description: "Generate cron, GitHub Actions, and systemd timer schedules.",
    image: "/og-image.png",
  },
};

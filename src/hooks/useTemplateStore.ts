import { useState, useEffect, useCallback } from "react";

export interface UseTemplateStoreReturn {
  templateStoreOpen: boolean;
  setTemplateStoreOpen: (open: boolean) => void;
  templates: any[];
  setTemplates: React.Dispatch<React.SetStateAction<any[]>>;
  templateLoading: boolean;
  setTemplateLoading: (loading: boolean) => void;
  templateError: string | null;
  setTemplateError: (error: string | null) => void;
  templateSearch: string;
  setTemplateSearch: (search: string) => void;
  selectedTemplate: any;
  setSelectedTemplate: (template: any) => void;
  templateDetailOpen: boolean;
  setTemplateDetailOpen: (open: boolean) => void;
  templateDetailTab: "overview" | "compose";
  setTemplateDetailTab: (tab: "overview" | "compose") => void;
  templateCache: any[];
  templateCacheTimestamp: number | null;
  fetchTemplatesFromGitHub: (backgroundUpdate?: boolean) => Promise<void>;
  fetchTemplateDetails: (templateId: string) => Promise<any>;
  refreshTemplateStore: () => void;
}

const GITHUB_OWNER = "hhftechnology";
const GITHUB_REPO = "Marketplace";
const GITHUB_BRANCH = "main";
const GITHUB_RAW_BASE = "https://raw.githubusercontent.com";

export function useTemplateStore(): UseTemplateStoreReturn {
  const [templateStoreOpen, setTemplateStoreOpen] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [templateSearch, setTemplateSearch] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [templateDetailOpen, setTemplateDetailOpen] = useState(false);
  const [templateDetailTab, setTemplateDetailTab] = useState<
    "overview" | "compose"
  >("overview");
  const [templateCache, setTemplateCache] = useState<any[]>(() => {
    const cached = localStorage.getItem("templateStoreCache");
    return cached ? JSON.parse(cached) : [];
  });
  const [templateCacheTimestamp, setTemplateCacheTimestamp] = useState<
    number | null
  >(() => {
    const cached = localStorage.getItem("templateStoreCacheTimestamp");
    return cached ? parseInt(cached) : null;
  });

  const fetchTemplatesFromGitHub = useCallback(
    async (backgroundUpdate: boolean = false) => {
      if (!backgroundUpdate) {
        setTemplateLoading(true);
        setTemplateError(null);
      }

      try {
        // Fetch meta.json
        const metaUrl = `${GITHUB_RAW_BASE}/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/meta.json`;
        const metaResponse = await fetch(metaUrl);

        if (!metaResponse.ok) {
          throw new Error(
            `Failed to fetch templates: ${metaResponse.statusText}`
          );
        }

        const templatesMeta: any[] = await metaResponse.json();

        // Store templates with metadata
        setTemplates(templatesMeta);
        setTemplateCache(templatesMeta);
        setTemplateCacheTimestamp(Date.now());
        localStorage.setItem("templateStoreCache", JSON.stringify(templatesMeta));
        localStorage.setItem(
          "templateStoreCacheTimestamp",
          String(Date.now())
        );

        if (!backgroundUpdate) {
          setTemplateLoading(false);
        }
      } catch (error: any) {
        console.error("Error fetching templates:", error);
        if (!backgroundUpdate) {
          setTemplateLoading(false);
          setTemplateError(error.message || "Failed to load templates");
        }
      }
    },
    []
  );

  const fetchTemplateDetails = useCallback(
    async (templateId: string): Promise<any> => {
      const template = templates.find((t) => t.id === templateId);
      if (!template) {
        throw new Error(`Template ${templateId} not found`);
      }

      try {
        const basePath = `compose-files/${templateId}`;

        // Fetch docker-compose.yml
        const composeUrl = `${GITHUB_RAW_BASE}/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${basePath}/docker-compose.yml`;
        const composeResponse = await fetch(composeUrl);
        if (!composeResponse.ok) {
          throw new Error(
            `Failed to fetch docker-compose.yml: ${composeResponse.statusText}`
          );
        }
        const composeContent = await composeResponse.text();

        // Build logo URL if logo exists
        let logoUrl = null;
        if (template.logo) {
          logoUrl = `${GITHUB_RAW_BASE}/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${basePath}/${template.logo}`;
        }

        return {
          ...template,
          composeContent,
          logoUrl,
        };
      } catch (error: any) {
        console.error(
          `Error fetching template details for ${templateId}:`,
          error
        );
        throw error;
      }
    },
    [templates]
  );

  const refreshTemplateStore = useCallback(() => {
    setTemplateCache([]);
    setTemplateCacheTimestamp(null);
    localStorage.removeItem("templateStoreCache");
    localStorage.removeItem("templateStoreCacheTimestamp");
    fetchTemplatesFromGitHub(false);
  }, [fetchTemplatesFromGitHub]);

  // Initialize templates when store opens
  useEffect(() => {
    if (!templateStoreOpen) return;

    const CACHE_DURATION = 60 * 60 * 1000; // 1 hour
    const now = Date.now();

    // Check if we have valid cached data
    if (
      templateCache.length > 0 &&
      templateCacheTimestamp &&
      now - templateCacheTimestamp < CACHE_DURATION
    ) {
      setTemplates(templateCache);
      setTemplateLoading(false);
      setTemplateError(null);

      // Still check for updates in the background
      fetchTemplatesFromGitHub(true);
      return;
    }

    fetchTemplatesFromGitHub(false);
  }, [
    templateStoreOpen,
    templateCache,
    templateCacheTimestamp,
    fetchTemplatesFromGitHub,
  ]);

  return {
    templateStoreOpen,
    setTemplateStoreOpen,
    templates,
    setTemplates,
    templateLoading,
    setTemplateLoading,
    templateError,
    setTemplateError,
    templateSearch,
    setTemplateSearch,
    selectedTemplate,
    setSelectedTemplate,
    templateDetailOpen,
    setTemplateDetailOpen,
    templateDetailTab,
    setTemplateDetailTab,
    templateCache,
    templateCacheTimestamp,
    fetchTemplatesFromGitHub,
    fetchTemplateDetails,
    refreshTemplateStore,
  };
}


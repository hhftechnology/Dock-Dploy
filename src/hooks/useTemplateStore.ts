import { useCallback, useState } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Template = any;

export interface UseTemplateStoreReturn {
  templateStoreOpen: boolean;
  setTemplateStoreOpen: (open: boolean) => void;
  templates: Template[];
  setTemplates: React.Dispatch<React.SetStateAction<Template[]>>;
  templateLoading: boolean;
  setTemplateLoading: (loading: boolean) => void;
  templateError: string | null;
  setTemplateError: (error: string | null) => void;
  templateSearch: string;
  setTemplateSearch: (search: string) => void;
  selectedTemplate: Template;
  setSelectedTemplate: (template: Template) => void;
  templateDetailOpen: boolean;
  setTemplateDetailOpen: (open: boolean) => void;
  templateDetailTab: "overview" | "compose";
  setTemplateDetailTab: (tab: "overview" | "compose") => void;
  templateCache: Template[];
  templateCacheTimestamp: number | null;
  fetchTemplatesFromGitHub: (backgroundUpdate?: boolean) => Promise<void>;
  fetchTemplateDetails: (templateId: string) => Promise<Template>;
  refreshTemplateStore: () => void;
}

const GITHUB_OWNER = "hhftechnology";
const GITHUB_REPO = "Marketplace";
const GITHUB_BRANCH = "main";
const GITHUB_RAW_BASE = "https://raw.githubusercontent.com";
const CACHE_DURATION_MS = 60 * 60 * 1000;
const CACHE_KEY = "templateStoreCache";
const CACHE_TS_KEY = "templateStoreCacheTimestamp";

function readCache(): { templates: Template[]; ts: number | null } {
  if (typeof window === "undefined") return { templates: [], ts: null };
  try {
    const t = localStorage.getItem(CACHE_KEY);
    const ts = localStorage.getItem(CACHE_TS_KEY);
    return {
      templates: t ? JSON.parse(t) : [],
      ts: ts ? parseInt(ts, 10) : null,
    };
  } catch {
    return { templates: [], ts: null };
  }
}

export function useTemplateStore(): UseTemplateStoreReturn {
  const [templateStoreOpen, setTemplateStoreOpenState] = useState(false);
  const initial = readCache();
  const [templates, setTemplates] = useState<Template[]>(initial.templates);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [templateSearch, setTemplateSearch] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<Template>(null);
  const [templateDetailOpen, setTemplateDetailOpen] = useState(false);
  const [templateDetailTab, setTemplateDetailTab] = useState<
    "overview" | "compose"
  >("overview");
  const [templateCache, setTemplateCache] = useState<Template[]>(initial.templates);
  const [templateCacheTimestamp, setTemplateCacheTimestamp] = useState<
    number | null
  >(initial.ts);

  const fetchTemplatesFromGitHub = useCallback(
    async (backgroundUpdate: boolean = false) => {
      if (!backgroundUpdate) {
        setTemplateLoading(true);
        setTemplateError(null);
      }
      try {
        const metaUrl = `${GITHUB_RAW_BASE}/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/meta.json`;
        const metaResponse = await fetch(metaUrl);
        if (!metaResponse.ok) {
          throw new Error(`Failed to fetch templates: ${metaResponse.statusText}`);
        }
        const templatesMeta: Template[] = await metaResponse.json();
        setTemplates(templatesMeta);
        setTemplateCache(templatesMeta);
        const now = Date.now();
        setTemplateCacheTimestamp(now);
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(templatesMeta));
          localStorage.setItem(CACHE_TS_KEY, String(now));
        } catch {
          // localStorage may be disabled; non-fatal.
        }
        if (!backgroundUpdate) setTemplateLoading(false);
      } catch (error: unknown) {
        const msg =
          error instanceof Error ? error.message : "Failed to load templates";
        // eslint-disable-next-line no-console
        console.error("Error fetching templates:", error);
        if (!backgroundUpdate) {
          setTemplateLoading(false);
          setTemplateError(msg);
        }
      }
    },
    [],
  );

  // Open-the-store side effect handled in the setter — event-driven, not useEffect.
  const setTemplateStoreOpen = useCallback(
    (open: boolean) => {
      setTemplateStoreOpenState(open);
      if (!open) return;
      const now = Date.now();
      const fresh =
        templateCache.length > 0 &&
        templateCacheTimestamp !== null &&
        now - templateCacheTimestamp < CACHE_DURATION_MS;
      if (fresh) {
        setTemplates(templateCache);
        setTemplateLoading(false);
        setTemplateError(null);
        // Background refresh — fire and forget.
        void fetchTemplatesFromGitHub(true);
        return;
      }
      void fetchTemplatesFromGitHub(false);
    },
    [templateCache, templateCacheTimestamp, fetchTemplatesFromGitHub],
  );

  const fetchTemplateDetails = useCallback(
    async (templateId: string): Promise<Template> => {
      const template = templates.find((t) => t.id === templateId);
      if (!template) throw new Error(`Template ${templateId} not found`);

      try {
        const basePath = `compose-files/${templateId}`;
        const composeUrl = `${GITHUB_RAW_BASE}/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${basePath}/docker-compose.yml`;
        const composeResponse = await fetch(composeUrl);
        if (!composeResponse.ok) {
          throw new Error(
            `Failed to fetch docker-compose.yml: ${composeResponse.statusText}`,
          );
        }
        const composeContent = await composeResponse.text();
        const logoUrl = template.logo
          ? `${GITHUB_RAW_BASE}/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${basePath}/${template.logo}`
          : null;
        return { ...template, composeContent, logoUrl };
      } catch (error: unknown) {
        // eslint-disable-next-line no-console
        console.error(
          `Error fetching template details for ${templateId}:`,
          error,
        );
        throw error;
      }
    },
    [templates],
  );

  const refreshTemplateStore = useCallback(() => {
    setTemplateCache([]);
    setTemplateCacheTimestamp(null);
    try {
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(CACHE_TS_KEY);
    } catch {
      // ignore
    }
    void fetchTemplatesFromGitHub(false);
  }, [fetchTemplatesFromGitHub]);

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

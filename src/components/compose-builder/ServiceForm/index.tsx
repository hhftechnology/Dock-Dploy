import { useState } from "react";
import { ServiceFormApiProvider, type ServiceFormApi } from "../service-form-api";
import { BasicsTab } from "./BasicsTab";
import { NetworkTab } from "./NetworkTab";
import { EnvironmentTab } from "./EnvironmentTab";
import { HealthTab } from "./HealthTab";

const TABS = ["Basics", "Network", "Environment", "Health"] as const;
type TabId = (typeof TABS)[number];

interface ServiceFormProps {
  api: ServiceFormApi;
}

export function ServiceForm({ api }: ServiceFormProps) {
  const [tab, setTab] = useState<TabId>("Basics");
  const service = api.service;
  const displayName = service.name?.trim()
    ? service.name
    : "untitled";
  const isUnnamed = !service.name?.trim();

  return (
    <ServiceFormApiProvider api={api}>
      <section className="service-col">
        <div className="col-head">
          <h2 className="col-head-title">
            <span className="col-bar" aria-hidden />
            Service Configuration
          </h2>
          <span className="col-head-meta">
            <span
              className={
                "status-dot " + (isUnnamed ? "warn" : "ok")
              }
              aria-hidden
            />
            <span className="col-head-meta-text">{displayName}</span>
          </span>
        </div>

        <div className="config-tabs svc-tabs">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              className={"config-tab" + (tab === t ? " active" : "")}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="config-tab-body">
          {tab === "Basics" && <BasicsTab />}
          {tab === "Network" && <NetworkTab />}
          {tab === "Environment" && <EnvironmentTab />}
          {tab === "Health" && <HealthTab />}
        </div>
      </section>
    </ServiceFormApiProvider>
  );
}

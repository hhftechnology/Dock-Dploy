import { ChevronDown, Container, FileText, Clock } from "lucide-react";

import { useNavigate, useRouter } from "@tanstack/react-router";

import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "./ui/sidebar";

import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "./ui/collapsible";

import { Separator } from "./ui/separator";

const items = [
  {
    title: "Compose Builder",
    url: "/docker/compose-builder",
    icon: Container,
    group: "Docker",
  },
  {
    title: "Config Builder",
    url: "/config-builder",
    icon: FileText,
    group: "Builders",
  },
  {
    title: "Scheduler Builder",
    url: "/scheduler-builder",
    icon: Clock,
    group: "Builders",
  },
];

const groupedItems = items.reduce<Record<string, typeof items>>((acc, item) => {
  if (!acc[item.group]) acc[item.group] = [];
  acc[item.group].push(item);
  return acc;
}, {});

export function SidebarUI({}: {}) {
  const navigate = useNavigate();
  const router = useRouter();
  const location = router.state.location;

  return (
    <>
      <SidebarHeader>
        <div className="flex flex-col items-center w-full">
          <div className="flex items-center justify-center w-full py-2 -mt-1">
            <span className="font-bold text-lg tracking-tight">Dock-Dploy</span>
          </div>
          <Separator className="w-full mb-0.5" />
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-y-0 pt-0">
        {Object.entries(groupedItems).map(([groupName, groupItems], idx) => (
          <Collapsible
            key={groupName}
            defaultOpen
            className={`group/collapsible mb-0${idx === 0 ? " -mt-2" : ""}`}
          >
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="flex items-center cursor-pointer">
                  {groupName}
                  <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {groupItems.map((item) => {
                      const isActive = location.pathname === item.url;

                      return (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton
                            className={isActive ? "bg-muted" : ""}
                            onClick={() => {
                              if (!isActive) {
                                navigate({ to: item.url });
                              }
                            }}
                          >
                            <item.icon />
                            <span>{item.title}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
      </SidebarContent>
    </>
  );
}

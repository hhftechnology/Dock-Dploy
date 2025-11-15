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
  SidebarFooter,
} from "./ui/sidebar";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "./ui/collapsible";

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

export function SidebarUI() {
  const navigate = useNavigate();
  const router = useRouter();
  const location = router.state.location;

  return (
    <>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Container className="h-4 w-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">Dock-Dploy</span>
            <span className="truncate text-xs text-sidebar-foreground/70">
              Setup Tools
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {Object.entries(groupedItems).map(([groupName, groupItems]) => {
          const isGroupOpen = groupItems.some(
            (item) => location.pathname === item.url
          );

          return (
            <Collapsible
              key={groupName}
              defaultOpen={isGroupOpen}
              className="group/collapsible"
            >
              <SidebarGroup>
                <SidebarGroupLabel asChild>
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between w-full">
                      <span>{groupName}</span>
                      <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                    </div>
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
                              tooltip={item.title}
                              isActive={isActive}
                              onClick={() => {
                                if (!isActive) {
                                  navigate({ to: item.url });
                                }
                              }}
                            >
                              <item.icon className="h-4 w-4" />
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
          );
        })}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <div className="px-2 py-1.5 text-xs text-sidebar-foreground/70">
          © {new Date().getFullYear()} Dock-Dploy
        </div>
      </SidebarFooter>
    </>
  );
}

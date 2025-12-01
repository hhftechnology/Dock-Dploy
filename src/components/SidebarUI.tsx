
import { useState, useEffect } from "react";
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
  useSidebar,
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
  const { toggleSidebar, state } = useSidebar();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  // Initialize open groups based on current route
  useEffect(() => {
    const newOpenGroups = { ...openGroups };
    let hasChanges = false;
    Object.entries(groupedItems).forEach(([groupName, groupItems]) => {
      if (groupItems.some((item) => location.pathname === item.url)) {
        if (!newOpenGroups[groupName]) {
          newOpenGroups[groupName] = true;
          hasChanges = true;
        }
      }
    });
    if (hasChanges) {
      setOpenGroups(newOpenGroups);
    }
  }, [location.pathname]);

  return (
    <>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div 
            onClick={toggleSidebar}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground cursor-pointer hover:bg-sidebar-primary/90 transition-colors"
          >
            <Container className="h-4 w-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight group-data-[state=collapsed]:hidden">
            <div className="flex items-baseline gap-1 truncate">
              <span className="font-semibold">Setup Tools</span>
              <span className="text-xs text-sidebar-foreground/70 truncate">v0.1.0</span>
            </div>
            <span className="truncate text-xs text-sidebar-foreground/70">
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {Object.entries(groupedItems).map(([groupName, groupItems]) => {
          const isOpen = state === "collapsed" ? true : (openGroups[groupName] || false);

          return (
            <Collapsible
              key={groupName}
              open={isOpen}
              onOpenChange={(open) => setOpenGroups((prev) => ({ ...prev, [groupName]: open }))}
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

      <SidebarFooter className="p-4 border-t border-border/50">
        <div className="flex flex-col gap-1 text-xs text-muted-foreground group-data-[state=collapsed]:hidden">
          <p>© 2025 Dock-Dploy</p>
        </div>
      </SidebarFooter>
    </>
  );
}

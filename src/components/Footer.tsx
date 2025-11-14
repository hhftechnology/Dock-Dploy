import { useNavigate } from "@tanstack/react-router";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";

export function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="border-t bg-background">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>
            © {new Date().getFullYear()} Dock-Dploy. All rights reserved.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="link"
            className="p-0 h-auto text-muted-foreground"
            onClick={() => navigate({ to: "/privacy" })}
          >
            Privacy
          </Button>
          <Separator orientation="vertical" className="h-4" />
          <Button
            variant="link"
            className="p-0 h-auto text-muted-foreground"
            onClick={() => navigate({ to: "/terms-of-service" })}
          >
            Terms of Service
          </Button>
        </div>
      </div>
    </footer>
  );
}

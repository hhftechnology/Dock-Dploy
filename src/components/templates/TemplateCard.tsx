import { Settings } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";

export interface TemplateCardProps {
  id: string;
  name: string;
  description?: string;
  version?: string;
  logo?: string;
  tags?: string[];
  onClick: () => void;
}

export function TemplateCard({
  name,
  description,
  version,
  logo,
  tags,
  onClick,
}: TemplateCardProps) {
  return (
    <Card
      className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/50 flex flex-col w-full h-full bg-card/50 hover:bg-card border-border/50"
      onClick={onClick}
    >
      <CardContent className="p-5 flex flex-col gap-4 flex-1 min-h-0">
        {/* Header with logo and name */}
        <div className="flex items-start gap-4">
          {logo ? (
            <img
              src={logo}
              alt={name}
              className="w-12 h-12 object-contain flex-shrink-0 rounded-lg bg-background/50 p-1"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="w-12 h-12 bg-muted/50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Settings className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-lg leading-tight break-words tracking-tight">
                {name}
              </h3>
            </div>
            {version && (
              <p className="text-xs text-muted-foreground font-mono">
                {version}
              </p>
            )}
          </div>
        </div>

        {/* Description */}
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-3 flex-1 leading-relaxed">
            {description}
          </p>
        )}

        {/* Tags */}
        <div className="mt-auto space-y-4">
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold bg-red-500/10 text-red-400 rounded border border-red-500/20"
                >
                  {tag}
                </span>
              ))}
              {tags.length > 3 && (
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-muted text-muted-foreground rounded border border-border">
                  +{tags.length - 3}
                </span>
              )}
            </div>
          )}

          <Button 
            variant="secondary" 
            className="w-full bg-secondary/50 hover:bg-secondary group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
            size="sm"
          >
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

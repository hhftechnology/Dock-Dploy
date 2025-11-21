import { Settings } from "lucide-react";
import { Card, CardContent } from "../ui/card";

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
  id,
  name,
  description,
  version,
  logo,
  tags,
  onClick,
}: TemplateCardProps) {
  return (
    <Card
      className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary"
      onClick={onClick}
    >
      <CardContent className="p-4 flex flex-col gap-3 h-full">
        {/* Header with logo and name */}
        <div className="flex items-start gap-3">
          {logo ? (
            <img
              src={logo}
              alt={name}
              className="w-12 h-12 object-contain flex-shrink-0 rounded"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="w-12 h-12 bg-muted rounded flex items-center justify-center flex-shrink-0">
              <Settings className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base leading-tight break-words">
              {name}
            </h3>
            {version && (
              <p className="text-xs text-muted-foreground mt-0.5">
                v{version}
              </p>
            )}
          </div>
        </div>

        {/* Description */}
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
            {description}
          </p>
        )}

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-md border border-primary/20"
              >
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded-md">
                +{tags.length - 3}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Container,
  FileText,
  Clock,
  Github,
  MessageCircle,
  ArrowRight,
  CheckCircle2,
  Zap,
  Shield,
  Code,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      title: "Docker Compose Builder",
      description:
        "Build and manage Docker Compose files with an intuitive interface. Validate, reformat, and convert to various formats.",
      icon: Container,
      url: "/docker/compose-builder",
      highlights: [
        "Visual compose file builder",
        "Validate & reformat YAML",
        "Convert to docker run commands",
        "Export to systemd services",
        "Resource allocation support",
        "Dual syntax support (array/dict)",
      ],
    },
    {
      title: "Config Builder",
      description:
        "Create configuration files for popular self-hosted tools like Homepage.dev and more.",
      icon: FileText,
      url: "/config-builder",
      highlights: [
        "Homepage.dev config generator",
        "YAML configuration builder",
        "Easy-to-use interface",
        "Export and download",
      ],
    },
    {
      title: "Scheduler Builder",
      description:
        "Generate schedulers for Cron, GitHub Actions, Systemd timers, and more with a simple form.",
      icon: Clock,
      url: "/scheduler-builder",
      highlights: [
        "Cron expression generator",
        "GitHub Actions workflows",
        "Systemd timer units",
        "Flexible scheduling options",
      ],
    },
  ];

  const benefits = [
    {
      icon: Zap,
      title: "Fast & Efficient",
      description: "Build complex configurations in minutes, not hours",
    },
    {
      icon: Shield,
      title: "Validated Output",
      description: "All generated files are validated for correctness",
    },
    {
      icon: Code,
      title: "Developer Friendly",
      description: "Clean, readable code output with proper formatting",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-background to-muted/20 py-20 md:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-8 text-center">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
                Build Docker Compose Files
                <span className="block text-primary mt-2">
                  Without the Hassle
                </span>
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground text-lg md:text-xl">
                A powerful web-based tool for building and managing Docker
                Compose files, configurations, and schedulers. All in one place,
                completely free.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Button
                size="lg"
                className="text-lg px-8 py-6"
                onClick={() => navigate({ to: "/docker/compose-builder" })}
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6"
                onClick={() =>
                  window.open(
                    "https://github.com/hhftechnology/Dock-Dploy",
                    "_blank"
                  )
                }
              >
                <Github className="mr-2 h-5 w-5" />
                View on GitHub
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-24 bg-background">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Powerful Tools for Developers
            </h2>
            <p className="max-w-[900px] text-muted-foreground text-lg md:text-xl">
              Everything you need to build, manage, and deploy containerized
              applications
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={feature.title}
                  className="flex flex-col hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate({ to: feature.url })}
                >
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-2xl">
                        {feature.title}
                      </CardTitle>
                    </div>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <ul className="space-y-2 mb-4 flex-1">
                      {feature.highlights.map((highlight, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-sm"
                        >
                          <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">
                            {highlight}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      variant="outline"
                      className="w-full mt-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate({ to: feature.url });
                      }}
                    >
                      Try Now
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 md:py-24 bg-muted/50">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Why Choose Dock-Dploy?
            </h2>
            <p className="max-w-[900px] text-muted-foreground text-lg md:text-xl">
              Built by developers, for developers
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={benefit.title}
                  className="flex flex-col items-center text-center space-y-4"
                >
                  <div className="p-4 rounded-full bg-primary/10">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">{benefit.title}</h3>
                  <p className="text-muted-foreground max-w-[300px]">
                    {benefit.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-24 bg-background">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-8 text-center">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Ready to Get Started?
              </h2>
              <p className="max-w-[700px] text-muted-foreground text-lg md:text-xl">
                Start building your Docker Compose files today. No signup
                required, completely free.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="text-lg px-8 py-6"
                onClick={() => navigate({ to: "/docker/compose-builder" })}
              >
                Start Building
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6"
                onClick={() =>
                  window.open("https://discord.gg/HDCt9MjyMJ", "_blank")
                }
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Join Discord
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

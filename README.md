# Compose Deploy

A web-based tool for building and managing Docker Compose files, configurations, and schedulers.

## Features

- **Docker Compose Builder** - Build and manage Docker Compose files
  - Validate & reformat Compose files
  - Convert Compose to:
    - docker run commands
    - systemd service files
    - .env files
  - Generate Komodo .toml from Portainer stacks
  - Redact sensitive data in compose files for sharing
- **Config Builder** - Build configuration files (gethomepage.dev, and more)
- **Scheduler Builder** - Create schedulers (Cron, GitHub Actions, Systemd, etc.)
  - Select time, command, file name, etc.

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd compose-deploy
```

2. Install dependencies:

```bash
npm install
```

### Running Locally

To start the development server:

```bash
npm run dev
```

Or use the start script:

```bash
npm start
```

The application will be available at **http://localhost:3000**

### Building for Production

To build the project for production:

```bash
npm run build
```

To preview the production build:

```bash
npm run serve
```


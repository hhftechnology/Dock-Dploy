<div align="center">
    <h1 align="center"><a href="https://github.com/hhftechnology/Dock-Dploy">Dock-Dploy</a></h1>
</div>

A web-based tool for building, managing, and converting Docker Compose files, configuration files, and schedulers.

<div align="center">
    
[![Docker](https://img.shields.io/docker/pulls/hhftechnology/dock-dploy?style=flat-square)](https://hub.docker.com/r/hhftechnology/dock-dploy)
![Stars](https://img.shields.io/github/stars/hhftechnology/Dock-Dploy?style=flat-square)
[![Discord](https://img.shields.io/discord/994247717368909884?logo=discord&style=flat-square)](https://discord.gg/HDCt9MjyMJ)
[![React](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.1-646cff.svg)](https://vitejs.dev/)

</div>

<img width="1735" height="2354" alt="image" src="https://github.com/user-attachments/assets/2f06bbe1-8161-4263-a030-f9cd258ee372" />
<img width="1735" height="817" alt="image" src="https://github.com/user-attachments/assets/615c49e8-181f-4be8-8c07-aebc7aa2fb29" />


##  Table of Contents

- [Features](#-features)
- [Quick Start](#-quick-start)
- [Deployment Options](#-deployment-options)
- [Usage Guide](#-usage-guide)
- [Tech Stack](#-tech-stack)
- [Contributing](#-contributing)
- [License](#-license)

---

##  Features

###  Docker Compose Builder

Build and manage Docker Compose files with a powerful visual interface:

#### **Core Functionality**
-  **Visual Service Builder** - Create and configure Docker services with an intuitive UI
-  **Marketplace Integration** - Browse and import popular self-hosted services from [GitHub Marketplace](https://github.com/hhftechnology/Marketplace)
-  **YAML Validation** - Real-time validation and formatting of Compose files
-  **Live Preview** - See YAML output as you build with CodeMirror editor

#### **Service Configuration**
- **Container Settings**: Image, name, restart policies, user, working directory
- **Networking**: Ports (host/container mapping), expose, network modes, DNS, extra hosts
- **Storage**: Volumes (bind mounts & named volumes), tmpfs, devices
- **Environment**: Variables (array/dict syntax), env files
- **Resources**: CPU/memory limits and reservations, health checks
- **Security**: Privileged mode, capabilities (cap_add/cap_drop), security options, sysctls
- **Advanced**: Dependencies, labels, commands, entrypoints, ulimits, IPC/PID modes

#### **VPN Integration** 
Built-in support for containerized VPN solutions:
- **Tailscale** - Zero-config VPN with serve config support
- **Newt** - Lightweight VPN with Pangolin integration
- **Cloudflared** - Cloudflare Tunnel support
- **WireGuard** - Custom WireGuard configurations
- **ZeroTier** - Software-defined networking
- **Netbird** - Modern VPN alternative

Configure services to route through VPN containers with automatic network_mode settings.

#### **Network Management**
- Create and configure Docker networks (bridge, host, overlay, macvlan)
- IPAM configuration (driver, subnet, gateway)
- Network driver options
- External network support
- Attachable and internal network flags

#### **Volume Management**
- Named volumes with driver configurations
- Driver options (type, device, o flags)
- External volume support
- Volume labels

#### **Conversion Tools** 

Convert your Docker Compose files to various formats:

1. **Docker Run Commands**
   - Convert services to `docker run` equivalents
   - Automatically generates all flags and options
   - Perfect for debugging or manual deployment

2. **Systemd Service Files**
   - Generate systemd unit files for services
   - Auto-start containers with system boot
   - Service management with systemctl

3. **.env Files**
   - Extract environment variables to .env format
   - Optional: Clear environment variables from compose after extraction
   - Separate sensitive data from compose files

4. **Redact Sensitive Data**
   - Automatically redact passwords, secrets, tokens, and API keys
   - Safe sharing of compose files for troubleshooting
   - Pattern-based detection of sensitive values

5. **Komodo .toml Configuration**
   - Convert Docker Compose to Komodo deployment format
   - Supports Portainer stack imports
   - Environment variable extraction

---

###  Config Builder

Generate configuration files for popular self-hosted applications:

#### **Homepage Dashboard (gethomepage.dev)**
- Create services configuration YAML
- Define service name, description, icon, URL
- Organize with categories and tags
- Visual editor with live preview
- Copy or download generated config

#### **Custom Configurations**
- Extensible system for additional config types
- YAML-based output
- Template system for common configurations

---

###  Scheduler Builder

Create schedulers and automation tasks in multiple formats:

#### **Supported Formats**

1. **Cron Jobs**
   - Traditional cron syntax
   - User and working directory support
   - Command scheduling with full flexibility

2. **GitHub Actions**
   - Automated workflow generation
   - Cron-based scheduling
   - Ready-to-use YAML workflow files

3. **Systemd Timers**
   - Modern alternative to cron
   - Service and timer unit files
   - OnCalendar syntax support
   - Persistent scheduling

#### **Features**
- Visual cron expression builder
- Command testing and validation
- Description and metadata support
- Download or copy generated files
- Multi-format export

---

##  Quick Start

### Prerequisites

- **Node.js** v18 or higher
- **npm** or **yarn**
- *Optional*: **Docker** (for containerized deployment)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/hhftechnology/Dock-Dploy.git
   cd Dock-Dploy
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:3000
   ```

### Build for Production

```bash
npm run build
```

Preview the production build:

```bash
npm run serve
```

---

##  Deployment Options

### Option 1: Docker Compose (Recommended)

**Quick Deploy**

```bash
# Clone the repository
git clone https://github.com/hhftechnology/Dock-Dploy.git
cd Dock-Dploy

# Deploy with Docker Compose
docker-compose up -d
```

**Access at:** `http://localhost:3000`

**docker-compose.yml configuration:**

```yaml
services:
  dock-dploy:
    image: hhftechnology/dock-dploy:latest
    container_name: dock-dploy
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

**Custom Port:**
```bash
# Edit docker-compose.yml and change port mapping
ports:
  - "8080:3000"  # Access on port 8080
```

---

### Option 2: Docker (Standalone)

**Using Pre-built Image** (when available)

```bash
# Pull from Docker Hub
docker pull hhftechnology/dock-dploy:latest

# Run container
docker run -d \
  --name dock-dploy \
  --restart unless-stopped \
  -p 3000:3000 \
  -e NODE_ENV=production \
  hhftechnology/dock-dploy:latest
```

**Build and Run Locally**

```bash
# Build image
docker build -t dock-dploy .

# Run container
docker run -d \
  --name dock-dploy \
  --restart unless-stopped \
  -p 3000:3000 \
  -e NODE_ENV=production \
  dock-dploy
```

**Container Management:**

```bash
# View logs
docker logs dock-dploy

# Stop container
docker stop dock-dploy

# Start container
docker start dock-dploy

# Remove container
docker rm -f dock-dploy
```

---

### Option 3: Vercel (Serverless)

**One-Click Deploy**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/hhftechnology/Dock-Dploy)

**Manual Deploy**

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

**Configuration:**
- The `vercel.json` is pre-configured for SPA routing
- Automatic HTTPS and CDN
- Global edge network deployment

---

### Option 4: Traditional Web Server

**With Nginx**

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Copy dist folder to web root**
   ```bash
   sudo cp -r dist/* /var/www/html/dock-dploy/
   ```

3. **Configure Nginx**
   ```nginx
   server {
       listen 80;
       server_name dock-dploy.yourdomain.com;
       root /var/www/html/dock-dploy;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
           expires 1y;
           add_header Cache-Control "public, immutable";
       }
   }
   ```

4. **Reload Nginx**
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

**With Apache**

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Copy dist folder**
   ```bash
   sudo cp -r dist/* /var/www/html/dock-dploy/
   ```

3. **Create .htaccess**
   ```apache
   <IfModule mod_rewrite.c>
       RewriteEngine On
       RewriteBase /dock-dploy/
       RewriteRule ^index\.html$ - [L]
       RewriteCond %{REQUEST_FILENAME} !-f
       RewriteCond %{REQUEST_FILENAME} !-d
       RewriteRule . /dock-dploy/index.html [L]
   </IfModule>
   ```

4. **Enable mod_rewrite**
   ```bash
   sudo a2enmod rewrite
   sudo systemctl restart apache2
   ```

---

### Option 5: Static Hosting

**Netlify**

```bash
# Build
npm run build

# Drag and drop 'dist' folder to Netlify
# Or use Netlify CLI
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

**GitHub Pages**

```bash
# Build
npm run build

# Deploy to gh-pages branch
npx gh-pages -d dist
```

**Cloudflare Pages**

1. Connect your GitHub repository
2. Build command: `npm run build`
3. Output directory: `dist`
4. Deploy

---

##  Usage Guide

### Docker Compose Builder

#### Creating a New Compose File

1. **Navigate to Docker Compose Builder** from the sidebar
2. **Add a Service:**
   - Click "Add Service" button
   - Enter service name and image
   - Configure ports, volumes, environment variables
3. **Browse Marketplace** (optional):
   - Click "Browse Compose Marketplace"
   - Search for popular services (e.g., Nginx, PostgreSQL, Redis)
   - Click "Add All Services" to import
4. **Configure Networks and Volumes** as needed
5. **Download YAML** or copy to clipboard

#### Using VPN Integration

1. **Scroll to VPN Configuration** section
2. **Enable VPN** toggle
3. **Select VPN Type** (Tailscale, WireGuard, etc.)
4. **Configure VPN Settings:**
   - For Tailscale: Auth key, hostname, routes
   - For WireGuard: Config path, interface
   - For others: Respective configuration options
5. **Select Services to Route Through VPN**
6. VPN service is automatically added to your compose file

#### Converting to Other Formats

1. **Build your compose file**
2. **Click "Utilities" dropdown** in the YAML editor
3. **Select conversion type:**
   - Docker Run - Get docker run commands
   - Systemd Service - Generate unit files
   - .env File - Extract environment variables
   - Redact Sensitive Data - Safe sharing version
   - Komodo .toml - Komodo deployment format
4. **Copy or Download** the generated output

#### Validation and Reformatting

- **Validate YAML:** Click "Validate YAML" button
- **Reformat:** Click "Reformat YAML" for consistent formatting
- Real-time syntax highlighting with CodeMirror

---

### Config Builder

#### Creating Homepage Configuration

1. **Navigate to Config Builder**
2. **Select "Homepage" config type**
3. **Add Services:**
   - Name: Service display name
   - Description: Service description
   - Icon: Icon URL or icon name
   - URL: Service URL
   - Category (optional): Group services
   - Tags (optional): Service tags
4. **Click "Add Item"**
5. **Download or Copy** the generated YAML

---

### Scheduler Builder

#### Creating a Cron Job

1. **Navigate to Scheduler Builder**
2. **Select "Cron" type**
3. **Enter Details:**
   - Name: Job identifier
   - Schedule: Cron expression (e.g., `0 */6 * * *`)
   - Command: Command to execute
   - User: User to run as (default: root)
   - Working Dir: Path to execute from
4. **Download or Copy** the cron entry

#### Creating GitHub Actions Workflow

1. **Select "GitHub Actions" type**
2. **Configure:**
   - Name: Workflow name
   - Schedule: Cron expression
   - Command: Steps to execute
3. **Download** `.github/workflows/scheduled.yml`

#### Creating Systemd Timer

1. **Select "Systemd Timer" type**
2. **Configure:**
   - Name: Service name (e.g., backup)
   - Schedule: Cron or OnCalendar format
   - Command: Command to execute
   - User: Service user
   - Working Dir: Execution path
3. **Download** both `.service` and `.timer` files
4. **Install:**
   ```bash
   sudo cp *.service /etc/systemd/system/
   sudo cp *.timer /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable --now backup.timer
   ```

---

##  Tech Stack

### Frontend
- **React 19** - UI library
- **TypeScript 5.7** - Type safety
- **Vite 6** - Build tool and dev server
- **TanStack Router** - Type-safe routing
- **Tailwind CSS 4** - Utility-first CSS
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library

### Editor & Parsing
- **CodeMirror** - Code editor with YAML syntax highlighting
- **js-yaml** - YAML parsing and generation
- **Zod 4** - Schema validation

### Testing
- **Vitest** - Unit testing framework
- **Testing Library** - React testing utilities

### Build & Deployment
- **Vite** - Lightning-fast builds
- **TypeScript** - Strict type checking
- **Docker** - Containerization
- **Nginx** - Production web server

---


---

##  Contributing

Contributions are welcome! Here's how you can help:

### Reporting Bugs

1. Check existing issues
2. Create a new issue with:
   - Clear description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots (if applicable)

### Feature Requests

1. Open an issue with the `enhancement` label
2. Describe the feature and use case
3. Discuss implementation approach

### Pull Requests

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Test thoroughly**
   ```bash
   npm test
   npm run build
   ```
5. **Commit with descriptive messages**
   ```bash
   git commit -m "Add amazing feature"
   ```
6. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

### Development Guidelines

- Follow existing code style
- Add TypeScript types
- Update documentation
- Write tests for new features
- Keep commits focused and atomic

---

##  Acknowledgments

- **Marketplace Services** - [hhftechnology/Marketplace](https://github.com/hhftechnology/Marketplace)
- **Shadcn UI** - Beautiful, accessible components
- **Radix UI** - Accessible component primitives
- **TanStack** - Type-safe routing
- **Vite** - Next generation frontend tooling

---

##  Support

- **Issues**: [GitHub Issues](https://github.com/hhftechnology/Dock-Dploy/issues)
- **Discussions**: [GitHub Discussions](https://github.com/hhftechnology/Dock-Dploy/discussions)

---

##  Roadmap

- [ ] Multi-file compose project support
- [ ] Import from existing compose files
- [ ] Template library
- [ ] Docker Swarm support
- [ ] Kubernetes manifest generation
- [ ] Visual network diagram
- [ ] Service health monitoring
- [ ] Compose file diff viewer
- [ ] More config builder types
- [ ] Advanced VPN configurations

---

**Made with ❤️ for the self-hosting community**

---

##  Star History

If you find this project useful, please consider giving it a star on GitHub!


// Shared types for Docker Compose builder

export interface PortMapping {
  host: string;
  container: string;
  protocol: string;
}

export interface VolumeMapping {
  host: string;
  container: string;
  read_only?: boolean;
}

export interface Healthcheck {
  test: string;
  interval: string;
  timeout: string;
  retries: string;
  start_period: string;
  start_interval: string;
}

export interface ResourceLimits {
  cpus?: string;
  memory?: string;
}

export interface ResourceReservations {
  cpus?: string;
  memory?: string;
}

export interface DeployResources {
  limits?: ResourceLimits;
  reservations?: ResourceReservations;
}

export interface ServiceConfig {
  name: string;
  image: string;
  container_name?: string;
  ports: PortMapping[];
  expose: string[];
  volumes: VolumeMapping[];
  environment: { key: string; value: string }[];
  environment_syntax: "array" | "dict";
  volumes_syntax: "array" | "dict";
  command: string;
  restart: string;
  healthcheck?: Healthcheck;
  depends_on?: string[];
  entrypoint?: string;
  env_file?: string;
  extra_hosts?: string[];
  dns?: string[];
  networks?: string[];
  user?: string;
  working_dir?: string;
  labels?: { key: string; value: string }[];
  privileged?: boolean;
  read_only?: boolean;
  shm_size?: string;
  security_opt?: string[];
  // Network options
  network_mode?: string;
  // Capabilities
  cap_add?: string[];
  cap_drop?: string[];
  // System controls
  sysctls?: { key: string; value: string }[];
  // Device management
  devices?: string[];
  // Temporary filesystems
  tmpfs?: string[];
  // Resource limits
  ulimits?: { name: string; soft?: string; hard?: string }[];
  // Container lifecycle
  init?: boolean;
  stop_grace_period?: string;
  stop_signal?: string;
  // Terminal/interactive
  tty?: boolean;
  stdin_open?: boolean;
  // Hostname/DNS
  hostname?: string;
  domainname?: string;
  mac_address?: string;
  // IPC/PID/UTS namespaces
  ipc_mode?: string;
  pid?: string;
  uts?: string;
  // Cgroup
  cgroup_parent?: string;
  // Isolation
  isolation?: string;
  deploy?: {
    resources?: DeployResources;
  };
}

export interface NetworkConfig {
  name: string;
  driver: string;
  driver_opts: { key: string; value: string }[];
  attachable: boolean;
  labels: { key: string; value: string }[];
  external: boolean;
  name_external: string;
  internal: boolean;
  enable_ipv6: boolean;
  ipam: {
    driver: string;
    config: { subnet: string; gateway: string }[];
    options: { key: string; value: string }[];
  };
}

export interface VolumeConfig {
  name: string;
  driver: string;
  driver_opts: { key: string; value: string }[];
  labels: { key: string; value: string }[];
  external: boolean;
  name_external: string;
  driver_opts_type: string;
  driver_opts_device: string;
  driver_opts_o: string;
}


export type DevOpsTopic = {
  slug: string
  name: string
  description: string
  totalModules: number
  modules: string[]
}

export type DailyTask = {
  key: string
  label: string
  category: 'learn' | 'practice' | 'review'
}

export const DEVOPS_TOPICS: DevOpsTopic[] = [
  {
    slug: 'linux-fundamentals',
    name: 'Linux Fundamentals',
    description: 'File system, permissions, processes, and core CLI tools.',
    totalModules: 8,
    modules: [
      'File system & navigation',
      'File permissions & ownership',
      'User & group management',
      'Process management',
      'Package management',
      'Networking basics (ip/ifconfig)',
      'Shell & environment variables',
      'Systemd & services',
    ],
  },
  {
    slug: 'bash-scripting',
    name: 'Bash Scripting',
    description: 'Automate tasks with shell scripts, conditionals, loops, and functions.',
    totalModules: 6,
    modules: [
      'Variables & data types',
      'Control flow (if/for/while)',
      'Functions',
      'Input/output & redirection',
      'Error handling & exit codes',
      'Cron & scheduling',
    ],
  },
  {
    slug: 'git-github',
    name: 'Git & GitHub',
    description: 'Version control, branching strategies, and GitHub Actions.',
    totalModules: 5,
    modules: [
      'Core concepts (add/commit/push)',
      'Branching & merging',
      'Rebasing & conflict resolution',
      'GitHub Actions basics',
      'Git workflows (trunk-based, GitFlow)',
    ],
  },
  {
    slug: 'docker',
    name: 'Docker',
    description: 'Containers, images, Dockerfile authoring, and docker-compose.',
    totalModules: 7,
    modules: [
      'Images & containers',
      'Dockerfile authoring',
      'docker-compose',
      'Volumes & networking',
      'Multi-stage builds',
      'Docker registry & pushing images',
      'Container security basics',
    ],
  },
  {
    slug: 'networking',
    name: 'Networking Fundamentals',
    description: 'OSI model, IP addressing, DNS, firewalls, and load balancers.',
    totalModules: 6,
    modules: [
      'OSI model & TCP/IP',
      'IP addressing & subnetting',
      'DNS & HTTP/HTTPS',
      'Firewalls & security groups',
      'Load balancers',
      'VPNs & tunnelling',
    ],
  },
  {
    slug: 'kubernetes',
    name: 'Kubernetes',
    description: 'Container orchestration, deployments, services, RBAC, and Helm.',
    totalModules: 9,
    modules: [
      'Architecture (nodes, pods, kubelet)',
      'Deployments & ReplicaSets',
      'Services & Ingress',
      'ConfigMaps & Secrets',
      'Persistent storage (PV/PVC)',
      'Namespaces & RBAC',
      'Helm charts',
      'kubectl mastery',
      'Cluster troubleshooting',
    ],
  },
  {
    slug: 'terraform',
    name: 'Terraform',
    description: 'Infrastructure as Code with HCL, state management, and modules.',
    totalModules: 7,
    modules: [
      'HCL syntax & providers',
      'Resources & data sources',
      'Variables & outputs',
      'State management',
      'Modules',
      'Workspaces & environments',
      'Terraform Cloud basics',
    ],
  },
  {
    slug: 'ci-cd',
    name: 'CI/CD',
    description: 'Pipeline design, GitHub Actions, Jenkins, and deployment strategies.',
    totalModules: 6,
    modules: [
      'Pipeline concepts',
      'GitHub Actions',
      'Jenkins basics',
      'Artifact management',
      'Deployment strategies (blue-green, canary)',
      'Secrets management in CI',
    ],
  },
  {
    slug: 'aws-basics',
    name: 'AWS Basics',
    description: 'IAM, EC2, S3, VPC, RDS, Lambda, and CloudWatch.',
    totalModules: 8,
    modules: [
      'IAM & security',
      'EC2 & auto-scaling',
      'S3 & storage',
      'VPC & networking',
      'RDS & databases',
      'Lambda & serverless',
      'CloudWatch & logging',
      'EKS & ECS',
    ],
  },
  {
    slug: 'monitoring',
    name: 'Monitoring & Observability',
    description: 'Metrics, logs, traces, Prometheus, Grafana, and SLOs.',
    totalModules: 5,
    modules: [
      'Metrics, logs & traces',
      'Prometheus & Grafana',
      'ELK stack basics',
      'Alerting strategies',
      'SLOs & SLAs',
    ],
  },
  {
    slug: 'storage',
    name: 'Storage Fundamentals',
    description: 'Block, object, and file storage. RAID, NFS, and cloud options.',
    totalModules: 4,
    modules: [
      'Block vs object vs file storage',
      'RAID & redundancy',
      'NFS & shared storage',
      'Cloud storage options',
    ],
  },
  {
    slug: 'python-automation',
    name: 'Python for Automation',
    description: 'Scripts for DevOps: APIs, subprocess, CLI tools, and testing.',
    totalModules: 6,
    modules: [
      'Python basics for DevOps',
      'Working with files & APIs',
      'subprocess & OS interactions',
      'Fabric & Ansible basics',
      'Writing CLI tools',
      'Testing automation scripts',
    ],
  },
  {
    slug: 'g-research-prep',
    name: 'G-Research Prep',
    description: 'Targeted prep for G-Research DevOps/infrastructure roles.',
    totalModules: 5,
    modules: [
      'G-Research tech stack & culture',
      'Systems design fundamentals',
      'Linux internals deep dive',
      'Networking troubleshooting',
      'Mock interview practice',
    ],
  },
]

export const DAILY_TASKS: DailyTask[] = [
  { key: 'study-session', label: '30+ min study session', category: 'learn' },
  { key: 'hands-on-lab', label: 'Complete a hands-on lab', category: 'practice' },
  { key: 'read-docs', label: 'Read official documentation', category: 'learn' },
  { key: 'take-notes', label: 'Take structured notes', category: 'review' },
  { key: 'review-yesterday', label: "Review yesterday's notes", category: 'review' },
  { key: 'run-commands', label: 'Run commands in terminal', category: 'practice' },
]

export function getTopicBySlug(slug: string): DevOpsTopic | undefined {
  return DEVOPS_TOPICS.find((t) => t.slug === slug)
}

export function getTotalModules(): number {
  return DEVOPS_TOPICS.reduce((sum, t) => sum + t.totalModules, 0)
}

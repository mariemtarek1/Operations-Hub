/**
 * Mock Data Generator for Operations Management Dashboard
 * Generates 5,000+ realistic operations with deterministic seeding.
 */

const OPERATION_TEMPLATES = [
  { prefix: 'Database Backup', domains: ['PostgreSQL Cluster', 'MySQL Shard 02', 'Redis Cache Tier', 'Cassandra Analytics', 'MongoDB UserStore'] },
  { prefix: 'Cluster Scaling', domains: ['Kubernetes NodePool US-East', 'EKS Worker Nodes EU-West', 'GKE Autopilot Pool', 'Worker Autoscaler Production'] },
  { prefix: 'Security Audit', domains: ['OAuth2 Key Rotation', 'IAM Policy Verification', 'SSL/TLS Certificate Renewal', 'Vulnerability Penetration Scan'] },
  { prefix: 'Data Pipeline Sync', domains: ['Snowflake Warehouse Ingestion', 'Kafka Event Stream Rebalance', 'Spark Aggregator Job', 'ClickHouse Metrics Export'] },
  { prefix: 'Payment Processing', domains: ['Stripe Webhook Reconciliation', 'SEPA Settlement Batch', 'Fraud Detection Model Run', 'Ledger Integrity Verification'] },
  { prefix: 'Cache Invalidation', domains: ['Cloudflare Edge Purge', 'Varnish Reverse Proxy Tier', 'Session Store Eviction', 'Product Catalog Warm-up'] },
  { prefix: 'Index Maintenance', domains: ['Elasticsearch Index Lifecycle', 'PostgreSQL Vacuum & Reindex', 'Vector DB HNSW Compaction', 'OpenSearch Cluster Health'] },
  { prefix: 'Deploy Pipeline', domains: ['Auth Service Canary Deploy', 'API Gateway Blue/Green Cutover', 'Billing Service Rollout', 'Core Engine Hotfix Deployment'] },
  { prefix: 'Disaster Recovery', domains: ['Multi-Region Replica Validation', 'Snapshot Verification Drill', 'DNS Failover Health Check', 'Storage Bucket Mirror Audit'] },
  { prefix: 'System Optimization', domains: ['Memory Leak Investigation', 'CPU Throttle Profiling', 'Database Connection Pool Tuning', 'Log Retention Archival'] },
];

const OWNERS = [
  'Sarah Chen',
  'Alex Rivera',
  'David Kim',
  'Maria Santos',
  'Elena Rostov',
  'James Wilson',
  'Amina Patel',
  'Marcus Brody',
  'Chloe Nguyen',
  'Oliver Hansen',
  'Priya Sharma',
  'Liam O\'Connor',
];

export const STATUSES = ['Pending', 'Running', 'Completed', 'Failed'];

const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

const ENVIRONMENTS = ['Production', 'Staging', 'Development', 'DR'];

const REGIONS = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1', 'eu-central-1'];

// Deterministic Pseudo-Random Number Generator (Mulberry32)
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generate 5,200 realistic operation records.
 */
export function generateMockOperations(count = 5200) {
  const random = mulberry32(1337);
  const now = new Date('2026-10-11T14:00:00Z').getTime();
  const operations = [];

  for (let i = 1; i <= count; i++) {
    const id = `OP-${String(i).padStart(5, '0')}`;
    const tIndex = Math.floor(random() * OPERATION_TEMPLATES.length);
    const template = OPERATION_TEMPLATES[tIndex];
    const domain = template.domains[Math.floor(random() * template.domains.length)];
    const name = `${template.prefix} — ${domain} [#${i}]`;

    const owner = OWNERS[Math.floor(random() * OWNERS.length)];
    
    // Balanced status distribution
    const statusRand = random();
    let status;
    if (statusRand < 0.20) status = 'Pending';
    else if (statusRand < 0.45) status = 'Running';
    else if (statusRand < 0.85) status = 'Completed';
    else status = 'Failed';

    const priority = PRIORITIES[Math.floor(random() * PRIORITIES.length)];
    const environment = ENVIRONMENTS[Math.floor(random() * ENVIRONMENTS.length)];
    const region = REGIONS[Math.floor(random() * REGIONS.length)];

    // Dates: chronologically ordered so OP-00001 is newest, with minor realistic jitter
    const stepMs = (30 * 24 * 60 * 60 * 1000) / count;
    const baseOffset = (i - 1) * stepMs;
    const jitter = Math.floor(random() * (stepMs * 0.2));
    const createdTime = now - (baseOffset + jitter);
    const updateOffset = Math.floor(random() * Math.min(now - createdTime, 3600000));
    const updatedTime = createdTime + updateOffset;

    const createdDate = new Date(createdTime).toISOString();
    const lastUpdatedDate = new Date(updatedTime).toISOString();

    const durationMinutes = Math.floor(random() * 45) + 1;
    const durationSeconds = Math.floor(random() * 60);
    const duration = `${durationMinutes}m ${durationSeconds}s`;

    const retryCount = status === 'Failed' ? Math.floor(random() * 4) : Math.floor(random() * 2);

    const description = `Automated orchestration task for ${domain}. Initiated by ${owner} under policy rule POL-${100 + (i % 899)}. Handles integrity validation, pre-flight checks, execution hooks, and system telemetry monitoring.`;

    const logs = [
      {
        id: 'log-1',
        timestamp: createdDate,
        level: 'INFO',
        message: `Operation ${id} queued by ${owner} in ${environment} (${region}).`,
      },
      {
        id: 'log-2',
        timestamp: new Date(createdTime + 15000).toISOString(),
        level: 'INFO',
        message: 'Pre-flight dependency and lock validation successful.',
      },
    ];

    if (status === 'Running') {
      logs.push({
        id: 'log-3',
        timestamp: lastUpdatedDate,
        level: 'INFO',
        message: 'Execution in progress. Worker node running health telemetry verification.',
      });
    } else if (status === 'Completed') {
      logs.push({
        id: 'log-3',
        timestamp: lastUpdatedDate,
        level: 'SUCCESS',
        message: `Task finished successfully in ${duration}. Verified checksum integrity.`,
      });
    } else if (status === 'Failed') {
      logs.push({
        id: 'log-3',
        timestamp: lastUpdatedDate,
        level: 'ERROR',
        message: `Execution failed after ${retryCount} retry attempts. Error code ERR_TIMED_OUT: Lock lease expired.`,
      });
    }

    operations.push({
      id,
      name,
      owner,
      status,
      createdDate,
      lastUpdatedDate,
      description,
      priority,
      environment,
      region,
      duration,
      retryCount,
      logs,
    });
  }

  return operations;
}

// In-memory operation database
let globalOperationsStore = null;

export function getOperationsStore() {
  if (!globalOperationsStore) {
    globalOperationsStore = generateMockOperations(5200);
  }
  return globalOperationsStore;
}

export function resetMockDatabase(initialData = null) {
  globalOperationsStore = initialData ? [...initialData] : generateMockOperations(5200);
  return globalOperationsStore;
}

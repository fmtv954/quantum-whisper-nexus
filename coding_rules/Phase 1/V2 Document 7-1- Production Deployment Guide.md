# V2 Document 7.1: Production Deployment Guide

# **V2**  <span style="font-family: .SFUI-Regular; font-size: 17.0;">
     Document 7.1: Production Deployment Guide

 </span>
CONTEXT

Following the Asana Integration Guide, we need to document the complete production deployment process to ensure reliable, scalable, and secure operation of the Quantum Voice AI platform.

OBJECTIVE

Provide comprehensive production deployment guide covering infrastructure setup, environment configuration, security hardening, and monitoring for enterprise-scale operation.

STYLE

Step-by-step deployment manual with command examples, verification steps, and troubleshooting procedures.

TONE

Precise, operations-focused, with emphasis on reliability and security best practices.

AUDIENCE

DevOps engineers, system administrators, and technical leads responsible for production deployment.

RESPONSE FORMAT

Markdown with command examples, configuration templates, checklists, and verification procedures.

CONSTRAINTS

· Must support zero-downtime deployments
· Must handle 10,000+ concurrent calls
· Must maintain 99.5% uptime SLA
· Must include disaster recovery procedures

FEW-SHOT EXAMPLES

Reference: Tech stack specifications, system architecture, and previous integration guides.

TASK

Generate comprehensive production deployment guide covering:

1. Infrastructure Setup & Configuration
2. Environment & Secret Management
3. Database Deployment & Migration
4. CI/CD Pipeline Configuration
5. Monitoring & Alerting Setup
6. Disaster Recovery Procedures

VERIFICATION CHECKPOINT

Deployment should pass all health checks and handle production load within 15 minutes of deployment completion.

ROLLBACK INSTRUCTIONS

Document automated rollback procedures and database migration rollbacks.

COMMON ERRORS & FIXES

· Resource limits → Auto-scaling configuration
· Database connection pools → Connection optimization
· SSL/TLS configuration → Certificate management

NEXT STEP PREPARATION

This enables Document 8.1: Security Architecture implementation.

---

Quantum Voice AI - Production Deployment Guide

1. Infrastructure Setup & Configuration

1.1 Vercel Production Configuration

```json
// vercel.json - Production Configuration
{
  "version": 2,
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "outputDirectory": ".next",
  
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30,
      "memory": 1024,
      "runtime": "nodejs18.x"
    },
    "app/api/voice/**/*.ts": {
      "maxDuration": 60,
      "memory": 1536,
      "runtime": "nodejs18.x"
    }
  },
  
  "regions": ["iad1"],
  
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "origin-when-cross-origin"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=63072000; includeSubDomains; preload"
        }
      ]
    },
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=300, s-maxage=600"
        }
      ]
    }
  ],
  
  "env": {
    "NODE_ENV": "production",
    "NEXT_PUBLIC_APP_ENV": "production"
  }
}
```

1.2 Supabase Production Setup

```sql
-- Production Database Configuration
-- Run in Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Set performance parameters
ALTER DATABASE postgres SET shared_preload_libraries = 'pg_stat_statements';
ALTER DATABASE postgres SET pg_stat_statements.track = 'all';

-- Create production roles
CREATE ROLE quantum_reader;
CREATE ROLE quantum_writer;
CREATE ROLE quantum_admin;

-- Configure connection pooling
ALTER SYSTEM SET max_connections = '200';
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET work_mem = '4MB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';

-- Restart required for some changes
SELECT pg_reload_conf();
```

1.3 LiveKit Production Configuration

```yaml
# livekit.yaml - Production Configuration
port: 7880
bind_addresses: ["0.0.0.0"]

rtc:
  # WebRTC configuration for voice optimization
  udp_port: 7882
  tcp_port: 7881
  port_range_start: 50000
  port_range_end: 60000
  
  # Audio optimization
  use_external_ip: true
  enable_audio_red: true
  audio_red_codec: "opus/48000/2"

redis:
  address: "localhost:6379"
  username: ""
  password: ""
  db: 0

turn:
  enabled: true
  domain: "your-domain.com"
  tls_port: 5349
  udp_port: 3478
  external_tls: true

# Key configuration for production
keys:
  "your-api-key": "your-secret-key"

# Logging configuration
log_level: info

# Auto-scaling configuration
auto_scaling:
  enabled: true
  max_nodes: 10
  min_nodes: 2
  target_cpu: 70
  target_memory: 80
```

1.4 Redis Production Setup

```yaml
# redis.conf - Production Configuration
# Upstash Redis Configuration

bind 0.0.0.0
protected-mode yes
port 6379
timeout 0
tcp-keepalive 300

# Memory management
maxmemory 1gb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000
stop-writes-on-bgsave-error yes
rdbcompression yes
rdbchecksum yes
dbfilename dump.rdb

# Security
requirepass "your-production-redis-password"

# Performance
tcp-backlog 511
latency-monitor-threshold 100
slowlog-log-slower-than 10000
slowlog-max-len 128

# Cluster mode (if using Redis Cluster)
cluster-enabled yes
cluster-config-file nodes.conf
cluster-node-timeout 15000
```

---

2. Environment & Secret Management

2.1 Production Environment Variables

```bash
# .env.production - DO NOT COMMIT THIS FILE
# Application Configuration
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEXT_PUBLIC_APP_ENV=production

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...

# AI Services Configuration
DEEPGRAM_API_KEY=your_deepgram_production_key
OPENAI_API_KEY=sk-your_openai_production_key
GOOGLE_API_KEY=your_gemini_production_key
TAVILY_API_KEY=your_tavily_production_key

# LiveKit Configuration
LIVEKIT_API_KEY=your_livekit_production_api_key
LIVEKIT_API_SECRET=your_livekit_production_secret
NEXT_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud

# Redis Configuration
UPSTASH_REDIS_REST_URL=https://eu1-shiny-bird-12345.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_production_redis_token

# Integration Services
ASANA_ACCESS_TOKEN=your_asana_production_token
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
RESEND_API_KEY=your_resend_production_key

# Security Configuration
NEXTAUTH_SECRET=your_production_nextauth_secret_32_chars_minimum
NEXTAUTH_URL=https://your-domain.vercel.app

# Monitoring & Analytics
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_production_key
NEXT_PUBLIC_CRISP_WEBSITE_ID=your_crisp_production_id
NEXT_PUBLIC_SENTRY_DSN=your_sentry_production_dsn

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=1000
RATE_LIMIT_WINDOW_MS=900000

# Performance Configuration
NEXT_TELEMETRY_DISABLED=1
```

2.2 Vercel Environment Variables Setup

```bash
# Set production environment variables in Vercel
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add DEEPGRAM_API_KEY production
vercel env add OPENAI_API_KEY production
vercel env add LIVEKIT_API_KEY production
vercel env add LIVEKIT_API_SECRET production
vercel env add NEXTAUTH_SECRET production
vercel env add NEXTAUTH_URL production

# Verify environment variables
vercel env ls
```

2.3 Secret Rotation Procedure

```bash
#!/bin/bash
# scripts/rotate-secrets.sh

# Secret rotation script for production
set -e

echo "Starting secret rotation..."

# 1. Generate new secrets
NEW_NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEW_LIVEKIT_SECRET=$(openssl rand -base64 32)

# 2. Update Vercel environment variables
vercel env rm NEXTAUTH_SECRET production -y
vercel env add NEXTAUTH_SECRET production <<< "$NEW_NEXTAUTH_SECRET"

vercel env rm LIVEKIT_API_SECRET production -y
vercel env add LIVEKIT_API_SECRET production <<< "$NEW_LIVEKIT_SECRET"

# 3. Update LiveKit configuration
curl -X PATCH "https://your-project.livekit.cloud/config" \
  -H "Authorization: Bearer $LIVEKIT_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"secret\": \"$NEW_LIVEKIT_SECRET\"}"

# 4. Deploy with new secrets
vercel --prod

echo "Secret rotation completed successfully"
```

---

3. Database Deployment & Migration

3.1 Production Database Migration

```typescript
// supabase/migrations/20240101000000_initial_production_setup.sql
-- Production database migration

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create tables with proper partitioning
CREATE TABLE campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'draft',
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  voice_settings JSONB DEFAULT '{}',
  flow_config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Create monthly partitions for campaigns
CREATE TABLE campaigns_2024_01 PARTITION OF campaigns FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
CREATE TABLE campaigns_2024_02 PARTITION OF campaigns FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Create conversations table with partitioning
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES campaigns(id),
  customer_email VARCHAR(255) NOT NULL,
  transcript_summary TEXT,
  full_transcript TEXT,
  lead_data JSONB,
  cost_data JSONB,
  duration INTEGER,
  status VARCHAR(50) DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Create monthly partitions for conversations
CREATE TABLE conversations_2024_01 PARTITION OF conversations FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
CREATE TABLE conversations_2024_02 PARTITION OF conversations FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Create leads table
CREATE TABLE leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES campaigns(id),
  conversation_id UUID NOT NULL REFERENCES conversations(id),
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  full_name VARCHAR(255),
  company VARCHAR(255),
  qualification_score DECIMAL(3,2) DEFAULT 0.00,
  urgency_level VARCHAR(20) DEFAULT 'standard',
  status VARCHAR(50) DEFAULT 'new',
  assigned_agent_id UUID REFERENCES users(id),
  asana_task_id VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Performance indexes
CREATE INDEX CONCURRENTLY idx_campaigns_owner_id ON campaigns(owner_id);
CREATE INDEX CONCURRENTLY idx_campaigns_created_at ON campaigns(created_at);
CREATE INDEX CONCURRENTLY idx_conversations_campaign_id ON conversations(campaign_id);
CREATE INDEX CONCURRENTLY idx_conversations_created_at ON conversations(created_at);
CREATE INDEX CONCURRENTLY idx_leads_campaign_status ON leads(campaign_id, status);
CREATE INDEX CONCURRENTLY idx_leads_qualification_score ON leads(qualification_score DESC);
CREATE INDEX CONCURRENTLY idx_leads_created_at ON leads(created_at DESC);

-- Row Level Security Policies
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own campaigns" ON campaigns
  FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Users can access conversations from their campaigns" ON conversations
  FOR ALL USING (
    campaign_id IN (
      SELECT id FROM campaigns WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can access leads from their campaigns" ON leads
  FOR ALL USING (
    campaign_id IN (
      SELECT id FROM campaigns WHERE owner_id = auth.uid()
    )
  );
```

3.2 Database Migration Script

```typescript
// scripts/migrate-production.ts
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

async function runProductionMigrations() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log('Starting production database migrations...');

  try {
    // Read migration files
    const migrationFiles = [
      '20240101000000_initial_production_setup.sql',
      '20240102000000_add_analytics_tables.sql',
      '20240103000000_add_integration_tables.sql'
    ];

    for (const file of migrationFiles) {
      console.log(`Running migration: ${file}`);
      
      const migrationSQL = readFileSync(
        join(__dirname, '../supabase/migrations', file),
        'utf8'
      );

      // Split SQL by statements and execute sequentially
      const statements = migrationSQL
        .split(';')
        .filter(stmt => stmt.trim().length > 0);

      for (const statement of statements) {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          throw new Error(`Migration failed: ${error.message}\nSQL: ${statement}`);
        }
      }

      console.log(`✓ Completed migration: ${file}`);
    }

    console.log('✅ All production migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migrations if called directly
if (require.main === module) {
  runProductionMigrations();
}
```

3.3 Database Backup Configuration

```sql
-- Production backup configuration
-- Run in Supabase SQL Editor

-- Enable point-in-time recovery
ALTER SYSTEM SET wal_level = 'replica';
ALTER SYSTEM SET archive_mode = 'on';
ALTER SYSTEM SET archive_command = 'test ! -f /var/lib/postgresql/wal_archive/%f && cp %p /var/lib/postgresql/wal_archive/%f';
ALTER SYSTEM SET max_wal_senders = '10';
ALTER SYSTEM SET wal_keep_segments = '64';

-- Create backup user
CREATE USER backup_user WITH REPLICATION ENCRYPTED PASSWORD 'your_backup_password';

-- Configure automated backups
SELECT cron.schedule(
  'nightly-backup',
  '0 2 * * *', -- 2 AM daily
  $$
    SELECT pg_dump(
      'host=your-db-host port=5432 dbname=postgres user=backup_user password=your_backup_password',
      '--format=custom --verbose --no-owner --no-acl'
    )
  $$
);

-- Set up logical replication for real-time backups
CREATE PUBLICATION quantum_backup FOR ALL TABLES;
GRANT USAGE ON SCHEMA public TO backup_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO backup_user;
```

---

4. CI/CD Pipeline Configuration

4.1 GitHub Actions Production Pipeline

```yaml
# .github/workflows/production.yml
name: Production Deployment

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '18.x'
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run type check
      run: npm run type-check
    
    - name: Run tests
      run: npm test
      env:
        NEXTAUTH_SECRET: test-secret
        DATABASE_URL: postgresql://test:test@localhost:5432/test
    
    - name: Run E2E tests
      run: npm run test:e2e
      env:
        NEXTAUTH_SECRET: test-secret

  security-scan:
    runs-on: ubuntu-latest
    needs: test
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Run Snyk security scan
      uses: snyk/actions/node@master
      env:
        SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      with:
        args: --severity-threshold=high
    
    - name: Run CodeQL analysis
      uses: github/codeql-action/analyze@v3

  deploy-production:
    runs-on: ubuntu-latest
    needs: [test, security-scan]
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'
    
    - name: Install Vercel CLI
      run: npm install --global vercel@latest
    
    - name: Pull Vercel Environment Information
      run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
    
    - name: Build Project Artifacts
      run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
    
    - name: Run database migrations
      run: npm run db:migrate:production
      env:
        SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
        SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
    
    - name: Deploy to Production
      run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
    
    - name: Run health checks
      run: |
        chmod +x ./scripts/health-check.sh
        ./scripts/health-check.sh
    
    - name: Notify deployment
      uses: 8398a7/action-slack@v3
      with:
        status: ${{ job.status }}
        text: Production deployment completed
      env:
        SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
      if: always()
```

4.2 Production Health Check Script

```bash
#!/bin/bash
# scripts/health-check.sh

set -e

echo "Starting production health checks..."

APP_URL="https://your-domain.vercel.app"
HEALTH_ENDPOINTS=(
  "/api/health"
  "/api/health/database"
  "/api/health/ai-services"
  "/api/health/voice"
)

# Function to check endpoint health
check_endpoint() {
  local endpoint=$1
  local url="${APP_URL}${endpoint}"
  
  echo "Checking: $url"
  
  response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url")
  
  if [ "$response" -eq 200 ]; then
    echo "✅ $endpoint: HEALTHY (HTTP $response)"
    return 0
  else
    echo "❌ $endpoint: UNHEALTHY (HTTP $response)"
    return 1
  fi
}

# Function to check external services
check_external_services() {
  echo "Checking external services..."
  
  # Check Supabase
  supabase_status=$(curl -s -o /dev/null -w "%{http_code}" \
    "https://api.supabase.com/v1/projects/$SUPABASE_PROJECT_ID/health" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY")
  
  # Check Deepgram
  deepgram_status=$(curl -s -o /dev/null -w "%{http_code}" \
    "https://api.deepgram.com/v1/projects" \
    -H "Authorization: Token $DEEPGRAM_API_KEY")
  
  if [ "$supabase_status" -eq 200 ]; then
    echo "✅ Supabase: HEALTHY"
  else
    echo "❌ Supabase: UNHEALTHY"
    return 1
  fi
  
  if [ "$deepgram_status" -eq 200 ]; then
    echo "✅ Deepgram: HEALTHY"
  else
    echo "❌ Deepgram: UNHEALTHY"
    return 1
  fi
}

# Run all health checks
all_healthy=true

for endpoint in "${HEALTH_ENDPOINTS[@]}"; do
  if ! check_endpoint "$endpoint"; then
    all_healthy=false
  fi
done

if ! check_external_services; then
  all_healthy=false
fi

if [ "$all_healthy" = true ]; then
  echo "🎉 All health checks passed! Production deployment is healthy."
  exit 0
else
  echo "💥 Some health checks failed. Please investigate."
  exit 1
fi
```

4.3 Zero-Downtime Deployment Strategy

```typescript
// app/api/deployment/strategy.ts
export class ZeroDowntimeDeployment {
  async executeSafeDeployment(): Promise<DeploymentResult> {
    try {
      // Step 1: Pre-deployment checks
      await this.runPreDeploymentChecks();
      
      // Step 2: Drain LiveKit connections gradually
      await this.drainLiveKitConnections();
      
      // Step 3: Deploy new version
      const deployment = await this.deployNewVersion();
      
      // Step 4: Warm up new instances
      await this.warmUpInstances();
      
      // Step 5: Health verification
      await this.verifyDeploymentHealth();
      
      // Step 6: Switch traffic
      await this.switchTraffic();
      
      return { success: true, deployment };
    } catch (error) {
      // Step 7: Rollback if anything fails
      await this.rollbackDeployment();
      throw error;
    }
  }

  private async drainLiveKitConnections(): Promise<void> {
    console.log('Draining LiveKit connections...');
    
    // Set LiveKit to drain mode - stop accepting new connections
    await fetch('https://your-project.livekit.cloud/api/drain', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.LIVEKIT_API_KEY}`
      }
    });

    // Wait for existing connections to complete (max 5 minutes)
    const startTime = Date.now();
    while (Date.now() - startTime < 300000) {
      const stats = await this.getLiveKitStats();
      if (stats.activeConnections === 0) {
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  private async warmUpInstances(): Promise<void> {
    console.log('Warming up new instances...');
    
    const warmupEndpoints = [
      '/api/health',
      '/api/voice/initialize',
      '/api/leads',
      '/api/campaigns'
    ];

    // Make requests to warm up serverless functions
    await Promise.allSettled(
      warmupEndpoints.map(endpoint =>
        fetch(`${process.env.NEXT_PUBLIC_APP_URL}${endpoint}`)
      )
    );

    // Wait for functions to be ready
    await new Promise(resolve => setTimeout(resolve, 10000));
  }
}
```

---

5. Monitoring & Alerting Setup

5.1 Production Monitoring Configuration

```typescript
// lib/monitoring/production.ts
export class ProductionMonitoring {
  private sentry: typeof Sentry;
  private posthog: PostHog;

  constructor() {
    // Sentry for error tracking
    this.sentry = Sentry;
    this.sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: 'production',
      tracesSampleRate: 0.1,
      profilesSampleRate: 0.05,
    });

    // PostHog for product analytics
    this.posthog = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      host: 'https://app.posthog.com',
    });
  }

  async trackCriticalMetrics(): Promise<void> {
    // Track key production metrics
    const metrics = await this.gatherProductionMetrics();
    
    // Send to monitoring services
    this.sentry.captureMessage('Production metrics collected', {
      level: 'info',
      extra: metrics,
    });

    this.posthog.capture('production_metrics', metrics);
  }

  private async gatherProductionMetrics(): Promise<ProductionMetrics> {
    return {
      timestamp: new Date().toISOString(),
      activeCalls: await this.getActiveCallCount(),
      databaseConnections: await this.getDatabaseConnectionCount(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      responseTimes: await this.getAverageResponseTimes(),
      errorRate: await this.getErrorRate(),
      costPerMinute: await this.getCurrentCostRate(),
    };
  }

  setupHealthChecks(): void {
    // API health check endpoints
    app.get('/api/health', (req, res) => {
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });

    app.get('/api/health/database', async (req, res) => {
      try {
        const client = await pool.connect();
        await client.query('SELECT 1');
        client.release();
        res.json({ status: 'healthy', database: 'connected' });
      } catch (error) {
        res.status(503).json({ status: 'unhealthy', database: 'disconnected' });
      }
    });

    app.get('/api/health/ai-services', async (req, res) => {
      const services = await this.checkAIServices();
      const allHealthy = Object.values(services).every(s => s.healthy);
      
      res.status(allHealthy ? 200 : 503).json({
        status: allHealthy ? 'healthy' : 'degraded',
        services,
      });
    });
  }
}
```

5.2 Alerting Configuration

```yaml
# monitoring/alerts.yml
groups:
- name: quantum-voice-alerts
  rules:
  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "High error rate detected"
      description: "Error rate is above 5% for the last 5 minutes"

  - alert: DatabaseHighConnections
    expr: supabase_connections_total > 150
    for: 2m
    labels:
      severity: warning
    annotations:
      summary: "Database connections high"
      description: "Database connections are above 150"

  - alert: AIServiceDown
    expr: up{job=~"deepgram|openai"} == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "AI service down"
      description: "One or more AI services are unavailable"

  - alert: HighResponseTime
    expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High response time detected"
      description: "95th percentile response time is above 2 seconds"

  - alert: CostAnomaly
    expr: rate(cost_per_minute[1h]) > rate(cost_per_minute[1h] offset 1d) * 1.5
    for: 15m
    labels:
      severity: warning
    annotations:
      summary: "Cost anomaly detected"
      description: "Current cost rate is 50% higher than yesterday"
```

5.3 Performance Monitoring Dashboard

```typescript
// lib/monitoring/dashboard.ts
export class PerformanceDashboard {
  static getProductionMetrics(): DashboardConfig {
    return {
      title: 'Quantum Voice AI - Production Dashboard',
      refreshInterval: 30000, // 30 seconds
      panels: [
        {
          title: 'Active Calls',
          type: 'gauge',
          query: 'livekit_active_connections',
          thresholds: [50, 100, 200],
        },
        {
          title: 'Response Time (95th %ile)',
          type: 'stat',
          query: 'histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))',
          unit: 's',
        },
        {
          title: 'Error Rate',
          type: 'timeseries',
          query: 'rate(http_requests_total{status=~"5.."}[5m]) * 100',
          unit: '%',
        },
        {
          title: 'Cost Per Minute',
          type: 'timeseries',
          query: 'cost_per_minute',
          unit: 'USD',
        },
        {
          title: 'Database Connections',
          type: 'timeseries',
          query: 'supabase_connections_total',
        },
        {
          title: 'AI Service Health',
          type: 'status',
          query: 'up{job=~"deepgram|openai|gemini"}',
        },
      ],
    };
  }
}
```

---

6. Disaster Recovery Procedures

6.1 Database Recovery Procedures

```bash
#!/bin/bash
# scripts/disaster-recovery.sh

set -e

echo "Starting disaster recovery procedures..."

# Function to restore database from backup
restore_database() {
  local backup_file=$1
  
  echo "Restoring database from backup: $backup_file"
  
  # Stop application traffic
  vercel scale quantum-voice 0
  
  # Restore database
  pg_restore \
    --host=$SUPABASE_HOST \
    --port=5432 \
    --username=postgres \
    --dbname=postgres \
    --clean \
    --if-exists \
    --verbose \
    "$backup_file"
  
  # Run post-restore checks
  psql $DATABASE_URL -c "SELECT count(*) as total_campaigns FROM campaigns;"
  psql $DATABASE_URL -c "SELECT count(*) as total_leads FROM leads;"
  
  echo "Database restoration completed"
}

# Function to failover to secondary region
failover_to_secondary() {
  echo "Initiating failover to secondary region..."
  
  # Update DNS to secondary region
  vercel domains ls
  vercel domains update your-domain.com --target secondary.vercel.app
  
  # Switch environment variables
  vercel env rm SUPABASE_URL production -y
  vercel env add SUPABASE_URL production <<< "$SECONDARY_SUPABASE_URL"
  
  # Scale up secondary region
  vercel scale quantum-voice 1 --region=sfo1
  
  echo "Failover to secondary region completed"
}

# Function to recover from complete outage
full_recovery() {
  echo "Starting full system recovery..."
  
  # 1. Restore database
  restore_database "latest_backup.dump"
  
  # 2. Redeploy application
  vercel --prod --force
  
  # 3. Verify recovery
  ./scripts/health-check.sh
  
  # 4. Notify stakeholders
  send_recovery_notification "Full system recovery completed"
  
  echo "Full system recovery completed"
}

# Main recovery procedure
case "$1" in
  "database")
    restore_database "$2"
    ;;
  "failover")
    failover_to_secondary
    ;;
  "full")
    full_recovery
    ;;
  *)
    echo "Usage: $0 {database|failover|full} [backup_file]"
    exit 1
    ;;
esac
```

6.2 Data Export & Backup Verification

```typescript
// scripts/verify-backups.ts
export class BackupVerification {
  async verifyProductionBackups(): Promise<BackupVerificationResult> {
    const results: BackupVerificationResult = {
      timestamp: new Date().toISOString(),
      checks: [],
      overallStatus: 'healthy',
    };

    // Check database backup integrity
    const dbCheck = await this.verifyDatabaseBackup();
    results.checks.push(dbCheck);

    // Check file storage backups
    const storageCheck = await this.verifyStorageBackup();
    results.checks.push(storageCheck);

    // Check configuration backups
    const configCheck = await this.verifyConfigBackup();
    results.checks.push(configCheck);

    // Update overall status
    if (results.checks.some(check => check.status === 'failed')) {
      results.overallStatus = 'unhealthy';
    } else if (results.checks.some(check => check.status === 'degraded')) {
      results.overallStatus = 'degraded';
    }

    return results;
  }

  private async verifyDatabaseBackup(): Promise<BackupCheck> {
    try {
      // Connect to backup database and run integrity checks
      const backupClient = await this.getBackupDatabaseClient();
      
      const tableCounts = await backupClient.query(`
        SELECT 
          (SELECT COUNT(*) FROM campaigns) as campaign_count,
          (SELECT COUNT(*) FROM leads) as lead_count,
          (SELECT COUNT(*) FROM conversations) as conversation_count
      `);

      const primaryCounts = await this.getPrimaryDatabaseCounts();
      
      const isHealthy = 
        tableCounts.rows[0].campaign_count === primaryCounts.campaign_count &&
        tableCounts.rows[0].lead_count === primaryCounts.lead_count;

      return {
        name: 'database_backup',
        status: isHealthy ? 'healthy' : 'degraded',
        details: {
          backup_counts: tableCounts.rows[0],
          primary_counts: primaryCounts,
          integrity_check: isHealthy ? 'passed' : 'failed',
        },
      };
    } catch (error) {
      return {
        name: 'database_backup',
        status: 'failed',
        details: { error: error.message },
      };
    }
  }
}
```

---

🎯 Verification Checklist

Pre-Deployment Verification

· All environment variables configured in Vercel
· Database migrations tested and ready
· SSL certificates valid and configured
· Domain DNS properly configured
· Backup systems operational

Post-Deployment Verification

· All health check endpoints returning 200
· Database connections within limits
· AI services responding correctly
· Voice calls connecting successfully
· Monitoring dashboards populated
· Alerting systems operational

Performance Verification

· Page load times <3 seconds
· API response times <500ms average
· Voice call latency <100ms
· Database query performance optimal
· Memory usage within limits

---

📚 Next Steps

Proceed to Document 8.1: Security Architecture for implementing production security hardening and compliance measures.

Related Documents:

· 2.2 Tech Stack Specification (infrastructure foundation)
· 3.1 Voice AI Pipeline Architecture (performance requirements)
· 9.1 Comprehensive Troubleshooting Guide (operational support)

---

Generated following CO-STAR framework with production-ready deployment procedures and verification checklists.
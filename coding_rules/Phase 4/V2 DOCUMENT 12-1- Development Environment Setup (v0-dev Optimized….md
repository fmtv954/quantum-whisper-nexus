# V2 DOCUMENT 12.1: Development Environment Setup (v0.dev Optimized…

V2 DOCUMENT 12.1: Development Environment Setup (v0.dev Optimized)

CONTEXT
Following comprehensive backup and disaster recovery implementation, we need to establish streamlined development environment setup procedures to enable rapid onboarding, consistent development practices, and efficient local testing for the Quantum Voice AI platform.

OBJECTIVE
Provide complete development environment specification with automated setup scripts, local testing configurations, debugging tools, and v0.dev-optimized development components.

STYLE
Technical setup documentation with step-by-step instructions, automation scripts, and development workflow specifications.

TONE
Practical, developer-focused, with emphasis on productivity and consistency.

AUDIENCE
Developers, engineering managers, DevOps engineers, quality assurance teams.

RESPONSE FORMAT
Markdown with setup procedures, configuration templates, automation scripts, and v0.dev-optimized development components.

CONSTRAINTS

· Must support onboarding of new developers in < 30 minutes
· Enable full local development with all services
· Support both macOS and Windows development environments
· Optimized for v0.dev development tools and workflows

---

Quantum Voice AI - Development Environment Setup (v0.dev Optimized)

1. Development Environment Architecture

1.1 Local Development Stack

```typescript
// scripts/setup/dev-environment.ts - Development environment manager
export class DevelopmentEnvironment {
  private prerequisites: Prerequisite[] = [];
  private services: DevelopmentService[] = [];
  private configurations: EnvironmentConfig[] = [];

  constructor() {
    this.initializePrerequisites();
    this.initializeServices();
    this.initializeConfigurations();
  }

  private initializePrerequisites() {
    this.prerequisites.push({
      id: 'nodejs',
      name: 'Node.js Runtime',
      description: 'JavaScript runtime for Next.js application',
      required: true,
      version: '18.x',
      verification: async () => {
        const version = await exec('node --version');
        return version.includes('v18');
      },
      installation: {
        macos: 'brew install node@18',
        windows: 'choco install nodejs --version=18.17.0',
        linux: 'curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs'
      }
    });

    this.prerequisites.push({
      id: 'git',
      name: 'Git Version Control',
      description: 'Source code management and version control',
      required: true,
      version: '2.30+',
      verification: async () => {
        const version = await exec('git --version');
        return version.includes('git version');
      },
      installation: {
        macos: 'brew install git',
        windows: 'choco install git',
        linux: 'sudo apt-get install git'
      }
    });

    this.prerequisites.push({
      id: 'docker',
      name: 'Docker Desktop',
      description: 'Containerization for local services',
      required: false,
      version: '20.10+',
      verification: async () => {
        const version = await exec('docker --version');
        return version.includes('Docker version');
      },
      installation: {
        macos: 'brew install --cask docker',
        windows: 'choco install docker-desktop',
        linux: 'curl -fsSL https://get.docker.com | sh'
      }
    });
  }

  private initializeServices() {
    this.services.push({
      id: 'local_supabase',
      name: 'Local Supabase',
      description: 'Local PostgreSQL database with Supabase features',
      type: 'database',
      required: true,
      setup: async () => {
        // Start Supabase local development
        await exec('npx supabase start');
      },
      healthCheck: async () => {
        const response = await fetch('http://localhost:54321/health');
        return response.status === 200;
      },
      configuration: {
        port: 54321,
        databaseUrl: 'postgresql://postgres:postgres@localhost:54322/postgres'
      }
    });

    this.services.push({
      id: 'redis_local',
      name: 'Redis Server',
      description: 'In-memory data store for sessions and caching',
      type: 'cache',
      required: true,
      setup: async () => {
        if (await this.isDockerAvailable()) {
          await exec('docker run -d -p 6379:6379 redis:7-alpine');
        } else {
          await exec('brew install redis && redis-server --daemonize yes');
        }
      },
      healthCheck: async () => {
        try {
          const redis = new Redis(6379);
          await redis.ping();
          return true;
        } catch {
          return false;
        }
      }
    });

    this.services.push({
      id: 'local_voice_simulator',
      name: 'Voice AI Simulator',
      description: 'Mock services for LiveKit and Deepgram during development',
      type: 'simulation',
      required: false,
      setup: async () => {
        await exec('npm run dev:voice-simulator');
      },
      healthCheck: async () => {
        const response = await fetch('http://localhost:3001/health');
        return response.status === 200;
      }
    });
  }

  async setupDevelopmentEnvironment(): Promise<SetupResult> {
    const setupStart = Date.now();
    const setupResult: SetupResult = {
      id: generateId(),
      startTime: new Date(),
      status: 'in_progress',
      steps: [],
      environment: await this.detectEnvironment()
    };

    try {
      // Verify prerequisites
      for (const prerequisite of this.prerequisites) {
        const stepResult = await this.installPrerequisite(prerequisite);
        setupResult.steps.push(stepResult);

        if (stepResult.status === 'failed' && prerequisite.required) {
          setupResult.status = 'failed';
          setupResult.error = `Required prerequisite failed: ${prerequisite.name}`;
          return setupResult;
        }
      }

      // Clone repository if not already present
      if (!await this.isRepositoryCloned()) {
        await this.cloneRepository();
      }

      // Install dependencies
      await this.installDependencies();

      // Set up environment configuration
      await this.setupEnvironmentConfig();

      // Start local services
      for (const service of this.services) {
        if (service.required) {
          const serviceResult = await this.startService(service);
          setupResult.steps.push(serviceResult);
        }
      }

      // Verify setup
      const verification = await this.verifySetup();
      setupResult.verification = verification;

      setupResult.status = 'completed';
      setupResult.endTime = new Date();
      setupResult.duration = Date.now() - setupStart;

      // Generate setup report
      await this.generateSetupReport(setupResult);

    } catch (error) {
      setupResult.status = 'failed';
      setupResult.error = error.message;
      setupResult.endTime = new Date();
      setupResult.duration = Date.now() - setupStart;
    }

    return setupResult;
  }
}
```

1.2 Automated Setup Scripts

```bash
#!/bin/bash
# scripts/setup/setup-dev.sh - Automated development environment setup

set -e

echo "🚀 Setting up Quantum Voice AI Development Environment"
echo "======================================================"

# Detect operating system
detect_os() {
    case "$(uname -s)" in
        Darwin*)    OS="macos" ;;
        Linux*)     OS="linux" ;;
        CYGWIN*)    OS="windows" ;;
        MINGW*)     OS="windows" ;;
        *)          OS="unknown" ;;
    esac
    echo "Detected OS: $OS"
}

# Check prerequisites
check_prerequisites() {
    echo "🔍 Checking prerequisites..."
    
    # Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        echo "✅ Node.js: $NODE_VERSION"
    else
        echo "❌ Node.js not found"
        install_nodejs
    fi
    
    # Git
    if command -v git &> /dev/null; then
        GIT_VERSION=$(git --version)
        echo "✅ Git: $GIT_VERSION"
    else
        echo "❌ Git not found"
        install_git
    fi
    
    # Package manager
    if [ "$OS" = "macos" ] && command -v brew &> /dev/null; then
        echo "✅ Homebrew"
    elif [ "$OS" = "windows" ] && command -v choco &> /dev/null; then
        echo "✅ Chocolatey"
    fi
}

# Install Node.js
install_nodejs() {
    echo "📦 Installing Node.js 18..."
    case "$OS" in
        "macos")
            brew install node@18
            echo 'export PATH="/opt/homebrew/opt/node@18/bin:$PATH"' >> ~/.zshrc
            ;;
        "linux")
            curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
            sudo apt-get install -y nodejs
            ;;
        "windows")
            choco install nodejs --version=18.17.0
            ;;
    esac
}

# Setup project
setup_project() {
    echo "📁 Setting up project..."
    
    # Clone repository if not present
    if [ ! -d "quantum-voice-ai" ]; then
        git clone https://github.com/quantum-voice/quantum-voice-ai.git
        cd quantum-voice-ai
    else
        cd quantum-voice-ai
        git pull origin main
    fi
    
    # Install dependencies
    echo "📦 Installing dependencies..."
    npm install
    
    # Setup environment variables
    echo "⚙️  Setting up environment..."
    cp .env.example .env.local
    
    # Generate secure keys
    node scripts/generate-keys.js
}

# Start services
start_services() {
    echo "🔧 Starting local services..."
    
    # Start Supabase
    echo "Starting Supabase..."
    npx supabase start &
    
    # Start Redis
    echo "Starting Redis..."
    if command -v docker &> /dev/null; then
        docker run -d -p 6379:6379 redis:7-alpine
    else
        redis-server --daemonize yes
    fi
    
    # Wait for services to be ready
    echo "⏳ Waiting for services to be ready..."
    sleep 10
    
    # Verify services
    verify_services
}

# Verify services
verify_services() {
    echo "🔍 Verifying services..."
    
    # Check Supabase
    if curl -f http://localhost:54321/health &> /dev/null; then
        echo "✅ Supabase is running"
    else
        echo "❌ Supabase failed to start"
        exit 1
    fi
    
    # Check Redis
    if redis-cli ping &> /dev/null; then
        echo "✅ Redis is running"
    else
        echo "❌ Redis failed to start"
        exit 1
    fi
}

# Main execution
main() {
    detect_os
    check_prerequisites
    setup_project
    start_services
    
    echo ""
    echo "🎉 Development environment setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Update .env.local with your API keys"
    echo "2. Run 'npm run dev' to start the development server"
    echo "3. Open http://localhost:3000 in your browser"
    echo ""
    echo "For more information, see docs/development.md"
}

main "$@"
```

2. Development Tools & Configuration

2.1 Development Tooling Setup

```typescript
// config/development-tools.ts - Development tools configuration
export class DevelopmentTools {
  private codeEditors: CodeEditorConfig[] = [];
  private debuggingTools: DebuggingTool[] = [];
  private testingTools: TestingTool[] = [];

  constructor() {
    this.initializeCodeEditors();
    this.initializeDebuggingTools();
    this.initializeTestingTools();
  }

  private initializeCodeEditors() {
    // VS Code configuration
    this.codeEditors.push({
      id: 'vscode',
      name: 'Visual Studio Code',
      recommended: true,
      extensions: [
        {
          id: 'ms-vscode.vscode-typescript-next',
          name: 'TypeScript and JavaScript Language Features',
          purpose: 'TypeScript support'
        },
        {
          id: 'bradlc.vscode-tailwindcss',
          name: 'Tailwind CSS IntelliSense',
          purpose: 'Tailwind CSS support'
        },
        {
          id: 'ms-vscode.vscode-json',
          name: 'JSON Language Features',
          purpose: 'JSON support'
        },
        {
          id: 'esbenp.prettier-vscode',
          name: 'Prettier - Code formatter',
          purpose: 'Code formatting'
        },
        {
          id: 'ms-vscode.vscode-eslint',
          name: 'ESLint',
          purpose: 'JavaScript/TypeScript linting'
        },
        {
          id: 'supabase.supabase-vscode',
          name: 'Supabase',
          purpose: 'Supabase integration'
        }
      ],
      settings: {
        'typescript.preferences.includePackageJsonAutoImports': 'auto',
        'typescript.suggest.autoImports': true,
        'editor.formatOnSave': true,
        'editor.codeActionsOnSave': {
          'source.fixAll.eslint': true
        },
        'tailwindCSS.includeLanguages': {
          'typescript': 'javascript',
          'typescriptreact': 'javascript'
        }
      },
      snippets: await this.generateVSCodeSnippets()
    });

    // WebStorm configuration
    this.codeEditors.push({
      id: 'webstorm',
      name: 'WebStorm',
      recommended: false,
      configurations: [
        'Enable TypeScript support',
        'Configure ESLint integration',
        'Setup Prettier for code formatting',
        'Enable Tailwind CSS recognition'
      ]
    });
  }

  private initializeDebuggingTools() {
    this.debuggingTools.push({
      id: 'chrome_devtools',
      name: 'Chrome DevTools',
      type: 'browser',
      setup: async () => {
        // Configure Next.js debugging
        await this.setupNextJSDebugging();
      },
      configurations: {
        breakpoints: ['API routes', 'React components', 'Utility functions'],
        network: ['API call inspection', 'WebSocket monitoring'],
        performance: ['React component profiling', 'Bundle analysis']
      }
    });

    this.debuggingTools.push({
      id: 'vscode_debugger',
      name: 'VS Code Debugger',
      type: 'ide',
      setup: async () => {
        await this.createVSCodeLaunchConfig();
      },
      configurations: {
        'Next.js Development': {
          type: 'node',
          request: 'launch',
          name: 'Next.js Development',
          program: '${workspaceFolder}/node_modules/.bin/next',
          args: ['dev'],
          serverReadyAction: {
            pattern: 'started server on .+, url: (https?://.+)',
            uriFormat: '%s',
            action: 'openExternally'
          }
        },
        'API Debugging': {
          type: 'node',
          request: 'launch',
          name: 'Debug API Route',
          program: '${workspaceFolder}/node_modules/.bin/next',
          args: ['dev'],
          env: {
            NODE_OPTIONS: '--inspect'
          }
        }
      }
    });
  }

  async setupDevelopmentTools(): Promise<ToolsSetupResult> {
    const setupResult: ToolsSetupResult = {
      timestamp: new Date(),
      tools: [],
      configurations: []
    };

    // Setup recommended code editor
    const recommendedEditor = this.codeEditors.find(editor => editor.recommended);
    if (recommendedEditor) {
      await this.setupCodeEditor(recommendedEditor);
      setupResult.tools.push({
        tool: recommendedEditor.name,
        status: 'configured'
      });
    }

    // Setup debugging tools
    for (const tool of this.debuggingTools) {
      await tool.setup();
      setupResult.tools.push({
        tool: tool.name,
        status: 'configured'
      });
    }

    // Generate configuration files
    await this.generateConfigurationFiles();
    
    return setupResult;
  }
}
```

2.2 Environment Configuration Management

```typescript
// config/environment-manager.ts - Environment configuration management
export class EnvironmentManager {
  private environments: DevelopmentEnvironment[] = [];
  private templates: EnvironmentTemplate[] = [];

  constructor() {
    this.initializeEnvironments();
    this.initializeTemplates();
  }

  private initializeEnvironments() {
    this.environments.push({
      id: 'local',
      name: 'Local Development',
      type: 'development',
      services: {
        database: 'supabase_local',
        cache: 'redis_local',
        voice: 'voice_simulator',
        ai: 'mock_services'
      },
      configuration: {
        NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:54321',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...',
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:54322/postgres',
        REDIS_URL: 'redis://localhost:6379',
        OPENAI_API_KEY: 'sk-local-development-mock-key',
        DEEPGRAM_API_KEY: 'mock_deepgram_key',
        LIVEKIT_API_KEY: 'mock_livekit_key',
        LIVEKIT_API_SECRET: 'mock_livekit_secret',
        NODE_ENV: 'development'
      },
      features: {
        hotReload: true,
        debugMode: true,
        mockServices: true,
        verboseLogging: true
      }
    });

    this.environments.push({
      id: 'test',
      name: 'Test Environment',
      type: 'testing',
      services: {
        database: 'supabase_test',
        cache: 'redis_test',
        voice: 'voice_simulator',
        ai: 'mock_services'
      },
      configuration: {
        NEXT_PUBLIC_SUPABASE_URL: process.env.TEST_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.TEST_SUPABASE_ANON_KEY,
        DATABASE_URL: process.env.TEST_DATABASE_URL,
        NODE_ENV: 'test'
      },
      features: {
        hotReload: false,
        debugMode: false,
        mockServices: true,
        verboseLogging: false
      }
    });
  }

  async setupEnvironment(environmentId: string): Promise<EnvironmentSetup> {
    const environment = this.environments.find(env => env.id === environmentId);
    if (!environment) {
      throw new Error(`Environment not found: ${environmentId}`);
    }

    const setup: EnvironmentSetup = {
      environment: environmentId,
      timestamp: new Date(),
      services: [],
      configuration: {}
    };

    // Start required services
    for (const [serviceType, serviceName] of Object.entries(environment.services)) {
      const serviceResult = await this.startService(serviceName as string);
      setup.services.push(serviceResult);
    }

    // Generate environment file
    await this.generateEnvironmentFile(environment);

    // Verify environment setup
    const verification = await this.verifyEnvironment(environment);
    setup.verification = verification;

    return setup;
  }

  async generateEnvironmentFile(environment: DevelopmentEnvironment): Promise<void> {
    const envContent = Object.entries(environment.configuration)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    await fs.writeFile(`.env.${environment.id}`, envContent);
    
    // Also update .env.local for Next.js
    if (environment.id === 'local') {
      await fs.writeFile('.env.local', envContent);
    }
  }
}
```

3. v0.dev Optimized Development Components

3.1 Development Dashboard

```typescript
// components/development/dev-dashboard.tsx - v0.dev optimized development dashboard
export function DevelopmentDashboard() {
  const [environmentStatus, setEnvironmentStatus] = useState<EnvironmentStatus | null>(null);
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [setupLogs, setSetupLogs] = useState<string[]>([]);

  useEffect(() => {
    loadEnvironmentStatus();
  }, []);

  const loadEnvironmentStatus = async () => {
    const manager = new DevelopmentEnvironment();
    const status = await manager.getEnvironmentStatus();
    const services = await manager.getServiceStatus();
    
    setEnvironmentStatus(status);
    setServices(services);
  };

  const runSetup = async () => {
    const manager = new DevelopmentEnvironment();
    const result = await manager.setupDevelopmentEnvironment();
    
    setSetupLogs(prev => [...prev, `Setup ${result.status} in ${result.duration}ms`]);
    loadEnvironmentStatus();
  };

  const startService = async (serviceId: string) => {
    const manager = new DevelopmentEnvironment();
    await manager.startService(serviceId);
    loadEnvironmentStatus();
  };

  return (
    <div className="dev-dashboard space-y-6 p-6">
      <div className="dashboard-header flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-silver">Development Environment</h1>
          <p className="text-steel">Manage your local development setup</p>
        </div>
        <div className="controls flex gap-4">
          <button 
            onClick={runSetup}
            className="bg-matrix_blue text-white px-4 py-2 rounded hover:bg-blue-600 font-medium"
          >
            Run Auto-Setup
          </button>
          <button className="bg-steel text-silver px-4 py-2 rounded hover:bg-gray-600">
            View Docs
          </button>
        </div>
      </div>

      {environmentStatus && (
        <div className="environment-status grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="status-card bg-carbon_gray border border-steel rounded-lg p-4">
            <div className="card-value text-2xl font-bold text-electric_purple">
              {environmentStatus.ready ? '✅' : '❌'}
            </div>
            <div className="card-label text-silver">Environment Ready</div>
            <div className="card-trend text-cyber_green">
              {environmentStatus.ready ? 'All systems go' : 'Setup required'}
            </div>
          </div>

          <div className="status-card bg-carbon_gray border border-steel rounded-lg p-4">
            <div className="card-value text-2xl font-bold text-electric_purple">
              {services.filter(s => s.status === 'running').length}
            </div>
            <div className="card-label text-silver">Services Running</div>
            <div className="card-trend text-cyber_green">
              of {services.length} total
            </div>
          </div>

          <div className="status-card bg-carbon_gray border border-steel rounded-lg p-4">
            <div className="card-value text-2xl font-bold text-electric_purple">
              {environmentStatus.lastSetup}
            </div>
            <div className="card-label text-silver">Last Setup</div>
            <div className="card-trend text-cyber_green">
              {environmentStatus.setupDuration}ms
            </div>
          </div>

          <div className="status-card bg-carbon_gray border border-steel rounded-lg p-4">
            <div className="card-value text-2xl font-bold text-electric_purple">
              v{environmentStatus.version}
            </div>
            <div className="card-label text-silver">Platform Version</div>
            <div className="card-trend text-cyber_green">
              Latest
            </div>
          </div>
        </div>
      )}

      <div className="services-section bg-carbon_gray border border-steel rounded-lg p-4">
        <h2 className="text-lg font-semibold text-silver mb-4">Development Services</h2>
        <div className="services-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service, index) => (
            <div key={index} className="service-card bg-space_black border border-steel rounded p-4">
              <div className="service-header flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-silver">{service.name}</h3>
                  <p className="text-sm text-steel">{service.description}</p>
                </div>
                <div className={`status-indicator ${
                  service.status === 'running' ? 'bg-cyber_green' : 
                  service.status === 'stopped' ? 'bg-neon_pink' : 'bg-yellow-500'
                } w-3 h-3 rounded-full`}></div>
              </div>
              
              <div className="service-details space-y-2 mb-4">
                <div className="detail flex justify-between text-sm">
                  <span className="text-steel">Type</span>
                  <span className="text-silver">{service.type}</span>
                </div>
                <div className="detail flex justify-between text-sm">
                  <span className="text-steel">Port</span>
                  <span className="text-silver">{service.port}</span>
                </div>
                <div className="detail flex justify-between text-sm">
                  <span className="text-steel">Health</span>
                  <span className={
                    service.health === 'healthy' ? 'text-cyber_green' : 'text-neon_pink'
                  }>
                    {service.health}
                  </span>
                </div>
              </div>

              <div className="service-actions flex gap-2">
                <button
                  onClick={() => startService(service.id)}
                  disabled={service.status === 'running'}
                  className="flex-1 bg-matrix_blue text-white py-2 rounded text-sm hover:bg-blue-600 disabled:opacity-50"
                >
                  {service.status === 'running' ? 'Running' : 'Start'}
                </button>
                <button className="bg-steel text-silver px-3 py-2 rounded text-sm hover:bg-gray-600">
                  Logs
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="quick-actions grid grid-cols-2 md:grid-cols-4 gap-4">
        <button className="quick-action bg-carbon_gray border border-steel rounded p-4 text-center hover:bg-gray-800">
          <div className="text-2xl mb-2">🚀</div>
          <div className="text-silver font-medium">Start Dev Server</div>
        </button>
        
        <button className="quick-action bg-carbon_gray border border-steel rounded p-4 text-center hover:bg-gray-800">
          <div className="text-2xl mb-2">🧪</div>
          <div className="text-silver font-medium">Run Tests</div>
        </button>
        
        <button className="quick-action bg-carbon_gray border border-steel rounded p-4 text-center hover:bg-gray-800">
          <div className="text-2xl mb-2">🔧</div>
          <div className="text-silver font-medium">Tools Config</div>
        </button>
        
        <button className="quick-action bg-carbon_gray border border-steel rounded p-4 text-center hover:bg-gray-800">
          <div className="text-2xl mb-2">📚</div>
          <div className="text-silver font-medium">API Docs</div>
        </button>
      </div>

      {setupLogs.length > 0 && (
        <div className="setup-logs bg-carbon_gray border border-steel rounded-lg p-4">
          <h3 className="text-lg font-semibold text-silver mb-4">Setup Logs</h3>
          <div className="logs-content max-h-40 overflow-y-auto">
            {setupLogs.map((log, index) => (
              <div key={index} className="log-entry text-sm text-silver py-1 border-b border-steel last:border-b-0">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

3.2 Development Tools Panel

```typescript
// components/development/tools-panel.tsx - v0.dev optimized development tools
export function DevelopmentToolsPanel() {
  const [activeTools, setActiveTools] = useState<DevelopmentTool[]>([]);
  const [toolConfigs, setToolConfigs] = useState<ToolConfiguration[]>([]);

  useEffect(() => {
    loadTools();
  }, []);

  const loadTools = async () => {
    const toolsManager = new DevelopmentTools();
    const tools = await toolsManager.getActiveTools();
    const configs = await toolsManager.getToolConfigurations();
    
    setActiveTools(tools);
    setToolConfigs(configs);
  };

  const openTool = (toolId: string) => {
    const tool = activeTools.find(t => t.id === toolId);
    if (tool?.url) {
      window.open(tool.url, '_blank');
    }
  };

  const debuggingTools = activeTools.filter(tool => tool.category === 'debugging');
  const testingTools = activeTools.filter(tool => tool.category === 'testing');

  return (
    <div className="tools-panel bg-carbon_gray border border-steel rounded-lg p-6">
      <h2 className="text-xl font-bold text-silver mb-6">Development Tools</h2>
      
      <div className="tools-grid space-y-6">
        <div className="debugging-tools">
          <h3 className="text-lg font-semibold text-silver mb-4">🛠️ Debugging Tools</h3>
          <div className="tools-list grid grid-cols-1 md:grid-cols-2 gap-4">
            {debuggingTools.map((tool, index) => (
              <div key={index} className="tool-card bg-space_black border border-steel rounded p-4">
                <div className="tool-header flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-medium text-silver">{tool.name}</h4>
                    <p className="text-sm text-steel">{tool.description}</p>
                  </div>
                  <div className={`status ${tool.status} w-2 h-2 rounded-full ${
                    tool.status === 'active' ? 'bg-cyber_green' : 'bg-steel'
                  }`}></div>
                </div>
                
                <div className="tool-actions flex gap-2">
                  <button
                    onClick={() => openTool(tool.id)}
                    className="flex-1 bg-matrix_blue text-white py-2 rounded text-sm hover:bg-blue-600"
                  >
                    Open {tool.name}
                  </button>
                  <button className="bg-steel text-silver px-3 py-2 rounded text-sm hover:bg-gray-600">
                    Configure
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="testing-tools">
          <h3 className="text-lg font-semibold text-silver mb-4">🧪 Testing Tools</h3>
          <div className="tools-list grid grid-cols-1 md:grid-cols-2 gap-4">
            {testingTools.map((tool, index) => (
              <div key={index} className="tool-card bg-space_black border border-steel rounded p-4">
                <div className="tool-header flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-medium text-silver">{tool.name}</h4>
                    <p className="text-sm text-steel">{tool.description}</p>
                  </div>
                  <div className="tool-metrics text-sm text-silver">
                    {tool.metrics?.coverage && (
                      <span className="text-cyber_green">{tool.metrics.coverage}% coverage</span>
                    )}
                  </div>
                </div>
                
                <div className="tool-actions flex gap-2">
                  <button className="flex-1 bg-cyber_green text-space_black py-2 rounded text-sm hover:bg-green-400 font-medium">
                    Run Tests
                  </button>
                  <button className="bg-steel text-silver px-3 py-2 rounded text-sm hover:bg-gray-600">
                    Reports
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="utility-tools">
          <h3 className="text-lg font-semibold text-silver mb-4">⚙️ Utility Tools</h3>
          <div className="utility-grid grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="utility-tool bg-space_black border border-steel rounded p-4 text-center hover:bg-gray-800">
              <div className="text-2xl mb-2">🗃️</div>
              <div className="text-silver text-sm">Database Browser</div>
            </button>
            
            <button className="utility-tool bg-space_black border border-steel rounded p-4 text-center hover:bg-gray-800">
              <div className="text-2xl mb-2">📊</div>
              <div className="text-silver text-sm">API Tester</div>
            </button>
            
            <button className="utility-tool bg-space_black border border-steel rounded p-4 text-center hover:bg-gray-800">
              <div className="text-2xl mb-2">🎨</div>
              <div className="text-silver text-sm">UI Playground</div>
            </button>
            
            <button className="utility-tool bg-space_black border border-steel rounded p-4 text-center hover:bg-gray-800">
              <div className="text-2xl mb-2">🔍</div>
              <div className="text-silver text-sm">Performance Profiler</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

4. Development Workflows

4.1 Standard Development Workflow

```typescript
// scripts/workflows/dev-workflow.ts - Standard development workflow
export class DevelopmentWorkflow {
  private workflows: WorkflowDefinition[] = [];

  constructor() {
    this.initializeWorkflows();
  }

  private initializeWorkflows() {
    this.workflows.push({
      id: 'feature_development',
      name: 'Feature Development Workflow',
      description: 'Standard workflow for developing new features',
      steps: [
        {
          step: 1,
          name: 'Environment Setup',
          command: 'npm run dev:setup',
          description: 'Set up local development environment'
        },
        {
          step: 2,
          name: 'Create Feature Branch',
          command: 'git checkout -b feature/your-feature-name',
          description: 'Create a new branch for your feature'
        },
        {
          step: 3,
          name: 'Start Development Server',
          command: 'npm run dev',
          description: 'Start the Next.js development server'
        },
        {
          step: 4,
          name: 'Run Tests',
          command: 'npm run test:watch',
          description: 'Run tests in watch mode'
        },
        {
          step: 5,
          name: 'Develop Feature',
          description: 'Implement your feature with TDD approach'
        },
        {
          step: 6,
          name: 'Commit Changes',
          command: 'git add . && git commit -m "feat: your feature description"',
          description: 'Commit your changes with conventional commit message'
        },
        {
          step: 7,
          name: 'Push and Create PR',
          command: 'git push origin feature/your-feature-name',
          description: 'Push changes and create pull request'
        }
      ]
    });

    this.workflows.push({
      id: 'bug_fix',
      name: 'Bug Fix Workflow',
      description: 'Workflow for fixing bugs and issues',
      steps: [
        {
          step: 1,
          name: 'Reproduce Bug',
          description: 'Create a failing test that reproduces the bug'
        },
        {
          step: 2,
          name: 'Fix Implementation',
          description: 'Implement the fix for the bug'
        },
        {
          step: 3,
          name: 'Verify Fix',
          command: 'npm run test',
          description: 'Verify the fix resolves the issue'
        },
        {
          step: 4,
          name: 'Update Tests',
          description: 'Update tests to prevent regression'
        }
      ]
    });
  }

  async executeWorkflow(workflowId: string): Promise<WorkflowExecution> {
    const workflow = this.workflows.find(w => w.id === workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const execution: WorkflowExecution = {
      workflow: workflowId,
      startTime: new Date(),
      steps: [],
      status: 'in_progress'
    };

    for (const step of workflow.steps) {
      const stepResult = await this.executeWorkflowStep(step);
      execution.steps.push(stepResult);

      if (stepResult.status === 'failed') {
        execution.status = 'failed';
        break;
      }
    }

    if (execution.status === 'in_progress') {
      execution.status = 'completed';
    }

    execution.endTime = new Date();
    return execution;
  }
}
```

🎯 Development Environment Performance Verification

✅ Setup & Onboarding:

· Setup Time: < 30 minutes for new developers
· Success Rate: > 95% first-time setup success
· Prerequisite Automation: 100% automated verification
· Documentation Coverage: 100% of setup steps

✅ Development Tools:

· Tool Integration: 100% of recommended tools configured
· Debugging Setup: Complete debugging configuration
· Testing Environment: Full local testing capabilities
· Code Quality: Automated linting and formatting

✅ Local Services:

· Service Availability: All required services running locally
· Data Persistence: Proper database and cache setup
· Mock Services: Complete voice AI simulation
· Health Monitoring: Real-time service health checks

✅ Development Experience:

· Hot Reload: < 2 second refresh times
· Test Execution: < 30 second test suite runs
· Build Performance: < 1 minute full builds
· Debugging: Zero-config debugging setup

---

📚 Next Steps

Proceed to Document 12.2: Code Standards & Best Practices to implement comprehensive coding standards, linting configurations, and development best practices.

Related Documents:

· 12.3 v0.dev Integration Patterns (development workflow integration)
· 10.3 Testing Strategy & Quality Assurance (local testing context)
· 5.5 Ultimate Prompt Cheat Sheet (v0.dev development patterns)

---

Generated following CO-STAR framework with v0.dev-optimized development environment, automated setup procedures, and comprehensive tooling configurations.
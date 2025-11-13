/**
 * App Shell Layout for Quantum Voice AI Platform
 * 
 * This is the main authenticated app layout used by all internal pages:
 * - Dashboard, Campaigns, Flows, Knowledge, Leads, Team, Settings, etc.
 * 
 * Features:
 * - Collapsible sidebar with primary navigation
 * - Top bar with account switcher and user menu
 * - Mission Control inspired design (SpaceX aesthetic)
 * - Responsive: sidebar collapses to icons on mobile
 * 
 * Usage:
 * ```tsx
 * import { AppShell } from '@/components/layout/AppShell';
 * 
 * export default function DashboardPage() {
 *   return (
 *     <AppShell>
 *       <div>Your page content</div>
 *     </AppShell>
 *   );
 * }
 * ```
 */

import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Radio,
  Workflow,
  Database,
  Users,
  UserCog,
  Settings,
  Menu,
  X,
  ChevronDown,
  Bell,
  HelpCircle,
  Rocket,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { signOut } from '@/lib/auth';

interface AppShellProps {
  children: React.ReactNode;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  section?: 'main' | 'settings';
}

const navigationItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    section: 'main',
  },
  {
    label: 'Campaigns',
    href: '/campaigns',
    icon: Rocket,
    section: 'main',
  },
  {
    label: 'Flows',
    href: '/flows',
    icon: Workflow,
    section: 'main',
  },
  {
    label: 'Knowledge',
    href: '/knowledge',
    icon: Database,
    section: 'main',
  },
  {
    label: 'Leads',
    href: '/leads',
    icon: Users,
    badge: '12',
    section: 'main',
  },
  {
    label: 'Team',
    href: '/team',
    icon: UserCog,
    section: 'settings',
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
    section: 'settings',
  },
];

export function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    } else {
      navigate("/login");
    }
  };

  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4">
          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden mr-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          {/* Desktop Sidebar Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex mr-2"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Logo */}
          <Link to="/dashboard" className="flex items-center space-x-2">
            <Radio className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg hidden sm:inline-block font-mono">
              QUANTUM VOICE
            </span>
          </Link>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Account Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 hidden sm:flex">
                <span className="text-sm font-medium">Acme Corp</span>
                <Badge variant="secondary" className="text-xs">Pro</Badge>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <div className="flex flex-col">
                  <span className="font-medium">Acme Corp</span>
                  <span className="text-xs text-muted-foreground">Pro Plan</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-muted-foreground">
                + Create workspace
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative ml-2">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
          </Button>

          {/* Help */}
          <Button variant="ghost" size="icon" className="ml-2">
            <HelpCircle className="h-5 w-5" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="ml-2 relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder.svg" alt="User" />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    JD
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-medium">John Doe</span>
                  <span className="text-xs text-muted-foreground">john@acme.com</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Billing</DropdownMenuItem>
              <DropdownMenuItem>Team</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside
          className={cn(
            'hidden md:block fixed left-0 top-14 z-40 h-[calc(100vh-3.5rem)] border-r border-border bg-card transition-all duration-300',
            sidebarOpen ? 'w-64' : 'w-16'
          )}
        >
          <nav className="flex flex-col gap-1 p-2 h-full">
            {/* Main Navigation */}
            <div className="flex-1 space-y-1">
              {navigationItems
                .filter(item => item.section === 'main')
                .map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent/50',
                        active
                          ? 'bg-accent text-accent-foreground glow-blue'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      {sidebarOpen && (
                        <>
                          <span className="flex-1">{item.label}</span>
                          {item.badge && (
                            <Badge variant="secondary" className="ml-auto">
                              {item.badge}
                            </Badge>
                          )}
                        </>
                      )}
                    </Link>
                  );
                })}
            </div>

            {/* Settings Navigation */}
            <div className="border-t border-border pt-2 space-y-1">
              {navigationItems
                .filter(item => item.section === 'settings')
                .map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent/50',
                        active
                          ? 'bg-accent text-accent-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      {sidebarOpen && <span className="flex-1">{item.label}</span>}
                    </Link>
                  );
                })}
            </div>
          </nav>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <aside className="fixed left-0 top-14 z-50 h-[calc(100vh-3.5rem)] w-64 border-r border-border bg-card md:hidden">
              <nav className="flex flex-col gap-1 p-2 h-full">
                <div className="flex-1 space-y-1">
                  {navigationItems
                    .filter(item => item.section === 'main')
                    .map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.href);
                      
                      return (
                        <Link
                          key={item.href}
                          to={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent/50',
                            active
                              ? 'bg-accent text-accent-foreground'
                              : 'text-muted-foreground hover:text-foreground'
                          )}
                        >
                          <Icon className="h-5 w-5 flex-shrink-0" />
                          <span className="flex-1">{item.label}</span>
                          {item.badge && (
                            <Badge variant="secondary">{item.badge}</Badge>
                          )}
                        </Link>
                      );
                    })}
                </div>

                <div className="border-t border-border pt-2 space-y-1">
                  {navigationItems
                    .filter(item => item.section === 'settings')
                    .map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.href);
                      
                      return (
                        <Link
                          key={item.href}
                          to={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent/50',
                            active
                              ? 'bg-accent text-accent-foreground'
                              : 'text-muted-foreground hover:text-foreground'
                          )}
                        >
                          <Icon className="h-5 w-5 flex-shrink-0" />
                          <span className="flex-1">{item.label}</span>
                        </Link>
                      );
                    })}
                </div>
              </nav>
            </aside>
          </>
        )}

        {/* Main Content */}
        <main
          className={cn(
            'flex-1 transition-all duration-300 w-full',
            sidebarOpen ? 'md:pl-64' : 'md:pl-16'
          )}
        >
          <div className="container mx-auto p-6 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

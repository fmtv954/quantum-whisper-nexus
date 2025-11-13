/**
 * Design System Showcase
 * 
 * Internal developer tool to showcase and test all design system components.
 * This page demonstrates the "Cyber Luxury" aesthetic with all tokens and components.
 * 
 * Path: /dev/design-system
 * 
 * NOTE: This page uses the AppShell layout. All future internal pages should
 * import and use AppShell the same way.
 */

import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MetricCard } from '@/components/ui/metric-card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Phone,
  Users,
  Target,
  DollarSign,
  Zap,
  Radio,
  Database,
} from 'lucide-react';
import { toast } from 'sonner';

export default function DevDesignSystem() {
  return (
    <AppShell>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-2 holographic-text">
            Quantum Voice AI Design System
          </h1>
          <p className="text-muted-foreground">
            Cyber Luxury design system showcase and component library
          </p>
        </div>

        {/* Color Palette */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Color Palette</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ColorSwatch
              name="Space Black"
              color="bg-background"
              hex="#000000"
            />
            <ColorSwatch
              name="Matrix Blue"
              color="bg-primary"
              hex="#00D4FF"
            />
            <ColorSwatch
              name="Cyber Green"
              color="bg-secondary"
              hex="#00FF88"
            />
            <ColorSwatch
              name="Electric Purple"
              color="bg-accent"
              hex="#8B5CF6"
            />
            <ColorSwatch
              name="Neon Pink"
              color="bg-destructive"
              hex="#FF0080"
            />
            <ColorSwatch
              name="Carbon Gray"
              color="bg-card"
              hex="#1A1A1A"
            />
            <ColorSwatch
              name="Steel"
              color="bg-muted"
              hex="#2D2D2D"
            />
            <ColorSwatch
              name="Silver"
              color="bg-silver"
              hex="#E5E5E5"
            />
          </div>
        </section>

        {/* Typography */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Typography</h2>
          <Card>
            <CardContent className="p-6 space-y-4">
              <div>
                <h1 className="text-4xl font-bold mb-2">Heading 1 - Inter Bold</h1>
                <p className="text-muted-foreground text-sm">text-4xl font-bold</p>
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-2">Heading 2 - Inter Bold</h2>
                <p className="text-muted-foreground text-sm">text-3xl font-bold</p>
              </div>
              <div>
                <h3 className="text-2xl font-semibold mb-2">Heading 3 - Inter Semibold</h3>
                <p className="text-muted-foreground text-sm">text-2xl font-semibold</p>
              </div>
              <div>
                <p className="text-base mb-2">Body text - Inter Regular</p>
                <p className="text-muted-foreground text-sm">text-base</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Caption text - Inter Regular</p>
                <p className="text-muted-foreground text-sm">text-sm text-muted-foreground</p>
              </div>
              <div>
                <code className="font-mono text-sm bg-muted px-2 py-1 rounded">
                  Monospace - JetBrains Mono
                </code>
                <p className="text-muted-foreground text-sm mt-2">font-mono text-sm</p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Buttons */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Buttons</h2>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium mb-3 text-muted-foreground">VARIANTS</h3>
                  <div className="flex flex-wrap gap-3">
                    <Button>Default</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="destructive">Destructive</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="link">Link</Button>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-3 text-muted-foreground">SIZES</h3>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button size="sm">Small</Button>
                    <Button size="default">Default</Button>
                    <Button size="lg">Large</Button>
                    <Button size="icon">
                      <Zap className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-3 text-muted-foreground">WITH ICONS</h3>
                  <div className="flex flex-wrap gap-3">
                    <Button>
                      <Phone className="mr-2 h-4 w-4" />
                      Start Call
                    </Button>
                    <Button variant="secondary">
                      <Users className="mr-2 h-4 w-4" />
                      View Leads
                    </Button>
                    <Button variant="outline">
                      <Radio className="mr-2 h-4 w-4" />
                      Test Campaign
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-3 text-muted-foreground">STATES</h3>
                  <div className="flex flex-wrap gap-3">
                    <Button disabled>Disabled</Button>
                    <Button className="glow-blue">With Glow Effect</Button>
                    <Button
                      onClick={() =>
                        toast.success('Button clicked!', {
                          description: 'This is a toast notification',
                        })
                      }
                    >
                      Show Toast
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Metric Cards */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Metric Cards (Dashboard KPIs)</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Active Calls"
              value="24"
              icon={<Phone className="h-5 w-5" />}
              trend={{ value: 12, isPositive: true }}
              status="success"
            />
            <MetricCard
              label="Total Leads"
              value="847"
              icon={<Users className="h-5 w-5" />}
              trend={{ value: 8, isPositive: true }}
              subtitle="This month"
            />
            <MetricCard
              label="Conversion Rate"
              value="68%"
              icon={<Target className="h-5 w-5" />}
              trend={{ value: 5, isPositive: false }}
              status="warning"
            />
            <MetricCard
              label="Cost / Lead"
              value="$2.34"
              icon={<DollarSign className="h-5 w-5" />}
              trend={{ value: 15, isPositive: true }}
              subtitle="80% below target"
            />
          </div>
        </section>

        {/* Form Elements */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Form Elements</h2>
          <Card>
            <CardContent className="p-6">
              <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                <div className="space-y-2">
                  <Label htmlFor="campaign-name">Campaign Name</Label>
                  <Input
                    id="campaign-name"
                    placeholder="e.g., Real Estate Lead Gen 2024"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your AI voice campaign..."
                    rows={4}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch id="active" />
                  <Label htmlFor="active">Active Campaign</Label>
                </div>

                <div className="flex gap-3">
                  <Button type="submit">Save Campaign</Button>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </section>

        {/* Badges */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Badges</h2>
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-3">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="destructive">Destructive</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge className="bg-secondary/10 text-secondary border-secondary">
                  Active
                </Badge>
                <Badge className="bg-accent/10 text-accent border-accent">
                  Draft
                </Badge>
                <Badge className="bg-destructive/10 text-destructive border-destructive">
                  Failed
                </Badge>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Cards */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Cards</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Standard Card</CardTitle>
                <CardDescription>
                  This is a standard card with header and content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Cards are used throughout the app for grouping related content.
                  They have a carbon gray background with subtle borders.
                </p>
              </CardContent>
            </Card>

            <Card className="glow-blue">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Radio className="h-5 w-5" />
                  Card with Glow Effect
                </CardTitle>
                <CardDescription>
                  Cards can have holographic glow effects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Add the <code className="font-mono text-xs">glow-blue</code>,{' '}
                  <code className="font-mono text-xs">glow-green</code>, or{' '}
                  <code className="font-mono text-xs">glow-purple</code> class
                  for glowing effects.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Tabs */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Tabs</h2>
          <Card>
            <CardContent className="p-6">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="space-y-4">
                  <h3 className="text-lg font-semibold">Overview Tab</h3>
                  <p className="text-muted-foreground">
                    This is the overview tab content. Tabs are useful for organizing
                    related content sections.
                  </p>
                </TabsContent>
                <TabsContent value="analytics" className="space-y-4">
                  <h3 className="text-lg font-semibold">Analytics Tab</h3>
                  <p className="text-muted-foreground">
                    Analytics and metrics would be displayed here.
                  </p>
                </TabsContent>
                <TabsContent value="settings" className="space-y-4">
                  <h3 className="text-lg font-semibold">Settings Tab</h3>
                  <p className="text-muted-foreground">
                    Configuration options would be shown in this tab.
                  </p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </section>

        {/* Tables */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Data Tables</h2>
          <Card>
            <CardHeader>
              <CardTitle>Recent Campaigns</CardTitle>
              <CardDescription>
                Example data table with campaign information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Calls</TableHead>
                    <TableHead>Leads</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">
                      Real Estate Q1 2024
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-secondary/10 text-secondary border-secondary">
                        Active
                      </Badge>
                    </TableCell>
                    <TableCell>1,234</TableCell>
                    <TableCell>456</TableCell>
                    <TableCell className="text-right">$1,068.96</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">
                      Solar Panel Leads
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-accent/10 text-accent border-accent">
                        Draft
                      </Badge>
                    </TableCell>
                    <TableCell>0</TableCell>
                    <TableCell>0</TableCell>
                    <TableCell className="text-right">$0.00</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">
                      Insurance Follow-up
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-secondary/10 text-secondary border-secondary">
                        Active
                      </Badge>
                    </TableCell>
                    <TableCell>892</TableCell>
                    <TableCell>234</TableCell>
                    <TableCell className="text-right">$547.68</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>

        {/* Effects Showcase */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Special Effects</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="cyber-grid">
              <CardHeader>
                <CardTitle>Cyber Grid Background</CardTitle>
                <CardDescription>
                  Class: <code className="font-mono">cyber-grid</code>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Animated grid pattern inspired by SpaceX mission control displays.
                </p>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle>Glass Morphism</CardTitle>
                <CardDescription>
                  Class: <code className="font-mono">glass</code>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Frosted glass effect with backdrop blur for modern UI elements.
                </p>
              </CardContent>
            </Card>

            <Card className="border-pulse">
              <CardHeader>
                <CardTitle>Pulsing Border</CardTitle>
                <CardDescription>
                  Class: <code className="font-mono">border-pulse</code>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Subtle border animation for active or loading states.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="holographic-text">
                  Holographic Text
                </CardTitle>
                <CardDescription>
                  Class: <code className="font-mono">holographic-text</code>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Animated gradient text effect for headings and emphasis.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Layout Patterns */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Layout Patterns</h2>
          <Card>
            <CardHeader>
              <CardTitle>Mission Control (Current Layout)</CardTitle>
              <CardDescription>
                The AppShell component you're viewing now
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Structure:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Sticky top bar with workspace switcher and user menu</li>
                  <li>Collapsible sidebar with icon + text navigation</li>
                  <li>Main content area with max-width container</li>
                  <li>Responsive: sidebar becomes overlay on mobile</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Usage:</h3>
                <pre className="bg-muted p-4 rounded-lg text-sm font-mono overflow-x-auto">
                  {`import { AppShell } from '@/components/layout/AppShell';

export default function YourPage() {
  return (
    <AppShell>
      <div>Your content here</div>
    </AppShell>
  );
}`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Component Library Info */}
        <section>
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Component Library Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Core UI Components:</h3>
                <code className="block bg-muted p-2 rounded text-sm font-mono">
                  src/components/ui/
                </code>
                <p className="text-sm text-muted-foreground mt-2">
                  Button, Card, Input, Badge, Switch, Tabs, Table, etc.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Layout Components:</h3>
                <code className="block bg-muted p-2 rounded text-sm font-mono">
                  src/components/layout/
                </code>
                <p className="text-sm text-muted-foreground mt-2">
                  AppShell and future layout patterns
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Custom Components:</h3>
                <code className="block bg-muted p-2 rounded text-sm font-mono">
                  src/components/ui/metric-card.tsx
                </code>
                <p className="text-sm text-muted-foreground mt-2">
                  MetricCard and other domain-specific components
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}

// Helper component for color swatches
function ColorSwatch({
  name,
  color,
  hex,
}: {
  name: string;
  color: string;
  hex: string;
}) {
  return (
    <div className="space-y-2">
      <div className={`h-24 rounded-lg border border-border ${color}`} />
      <div>
        <p className="font-medium text-sm">{name}</p>
        <p className="text-xs text-muted-foreground font-mono">{hex}</p>
      </div>
    </div>
  );
}

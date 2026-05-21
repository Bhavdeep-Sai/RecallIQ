import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bell,
  BrainCircuit,
  LayoutDashboard,
  MessagesSquare,
  Sparkles,
  Users,
} from "lucide-react";

export interface NavigationItem {
  label: string;
  href: string;
  description: string;
  icon: LucideIcon;
}

export const navigationItems: NavigationItem[] = [
  {
    label: "Overview",
    href: "/",
    description: "Sales intelligence snapshot",
    icon: LayoutDashboard,
  },
  {
    label: "Customers",
    href: "/customers",
    description: "Accounts, health, and forecasts",
    icon: Users,
  },
  {
    label: "Conversations",
    href: "/conversations",
    description: "Calls, emails, and context",
    icon: MessagesSquare,
  },
  {
    label: "AI Memory",
    href: "/ai-memory",
    description: "Persistent hindsight memory",
    icon: BrainCircuit,
  },
  {
    label: "Runtime Intelligence",
    href: "/runtime-intelligence",
    description: "Model routing and guardrails",
    icon: Sparkles,
  },
  {
    label: "Analytics",
    href: "/analytics",
    description: "Revenue, adoption, and usage",
    icon: BarChart3,
  },
  {
    label: "Notifications",
    href: "/notifications",
    description: "Alerts, follow-ups, and activity",
    icon: Bell,
  },
];
import { useState } from 'react';
import { 
  Home, 
  TrendingUp, 
  BarChart3, 
  Users, 
  Settings, 
  Wallet,
  Plus,
  Eye
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/useAuth';

const traderNavItems = [
  { title: 'Dashboard', url: '/', icon: Home },
  { title: 'Trade Journal', url: '/trades', icon: TrendingUp },
  { title: 'Analytics', url: '/analytics', icon: BarChart3 },
  { title: 'Investors', url: '/investors', icon: Users },
  { title: 'Settings', url: '/settings', icon: Settings },
];

const investorNavItems = [
  { title: 'Dashboard', url: '/', icon: Home },
  { title: 'Trader Trades', url: '/trades', icon: Eye },
  { title: 'Analytics', url: '/analytics', icon: BarChart3 },
  { title: 'Settings', url: '/settings', icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { profile, isTrader } = useAuth();
  
  const collapsed = state === 'collapsed';
  const navItems = isTrader ? traderNavItems : investorNavItems;
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    if (path === '/') return currentPath === '/';
    return currentPath.startsWith(path);
  };

  const getNavClassName = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? 'bg-primary/20 text-primary border-r-2 border-primary' 
      : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground';

  return (
    <Sidebar className={collapsed ? 'w-16' : 'w-64'}>
      <SidebarContent className="bg-sidebar">
        {/* Header */}
        <div className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-primary/20 rounded-xl">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            {!collapsed && (
              <div>
                <h2 className="font-bold text-sm text-gradient-primary">CryptoFlow</h2>
                <p className="text-xs text-muted-foreground">
                  {isTrader ? 'Trader' : 'Investor'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end={item.url === '/'}
                      className={getNavClassName}
                    >
                      <item.icon className={`${collapsed ? 'w-5 h-5' : 'w-4 h-4'}`} />
                      {!collapsed && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Quick Actions */}
        {isTrader && (
          <SidebarGroup>
            <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/trades/new" className="text-success hover:bg-success/10">
                      <Plus className={`${collapsed ? 'w-5 h-5' : 'w-4 h-4'}`} />
                      {!collapsed && <span className="text-sm">Add Trade</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Profile Section */}
        <div className="mt-auto p-4">
          {!collapsed && profile && (
            <div className="crypto-card p-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-primary">
                    {profile.username.slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{profile.username}</div>
                  <div className="text-xs text-muted-foreground">{profile.email}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
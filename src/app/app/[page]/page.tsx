'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import OverviewView from '@/views/Overview';
import { LeadsView } from '@/views/Leads';
import { CustomersView } from '@/views/Customers';
import { TasksView, RemindersView, NotesView } from '@/views/Work';
import CalendarView from '@/views/Calendar';
import MarketingView from '@/views/Marketing';
import { TelecallingView } from '@/views/Telecalling';
import EmployeesView from '@/views/Employees';
import ChatView from '@/views/Chat';
import { AIAssistantView } from '@/views/AI';
import ReportsView from '@/views/Reports';
import IntegrationsView from '@/views/Integrations';
import SupportView from '@/views/Support';
import SettingsView, { WhiteLabelView, SubscriptionView } from '@/views/Settings';
import { useStore } from '@/lib/store';

interface PageProps {
  params: {
    page: string;
  };
}

// Pages only Admins can access
const ADMIN_ONLY_PAGES = [
  'overview',
  'customers',
  'marketing',
  'employees',
  'ai-assistant',
  'reports',
  'integrations',
  'support',
  'subscription',
  'settings',
  'white-label',
];

const DEVELOPER_ONLY_PAGES = ['integrations', 'white-label'];

function RoleGuard({ page, children }: { page: string; children: React.ReactNode }) {
  const { state } = useStore();
  const router = useRouter();
  const role = state.session?.role;

  useEffect(() => {
    if (role && role !== 'Developer' && DEVELOPER_ONLY_PAGES.includes(page)) {
      router.replace(role === 'Caller' ? '/app/leads' : '/app/overview');
    } else if (role && role !== 'Admin' && role !== 'Developer' && ADMIN_ONLY_PAGES.includes(page)) {
      router.replace('/app/leads');
    }
  }, [role, page, router]);

  if (role && role !== 'Developer' && DEVELOPER_ONLY_PAGES.includes(page)) {
    return null;
  }
  if (role && role !== 'Admin' && role !== 'Developer' && ADMIN_ONLY_PAGES.includes(page)) {
    return null;
  }

  return <>{children}</>;
}

export default function DynamicAppPage({ params }: PageProps) {
  const page = params.page;

  let content: React.ReactNode;

  switch (page) {
    case 'overview':
      content = <OverviewView />;
      break;
    case 'leads':
      content = <LeadsView />;
      break;
    case 'customers':
      content = <CustomersView />;
      break;
    case 'tasks':
      content = <TasksView />;
      break;
    case 'calendar':
      content = <CalendarView />;
      break;
    case 'reminders':
      content = <RemindersView />;
      break;
    case 'marketing':
      content = <MarketingView />;
      break;
    case 'telecalling':
      content = <TelecallingView />;
      break;
    case 'employees':
      content = <EmployeesView />;
      break;
    case 'chat':
      content = <ChatView />;
      break;
    case 'notes':
      content = <NotesView />;
      break;
    case 'ai-assistant':
      content = <AIAssistantView />;
      break;
    case 'reports':
      content = <ReportsView />;
      break;
    case 'integrations':
      content = <IntegrationsView />;
      break;
    case 'support':
      content = <SupportView />;
      break;
    case 'subscription':
      content = <SubscriptionView />;
      break;
    case 'settings':
      content = <SettingsView />;
      break;
    case 'white-label':
      content = <WhiteLabelView />;
      break;
    default:
      content = <LeadsView />;
  }

  return <RoleGuard page={page}>{content}</RoleGuard>;
}

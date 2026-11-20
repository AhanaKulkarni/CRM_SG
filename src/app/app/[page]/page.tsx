'use client';

import React from 'react';
import { notFound } from 'next/navigation';

import OverviewView from '@/views/Overview';
import { LeadsView } from '@/views/Leads';
import { CustomersView } from '@/views/Customers';
import { TasksView, RemindersView, NotesView } from '@/views/Work';
import CalendarView from '@/views/Calendar';
import MarketingView from '@/views/Marketing';
import { TelecallingView } from '@/views/Telecalling';
import EmployeesView from '@/views/Employees';
import ChatView from '@/views/Chat';
import InvoicesView from '@/views/Invoices';
import {
  AIAssistantView,
  AICallingView,
  AIChatbotView,
  AutomationView,
} from '@/views/AI';
import ReportsView from '@/views/Reports';
import IntegrationsView from '@/views/Integrations';
import SupportView from '@/views/Support';
import SettingsView, { WhiteLabelView, SubscriptionView } from '@/views/Settings';

interface PageProps {
  params: {
    page: string;
  };
}

export default function DynamicAppPage({ params }: PageProps) {
  const page = params.page;

  switch (page) {
    case 'overview':
      return <OverviewView />;
    case 'leads':
      return <LeadsView />;
    case 'customers':
      return <CustomersView />;
    case 'tasks':
      return <TasksView />;
    case 'calendar':
      return <CalendarView />;
    case 'reminders':
      return <RemindersView />;
    case 'marketing':
      return <MarketingView />;
    case 'telecalling':
      return <TelecallingView />;
    case 'employees':
      return <EmployeesView />;
    case 'chat':
      return <ChatView />;
    case 'notes':
      return <NotesView />;
    case 'invoices':
      return <InvoicesView />;
    case 'ai-assistant':
      return <AIAssistantView />;
    case 'ai-calling':
      return <AICallingView />;
    case 'ai-chatbot':
      return <AIChatbotView />;
    case 'automation':
      return <AutomationView />;
    case 'reports':
      return <ReportsView />;
    case 'integrations':
      return <IntegrationsView />;
    case 'support':
      return <SupportView />;
    case 'subscription':
      return <SubscriptionView />;
    case 'settings':
      return <SettingsView />;
    case 'white-label':
      return <WhiteLabelView />;
    default:
      return <OverviewView />;
  }
}

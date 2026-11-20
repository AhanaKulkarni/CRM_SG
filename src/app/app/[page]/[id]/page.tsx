'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { LeadDetailView } from '@/views/Leads';
import { CustomerDetailView } from '@/views/Customers';

interface DetailPageProps {
  params: {
    page: string;
    id: string;
  };
}

export default function DynamicDetailAppPage({ params }: DetailPageProps) {
  const { page, id } = params;

  if (page === 'leads') {
    return <LeadDetailView leadId={id} />;
  }

  if (page === 'customers') {
    return <CustomerDetailView customerId={id} />;
  }

  return (
    <div className="p-8 text-center text-slate-500">
      <p>Unknown entity detail view: {page}/{id}</p>
    </div>
  );
}

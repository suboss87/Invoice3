import { DocumentStatus } from '@/lib/types';
import { CheckCircle, Clock, AlertTriangle, FileCheck, FileX } from 'lucide-react';
import React from 'react';

export const getStatusIcon = (status: DocumentStatus): React.ReactElement => {
  switch (status) {
    case 'approved':
      return React.createElement(CheckCircle, { className: "h-3 w-3" });
    case 'needs_review':
    case 'high_risk':
      return React.createElement(AlertTriangle, { className: "h-3 w-3" });
    case 'reviewed':
      return React.createElement(FileCheck, { className: "h-3 w-3" });
    case 'in_progress':
    case 'pending':
      return React.createElement(Clock, { className: "h-3 w-3" });
    case 'expired':
      return React.createElement(FileX, { className: "h-3 w-3" });
    default:
      return React.createElement(Clock, { className: "h-3 w-3" });
  }
};

export const getStatusBadgeClasses = (status: DocumentStatus): string => {
  switch (status) {
    case 'approved':
    case 'active':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'needs_review':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'high_risk':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'reviewed':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'in_progress':
    case 'pending':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'expired':
      return 'bg-red-50 text-red-700 border-red-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

export const getStatusLabel = (status: DocumentStatus): string => {
  switch (status) {
    case 'draft':
      return 'Draft';
    case 'needs_review':
      return 'Needs Review';
    case 'in_progress':
      return 'In Progress';
    case 'reviewed':
      return 'Reviewed';
    case 'high_risk':
      return 'High Risk';
    case 'approved':
      return 'Approved';
    case 'active':
      return 'Active';
    case 'pending':
      return 'Pending';
    case 'expired':
      return 'Expired';
    default:
      return status;
  }
};

export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

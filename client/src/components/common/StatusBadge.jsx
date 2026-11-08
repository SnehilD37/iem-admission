import React from 'react';
import { 
  FileEdit, 
  Send, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  GraduationCap, 
  Award, 
  Hourglass, 
  XCircle 
} from 'lucide-react';

export const StatusBadge = ({ status }) => {
  switch (status) {
    case 'DRAFT':
      return (
        <span className="badge badge-draft">
          <FileEdit size={12} /> Draft
        </span>
      );
    case 'SUBMITTED':
      return (
        <span className="badge badge-submitted">
          <Send size={12} /> Submitted
        </span>
      );
    case 'UNDER_REVIEW':
      return (
        <span className="badge badge-under-review">
          <Clock size={12} /> Under Review
        </span>
      );
    case 'ACTION_REQUIRED':
      return (
        <span className="badge badge-action-required">
          <AlertTriangle size={12} /> Query Pending
        </span>
      );
    case 'VERIFIED_ELIGIBLE':
      return (
        <span className="badge badge-verified-eligible">
          <CheckCircle2 size={12} /> Verified Eligible
        </span>
      );
    case 'SEAT_OFFERED':
      return (
        <span className="badge badge-seat-offered">
          <GraduationCap size={12} /> Seat Offered
        </span>
      );
    case 'ADMISSION_CONFIRMED':
      return (
        <span className="badge badge-admission-confirmed">
          <Award size={12} /> Enrolled 🎓
        </span>
      );
    case 'WAITLISTED':
      return (
        <span className="badge badge-waitlisted">
          <Hourglass size={12} /> Waitlisted
        </span>
      );
    case 'REJECTED':
      return (
        <span className="badge badge-rejected">
          <XCircle size={12} /> Ineligible
        </span>
      );
    default:
      return (
        <span className="badge badge-draft">
          {status || 'Unknown'}
        </span>
      );
  }
};

export default StatusBadge;

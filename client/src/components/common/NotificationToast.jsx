import React from 'react';
import { useApplication } from '../../context/ApplicationContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const NotificationToast = () => {
  const { notification, showNotification } = useApplication();

  if (!notification) return null;

  const isSuccess = notification.type === 'success';
  const isError = notification.type === 'error';

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 18px',
        borderRadius: '8px',
        backgroundColor: '#0F172A',
        color: '#FFFFFF',
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
        border: isSuccess ? '1px solid #10B981' : isError ? '1px solid #EF4444' : '1px solid #3B82F6',
        maxWidth: '420px',
        animation: 'slideUp 200ms ease-out'
      }}
    >
      {isSuccess && <CheckCircle2 size={20} color="#10B981" />}
      {isError && <AlertCircle size={20} color="#EF4444" />}
      {!isSuccess && !isError && <Info size={20} color="#3B82F6" />}
      
      <span style={{ fontSize: '0.875rem', lineHeight: 1.4, flex: 1 }}>
        {notification.message}
      </span>

      <button 
        onClick={() => showNotification(null)}
        style={{ color: '#94A3B8', padding: '2px', display: 'flex' }}
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default NotificationToast;

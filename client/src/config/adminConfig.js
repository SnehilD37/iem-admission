/**
 * Fixed list of Gmail / institutional email addresses authorized to access the Admin Portal.
 * You can also supply additional comma-separated emails via VITE_ADMIN_EMAILS in Vercel / .env.
 */
export const FIXED_ADMIN_EMAILS = [
  'snehillab@gmail.com',
  'symandas970@gmail.com',
  'dassnehil324@gmail.com'
];

const parseEnvEmails = () => {
  const raw = import.meta.env.VITE_ADMIN_EMAILS || '';
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
};

export const getAllowedAdminEmails = () => {
  const set = new Set([
    ...FIXED_ADMIN_EMAILS.map((e) => e.trim().toLowerCase()),
    ...parseEnvEmails()
  ]);
  return Array.from(set);
};

export const isAuthorizedAdmin = (email) => {
  if (!email || typeof email !== 'string') return false;
  const normalized = email.trim().toLowerCase();
  return getAllowedAdminEmails().includes(normalized);
};


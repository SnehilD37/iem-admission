/**
 * Fixed list of Gmail / institutional email addresses authorized to access the Admin APIs.
 * Additional comma-separated emails can be set via ADMIN_EMAILS in Render / .env.
 */
export const FIXED_ADMIN_EMAILS = [
  'snehillab@gmail.com',
  'symandas970@gmail.com',
  'dassnehil324@gmail.com'
];

export const getAllowedAdminEmails = () => {
  const raw = process.env.ADMIN_EMAILS || '';
  const envEmails = raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  return Array.from(
    new Set([
      ...FIXED_ADMIN_EMAILS.map((e) => e.trim().toLowerCase()),
      ...envEmails
    ])
  );
};

export const isAuthorizedAdmin = (email) => {
  if (!email || typeof email !== 'string') return false;
  const normalized = email.trim().toLowerCase();
  return getAllowedAdminEmails().includes(normalized);
};


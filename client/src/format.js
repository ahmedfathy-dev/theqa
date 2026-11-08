const parseDate = (value) => {
  if (!value) return null;

  const dateOnly = typeof value === 'string' && /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const date = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(value);

  if (Number.isNaN(date.getTime())) return null;
  if (
    dateOnly &&
    (date.getFullYear() !== Number(dateOnly[1]) ||
      date.getMonth() !== Number(dateOnly[2]) - 1 ||
      date.getDate() !== Number(dateOnly[3]))
  ) return null;

  return date;
};

const formatDate = (value, options) => {
  const date = parseDate(value);
  return date ? new Intl.DateTimeFormat('ar-EG', options).format(date) : '—';
};

export const fmtDate = (d) =>
  formatDate(d, { day: 'numeric', month: 'long', year: 'numeric' });
export const fmtShort = (d) => formatDate(d, { day: 'numeric', month: 'short' });
export const fmtTime = (d) =>
  d ? formatDate(d, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
export const STATUS = { done: 'تم', current: 'جاري', next: 'قادم' };
export const STATUS_TONE = { done: 'green', current: 'blue', next: 'gray' };
export const KIND = { decision: 'قرار', content: 'محتوى', approval: 'اعتماد' };
export const NOTIF_TYPE = { update: 'تحديث', reply: 'رد', request: 'طلب', phase: 'مرحلة', file: 'ملف' };

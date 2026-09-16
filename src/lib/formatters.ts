import * as XLSX from 'xlsx';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: Date | string | null | undefined): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function getFollowUpStatus(dateStr: Date | string): {
  status: 'overdue' | 'today' | 'upcoming';
  label: string;
  diffDays: number;
} {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      status: 'overdue',
      label: `${Math.abs(diffDays)} gün gecikti`,
      diffDays,
    };
  } else if (diffDays === 0) {
    return {
      status: 'today',
      label: 'Bugün!',
      diffDays,
    };
  } else {
    return {
      status: 'upcoming',
      label: `${diffDays} gün sonra`,
      diffDays,
    };
  }
}

export function exportToExcel(data: Record<string, any>[], filename: string) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Rapor');
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function exportToCsv(data: Record<string, any>[], filename: string) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function toTurkishUpper(str: string | null | undefined): string {
  if (!str) return '';
  return str.toLocaleUpperCase('tr-TR');
}

export function toCleanEmail(email: string | null | undefined): string {
  if (!email) return '';
  return email.trim().toLowerCase();
}


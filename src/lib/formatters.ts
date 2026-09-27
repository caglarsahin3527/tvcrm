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

/**
 * Kullanıcı girdisini canlı olarak temizler ve "05XX XXX XX XX" formatına dönüştürür.
 * Harf, sembol vb. karakterleri filtreler.
 */
export function formatPhoneInput(value: string | null | undefined): string {
  if (!value) return '';
  // Sadece rakamları al
  let digits = value.replace(/\D/g, '');
  if (!digits) return '';

  // Eğer kullanıcı '905...' veya '+905...' girmişse baştaki 90'ı kaldır
  if (digits.startsWith('90') && digits.length > 10) {
    digits = digits.substring(2);
  }

  // Türkiye numaralarında kullanıcı '5...' ile başlarsa başına 0 ekle
  if (digits.length > 0 && !digits.startsWith('0')) {
    digits = '0' + digits;
  }

  // Maksimum 11 hane (0XXX XXX XX XX)
  digits = digits.slice(0, 11);

  // Parçaları biçimlendir: 0XXX XXX XX XX
  const part1 = digits.slice(0, 4); // 05XX
  const part2 = digits.slice(4, 7); // XXX
  const part3 = digits.slice(7, 9); // XX
  const part4 = digits.slice(9, 11); // XX

  let formatted = part1;
  if (part2) formatted += ' ' + part2;
  if (part3) formatted += ' ' + part3;
  if (part4) formatted += ' ' + part4;

  return formatted;
}

/**
 * Telefon numarasının geçerli Türkiye formatında (11 haneli 05XX... veya sabit hat) olup olmadığını doğrular.
 */
export function isValidPhone(phone: string | null | undefined): boolean {
  if (!phone) return false;
  const digits = phone.replace(/\D/g, '');
  
  // 11 haneli ve 0 ile başlıyor (05XX, 02XX, 03XX, 04XX, 0850)
  if (digits.length === 11 && digits.startsWith('0')) {
    return /^0[2-9]\d{9}$/.test(digits);
  }
  // 10 haneli (5XX, 2XX, 850...)
  if (digits.length === 10) {
    return /^[2-9]\d{9}$/.test(digits);
  }
  // 12 haneli (905XX...)
  if (digits.length === 12 && digits.startsWith('90')) {
    return /^90[2-9]\d{9}$/.test(digits);
  }

  return false;
}

/**
 * WhatsApp'ın şart koştuğu 12 haneli uluslararası formata dönüştürür (905XXXXXXXXX).
 * Başında '+' veya '0' bulunmaz, boşluk/tire içermez.
 */
export function getWhatsAppNumber(phone: string | null | undefined): string {
  if (!phone) return '';
  let digits = phone.replace(/\D/g, '');
  if (!digits) return '';

  if (digits.length === 11 && digits.startsWith('0')) {
    digits = '90' + digits.substring(1);
  } else if (digits.length === 10) {
    digits = '90' + digits;
  } else if (digits.length === 12 && digits.startsWith('90')) {
    // zaten 90 ile başlıyor
  }
  return digits;
}

/**
 * WhatsApp doğrudan sohbet linki üretir (https://wa.me/905XXXXXXXXX).
 */
export function getWhatsAppUrl(phone: string | null | undefined, message?: string): string {
  const waNumber = getWhatsAppNumber(phone);
  if (!waNumber) return '#';
  const url = `https://wa.me/${waNumber}`;
  if (message) {
    return `${url}?text=${encodeURIComponent(message)}`;
  }
  return url;
}



// Money helpers — all amounts in the DB are integer PAISE (₹1 = 100p).

export function rupees(paise: number): string {
  const v = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 2,
  }).format(v);
}

export function rupeesPlain(paise: number): string {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(paise / 100);
}

export function toPaise(rupees: number | string): number {
  const n = typeof rupees === 'string' ? parseFloat(rupees.replace(/,/g, '')) : rupees;
  if (Number.isNaN(n)) return 0;
  return Math.round(n * 100);
}

export function fromPaise(paise: number): number {
  return paise / 100;
}

export function numberToWordsINR(paise: number): string {
  const n = Math.floor(paise / 100);
  if (n === 0) return 'Zero Rupees Only';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const two = (x: number): string => (x < 20 ? ones[x] : `${tens[Math.floor(x / 10)]}${x % 10 ? ' ' + ones[x % 10] : ''}`);
  const three = (x: number): string => {
    const h = Math.floor(x / 100), r = x % 100;
    return `${h ? ones[h] + ' Hundred' : ''}${h && r ? ' ' : ''}${r ? two(r) : ''}`;
  };
  const parts: string[] = [];
  const crore = Math.floor(n / 10000000); const rest = n % 10000000;
  const lakh = Math.floor(rest / 100000); const rest2 = rest % 100000;
  const thousand = Math.floor(rest2 / 1000); const hundred = rest2 % 1000;
  if (crore) parts.push(`${three(crore)} Crore`);
  if (lakh) parts.push(`${two(lakh)} Lakh`);
  if (thousand) parts.push(`${two(thousand)} Thousand`);
  if (hundred) parts.push(three(hundred));
  return `${parts.join(' ')} Rupees Only`;
}

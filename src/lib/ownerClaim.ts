export interface ParsedOwnerClaim {
  role: string | null;
  officialInstagram: string | null;
  pcPrice: string | null;
  psPrice: string | null;
  hours: string | null;
  note: string | null;
}

const PREFIX = '[STRUKTURLAŞDIRILMIŞ KLUB SAHİBİ MƏLUMATI]';

export function parseOwnerClaimMessage(message: string): ParsedOwnerClaim | null {
  if (!message.startsWith(PREFIX)) return null;

  const result: ParsedOwnerClaim = {
    role: null,
    officialInstagram: null,
    pcPrice: null,
    psPrice: null,
    hours: null,
    note: null,
  };

  for (const line of message.split('\n').slice(1)) {
    const [label, ...rest] = line.split(':');
    const value = rest.join(':').trim();
    if (!value) continue;

    switch (label.trim()) {
      case 'Klubla əlaqə':
        result.role = value;
        break;
      case 'Rəsmi Instagram':
        result.officialInstagram = value;
        break;
      case 'PC qiyməti':
        result.pcPrice = value;
        break;
      case 'PlayStation qiyməti':
        result.psPrice = value;
        break;
      case 'İş saatları':
        result.hours = value;
        break;
      case 'Əlavə qeyd':
        result.note = value;
        break;
      default:
        break;
    }
  }

  return result;
}

import type {ReactNode} from 'react';

export type TransactionIconName =
  | 'arrow'
  | 'back'
  | 'building'
  | 'calendar'
  | 'check'
  | 'chevron'
  | 'document'
  | 'home'
  | 'lock'
  | 'message'
  | 'pin'
  | 'report'
  | 'shield'
  | 'sparkle'
  | 'wallet';

export function TransactionIcon({name}: {name: TransactionIconName}) {
  const path: Record<TransactionIconName, ReactNode> = {
    arrow: <><path d="M5 12h14" /><path d="m14 7 5 5-5 5" /></>,
    back: <><path d="m10 7-5 5 5 5" /><path d="M5 12h14" /></>,
    building: <><path d="M4 21h16M6 21V8h8v13M14 12h4v9M9 11h2M9 15h2" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4m8-4v4M3 10h18" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    chevron: <path d="m9 6 6 6-6 6" />,
    document: <><path d="M6 3h8l4 4v14H6V3Z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></>,
    home: <><path d="m3 11 9-7 9 7" /><path d="M5.5 9.5V20h13V9.5M9.5 20v-6h5v6" /></>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
    message: <path d="M20 15.5a3 3 0 0 1-3 3H9l-5 2v-14a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v9Z" />,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    report: <><path d="M12 9v4M12 17h.01" /><path d="M10.3 4.3 2.8 17.2A2 2 0 0 0 4.5 20h15a2 2 0 0 0 1.7-2.8L13.7 4.3a2 2 0 0 0-3.4 0Z" /></>,
    shield: <><path d="M12 3 5 6v5c0 4.8 2.8 8.1 7 10 4.2-1.9 7-5.2 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></>,
    sparkle: <><path d="m12 3 1.5 4.2L18 9l-4.5 1.8L12 15l-1.5-4.2L6 9l4.5-1.8L12 3Z" /><path d="m18.5 15 .7 2.1 2.1.7-2.1.7-.7 2.1-.7-2.1-2.1-.7 2.1-.7.7-2.1Z" /></>,
    wallet: <><path d="M4 6.5h14a2 2 0 0 1 2 2V19H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h11" /><path d="M20 11h-5a2 2 0 0 0 0 4h5" /></>,
  };

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7">
        {path[name]}
      </g>
    </svg>
  );
}

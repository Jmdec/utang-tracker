'use client';

import type { Tab } from '@/app/page';

type Props = {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
};

const NAV_ITEMS: { tab: Tab; label: string; icon: string }[] = [
  { tab: 'home',     label: 'Home',     icon: '🏠' },
  { tab: 'expenses', label: 'Expenses', icon: '💸' },
  { tab: 'wallet',   label: 'Wallet',   icon: '💰' },
  { tab: 'history',  label: 'History',  icon: '📋' },
  { tab: 'people',   label: 'People',   icon: '👥' },
  { tab: 'goals', label: 'Goals', icon: '🎯' }
];

export default function BottomNav({ activeTab, setActiveTab }: Props) {
  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'white',
      borderTop: '1px solid #e9d5ff',
      display: 'flex',
      zIndex: 30,
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {NAV_ITEMS.map(({ tab, label, icon }) => {
        const isActive = activeTab === tab;
        return (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '10px 4px 8px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              gap: '2px',
            }}
          >
            <span style={{ fontSize: '20px', lineHeight: 1 }}>{icon}</span>
            <span style={{
              fontSize: '10px',
              fontWeight: isActive ? 700 : 500,
              color: isActive ? '#7c3aed' : '#9ca3af',
              transition: 'color 150ms',
            }}>
              {label}
            </span>
            {isActive && (
              <div style={{
                position: 'absolute',
                bottom: 'calc(env(safe-area-inset-bottom) + 0px)',
                width: '20px',
                height: '2px',
                background: '#7c3aed',
                borderRadius: '1px',
              }} />
            )}
          </button>
        );
      })}
    </nav>
  );
}
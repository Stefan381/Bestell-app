import '@/global.css';

/**
 * Native-only values that Tailwind classes can't express (status bar style,
 * native tab bar background). Everything else is styled via NativeWind
 * className props using the palette in tailwind.config.js.
 */
export const Colors = {
  light: {
    background: '#F7F8F9',
    surface: '#FFFFFF',
    text: '#11151B',
    tabBar: '#FFFFFF',
    statusBar: 'dark' as const,
  },
  dark: {
    background: '#0B0F14',
    surface: '#151B23',
    text: '#F7F8F9',
    tabBar: '#151B23',
    statusBar: 'light' as const,
  },
};

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

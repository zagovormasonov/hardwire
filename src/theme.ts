import type { ThemeConfig } from 'antd';
import { theme as antdTheme } from 'antd';

const theme: ThemeConfig = {
  algorithm: antdTheme.darkAlgorithm,
  token: {
    // Основные цвета
    colorPrimary: '#00ff88',
    colorSuccess: '#00ff88',
    colorWarning: '#ffa500',
    colorError: '#ff4757',
    colorInfo: '#00ff88',
    
    // Фон
    colorBgBase: '#0a0a0a',
    colorBgContainer: '#1a1a1a',
    colorBgElevated: '#2a2a2a',
    colorBgLayout: '#0a0a0a',
    
    // Текст
    colorTextBase: '#ffffff',
    colorText: '#ffffff',
    colorTextSecondary: '#9ca3af',
    colorTextTertiary: '#6b7280',
    colorTextQuaternary: '#4b5563',
    
    // Границы
    colorBorder: '#374151',
    colorBorderSecondary: '#4b5563',
    
    // Компоненты
    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 6,
    
    // Тени
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
    boxShadowSecondary: '0 2px 4px -1px rgba(0, 0, 0, 0.2)',
    
    // Размеры
    fontSize: 14,
    fontSizeLG: 16,
    fontSizeSM: 12,
    fontSizeXL: 20,
    
    // Отступы
    padding: 16,
    paddingLG: 24,
    paddingSM: 8,
    paddingXS: 4,
    
    // Высота компонентов
    controlHeight: 40,
    controlHeightLG: 48,
    controlHeightSM: 32,
  },
  components: {
    Layout: {
      bodyBg: '#0a0a0a',
      headerBg: '#1a1a1a',
      siderBg: '#1a1a1a',
    },
    Menu: {
      darkItemBg: '#1a1a1a',
      darkItemSelectedBg: '#2a2a2a',
      darkItemHoverBg: '#2a2a2a',
    },
    Button: {
      primaryShadow: '0 2px 0 rgba(0, 255, 136, 0.1)',
    },
    Card: {
      colorBgContainer: '#1a1a1a',
      colorBorderSecondary: '#374151',
    },
    Input: {
      colorBgContainer: '#2a2a2a',
      colorBorder: '#374151',
      colorText: '#ffffff',
      colorTextPlaceholder: '#9ca3af',
    },
    Select: {
      colorBgContainer: '#2a2a2a',
      colorBorder: '#374151',
      colorText: '#ffffff',
    },
    Table: {
      colorBgContainer: '#1a1a1a',
      headerBg: '#2a2a2a',
      rowHoverBg: '#2a2a2a',
    },
    Modal: {
      contentBg: '#1a1a1a',
      headerBg: '#1a1a1a',
    },
    Drawer: {
      colorBgElevated: '#1a1a1a',
    },
    Notification: {
      colorBgElevated: '#1a1a1a',
    },
    Tooltip: {
      colorBgSpotlight: '#2a2a2a',
    },
    Popover: {
      colorBgElevated: '#1a1a1a',
    },
  },
};

export default theme;

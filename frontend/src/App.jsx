import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider, App as AntApp, theme } from 'antd';
import { AuthProvider } from './context/AuthContext';
import { ProjectProvider } from './context/ProjectContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import AppRoutes from './routes/AppRoutes';

function ThemedApp() {
  const { isDark } = useTheme();

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: isDark ? '#3b82f6' : '#1868db',
          colorInfo: isDark ? '#3b82f6' : '#1868db',
          colorSuccess: '#16a34a',
          colorWarning: '#d97706',
          colorError: '#dc2626',
          colorBgBase: isDark ? '#0b0f19' : '#ffffff',
          colorBgLayout: isDark ? '#090d16' : '#f8fafc',
          colorBgContainer: isDark ? '#131b2e' : '#ffffff',
          colorBgElevated: isDark ? '#1a233a' : '#ffffff',
          colorBorder: isDark ? '#1e293b' : '#e2e8f0',
          colorBorderSecondary: isDark ? '#182234' : '#f1f5f9',
          colorText: isDark ? '#f1f5f9' : '#0f172a',
          colorTextSecondary: isDark ? '#94a3b8' : '#64748b',
          colorTextTertiary: isDark ? '#64748b' : '#94a3b8',
          borderRadius: 6,
          borderRadiusSM: 4,
          borderRadiusLG: 8,
          fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif`,
          fontSize: 14,
          controlHeight: 34,
          boxShadowSecondary: isDark
            ? '0 4px 16px 0 rgba(0, 0, 0, 0.4)'
            : '0 4px 12px 0 rgba(0, 0, 0, 0.05)',
        },
        components: {
          Layout: {
            siderBg: isDark ? '#0e1526' : '#ffffff',
            headerBg: isDark ? '#0e1526' : '#ffffff',
            bodyBg: isDark ? '#090d16' : '#f8fafc',
          },
          Menu: {
            itemBg: isDark ? '#0e1526' : '#ffffff',
            itemSelectedBg: isDark ? '#1e2d4d' : '#eff6ff',
            itemSelectedColor: isDark ? '#60a5fa' : '#1d4ed8',
            itemHoverBg: isDark ? '#162035' : '#f8fafc',
            itemHoverColor: isDark ? '#f1f5f9' : '#0f172a',
            itemColor: isDark ? '#94a3b8' : '#475569',
            iconSize: 16,
            itemMarginInline: 8,
            itemBorderRadius: 6,
          },
          Card: {
            headerBg: 'transparent',
            headerFontSize: 15,
            paddingLG: 18,
          },
          Table: {
            headerBg: isDark ? '#111827' : '#f8fafc',
            headerColor: isDark ? '#94a3b8' : '#475569',
            rowHoverBg: isDark ? '#182236' : '#f8fafc',
            borderColor: isDark ? '#1e293b' : '#f1f5f9',
          },
          Button: {
            controlHeight: 34,
            fontWeight: 500,
            borderRadius: 6,
          },
          Tabs: {
            titleFontSize: 14,
            itemSelectedColor: isDark ? '#60a5fa' : '#1868db',
            itemHoverColor: isDark ? '#93c5fd' : '#1868db',
            inkBarColor: isDark ? '#3b82f6' : '#1868db',
          },
          Tag: {
            borderRadiusSM: 4,
          },
          Modal: {
            borderRadiusLG: 10,
            headerBg: isDark ? '#131b2e' : '#ffffff',
            contentBg: isDark ? '#131b2e' : '#ffffff',
          },
          Drawer: {
            borderRadiusLG: 0,
            colorBgElevated: isDark ? '#0e1526' : '#ffffff',
          },
        },
      }}
    >
      <AntApp>
        <BrowserRouter>
          <AuthProvider>
            <ProjectProvider>
              <AppRoutes />
            </ProjectProvider>
          </AuthProvider>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <ThemedApp />
    </ThemeProvider>
  );
}

export default App;

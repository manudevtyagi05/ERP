import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider, App as AntApp, theme } from 'antd';
import { AuthProvider } from './context/AuthContext';
import { ProjectProvider } from './context/ProjectContext';
import AppRoutes from './routes/AppRoutes';

function App() {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1868db',
          colorInfo: '#1868db',
          colorSuccess: '#16a34a',
          colorWarning: '#d97706',
          colorError: '#dc2626',
          colorBgBase: '#ffffff',
          colorBgLayout: '#f8fafc',
          colorBgContainer: '#ffffff',
          colorBorder: '#e2e8f0',
          colorBorderSecondary: '#f1f5f9',
          colorText: '#0f172a',
          colorTextSecondary: '#64748b',
          colorTextTertiary: '#94a3b8',
          borderRadius: 6,
          borderRadiusSM: 4,
          borderRadiusLG: 8,
          fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif`,
          fontSize: 14,
          controlHeight: 34,
          boxShadowSecondary: '0 4px 12px 0 rgba(0, 0, 0, 0.05)',
        },
        components: {
          Layout: {
            siderBg: '#ffffff',
            headerBg: '#ffffff',
            bodyBg: '#f8fafc',
          },
          Menu: {
            itemBg: '#ffffff',
            itemSelectedBg: '#eff6ff',
            itemSelectedColor: '#1d4ed8',
            itemHoverBg: '#f8fafc',
            itemHoverColor: '#0f172a',
            itemColor: '#475569',
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
            headerBg: '#f8fafc',
            headerColor: '#475569',
            rowHoverBg: '#f8fafc',
            borderColor: '#f1f5f9',
          },
          Button: {
            controlHeight: 34,
            fontWeight: 500,
            borderRadius: 6,
          },
          Tabs: {
            titleFontSize: 14,
            itemSelectedColor: '#1868db',
            itemHoverColor: '#1868db',
            inkBarColor: '#1868db',
          },
          Tag: {
            borderRadiusSM: 4,
          },
          Modal: {
            borderRadiusLG: 10,
          },
          Drawer: {
            borderRadiusLG: 0,
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

export default App;

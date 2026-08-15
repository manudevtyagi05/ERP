import { Button, Dropdown, Tooltip } from 'antd';
import {
  SunOutlined,
  MoonOutlined,
  DesktopOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { useTheme } from '../../context/ThemeContext';

export function ThemeToggle({ showDropdown = true, size = 'middle', className = '' }) {
  const { themeMode, setThemeMode, toggleTheme, isDark } = useTheme();

  const menuItems = [
    {
      key: 'light',
      icon: <SunOutlined className="text-amber-500" />,
      label: (
        <div className="flex items-center justify-between gap-4 py-0.5 text-xs">
          <span>Light</span>
          {themeMode === 'light' && <CheckOutlined className="text-blue-600 text-xs" />}
        </div>
      ),
      onClick: () => setThemeMode('light'),
    },
    {
      key: 'dark',
      icon: <MoonOutlined className="text-indigo-400" />,
      label: (
        <div className="flex items-center justify-between gap-4 py-0.5 text-xs">
          <span>Dark</span>
          {themeMode === 'dark' && <CheckOutlined className="text-blue-600 text-xs" />}
        </div>
      ),
      onClick: () => setThemeMode('dark'),
    },
    {
      key: 'system',
      icon: <DesktopOutlined className="text-slate-400" />,
      label: (
        <div className="flex items-center justify-between gap-4 py-0.5 text-xs">
          <span>System ({isDark ? 'Dark' : 'Light'})</span>
          {themeMode === 'system' && <CheckOutlined className="text-blue-600 text-xs" />}
        </div>
      ),
      onClick: () => setThemeMode('system'),
    },
  ];

  const currentIcon = isDark ? (
    <MoonOutlined className="text-indigo-400 text-base" />
  ) : (
    <SunOutlined className="text-amber-500 text-base" />
  );

  const tooltipTitle = `Theme: ${
    themeMode === 'system' ? `System (${isDark ? 'Dark' : 'Light'})` : themeMode === 'dark' ? 'Dark' : 'Light'
  }`;

  if (!showDropdown) {
    return (
      <Tooltip title={tooltipTitle}>
        <Button
          type="text"
          size={size}
          icon={currentIcon}
          onClick={toggleTheme}
          className={`!w-9 !h-9 flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition ${className}`}
        />
      </Tooltip>
    );
  }

  return (
    <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
      <Tooltip title={tooltipTitle}>
        <Button
          type="text"
          size={size}
          icon={currentIcon}
          className={`!w-9 !h-9 flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition ${className}`}
        />
      </Tooltip>
    </Dropdown>
  );
}

export default ThemeToggle;

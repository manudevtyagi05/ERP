import { useState } from 'react';
import {
  Card,
  Input,
  Button,
  Tabs,
  Progress,
  Tag,
  Avatar,
  Table,
  Segmented,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  StarOutlined,
  StarFilled,
  AppstoreOutlined,
  BarsOutlined,
  UserOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import CreateProjectModal from '../components/projects/CreateProjectModal';

function Projects() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('filter') || 'all';
  const { user } = useAuth();

  const { projects, toggleProjectStar, setActiveProjectKey } = useProject();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Tab filtering
  const handleTabChange = (key) => {
    if (key === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ filter: key });
    }
  };

  // Filtered projects
  const filteredProjects = projects.filter((project) => {
    if (search && !project.name.toLowerCase().includes(search.toLowerCase()) && !project.key.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (currentTab === 'my' && project.leadEmail !== user?.email) {
      return false;
    }
    if (currentTab === 'starred' && !project.star) {
      return false;
    }
    return true;
  });

  const columns = [
    {
      title: 'Star',
      key: 'star',
      width: 50,
      render: (_, record) => (
        <Button
          type="text"
          size="small"
          icon={
            record.star ? (
              <StarFilled className="text-amber-500" />
            ) : (
              <StarOutlined className="text-slate-400 hover:text-amber-500" />
            )
          }
          onClick={(e) => {
            e.stopPropagation();
            toggleProjectStar(record.key);
          }}
        />
      ),
    },
    {
      title: 'Project Name',
      key: 'name',
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg text-white font-mono font-bold text-xs flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: record.avatarBg || '#2563eb' }}
          >
            {record.key}
          </div>
          <div>
            <div className="font-semibold text-slate-800 dark:text-slate-100 text-xs">{record.name}</div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500">{record.category}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Key',
      dataIndex: 'key',
      render: (key) => (
        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          {key}
        </span>
      ),
    },
    {
      title: 'Project Lead',
      key: 'lead',
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <Avatar src={record.leadAvatar} size="small" icon={<UserOutlined />} className="bg-slate-200 dark:bg-slate-700" />
          <span className="text-xs text-slate-700 dark:text-slate-300">{record.lead}</span>
        </div>
      ),
    },
    {
      title: 'Progress',
      key: 'progress',
      render: (_, record) => (
        <div className="w-36">
          <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-0.5">
            <span>{record.completedIssues}/{record.totalIssues} issues</span>
            <span className="font-medium">{record.progress}%</span>
          </div>
          <Progress percent={record.progress} size="small" showInfo={false} />
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (status) => (
        <Tag color={status === 'Active' ? 'green' : 'default'} className="text-xs">
          {status}
        </Tag>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button
          type="text"
          size="small"
          icon={<ArrowRightOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            setActiveProjectKey(record.key);
            navigate('/board');
          }}
        >
          Board
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight !mb-0">Projects</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage project roadmaps, teams, and track overall development progress.
          </p>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCreateModalOpen(true)}
          className="bg-blue-600 hover:!bg-blue-700"
        >
          Create Project
        </Button>
      </div>

      {/* Tabs & Filter Bar */}
      <div className="bg-white dark:bg-[#131b2e] p-3 rounded-lg border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <Tabs
          activeKey={currentTab}
          onChange={handleTabChange}
          className="!mb-0"
          items={[
            { key: 'all', label: 'All Projects' },
            { key: 'my', label: 'My Projects' },
            { key: 'recent', label: 'Recent Projects' },
            { key: 'starred', label: 'Starred' },
          ]}
        />

        <div className="flex items-center gap-3">
          <Input
            placeholder="Search projects..."
            prefix={<SearchOutlined className="text-slate-400" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            size="small"
            style={{ width: 200 }}
            className="text-xs"
          />

          <Segmented
            size="small"
            value={viewMode}
            onChange={setViewMode}
            options={[
              { value: 'grid', icon: <AppstoreOutlined /> },
              { value: 'table', icon: <BarsOutlined /> },
            ]}
          />
        </div>
      </div>

      {/* Project Views */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <Card
              key={project.id}
              bordered={false}
              className="shadow-sm border border-slate-200/80 dark:border-slate-800 dark:bg-[#131b2e] hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition cursor-pointer flex flex-col justify-between"
              onClick={() => {
                setActiveProjectKey(project.key);
                navigate('/board');
              }}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-9 h-9 rounded-lg text-white font-mono font-bold text-xs flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: project.avatarBg || '#2563eb' }}
                    >
                      {project.key}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 line-clamp-1">
                        {project.name}
                      </h3>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">{project.category}</span>
                    </div>
                  </div>

                  <Tooltip title={project.star ? 'Unstar' : 'Star project'}>
                    <Button
                      type="text"
                      size="small"
                      icon={
                        project.star ? (
                          <StarFilled className="text-amber-500" />
                        ) : (
                          <StarOutlined className="text-slate-400 hover:text-amber-500" />
                        )
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleProjectStar(project.key);
                      }}
                    />
                  </Tooltip>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed min-h-[36px]">
                  {project.description || 'Enterprise project workspace.'}
                </p>
              </div>

              {/* Footer details */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-500 dark:text-slate-400">Progress</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{project.progress}%</span>
                </div>
                <Progress percent={project.progress} size="small" showInfo={false} />

                <div className="flex items-center justify-between mt-3 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Avatar src={project.leadAvatar} size={20} icon={<UserOutlined />} className="bg-slate-200 dark:bg-slate-700" />
                    <span className="truncate max-w-[100px] text-[11px] text-slate-700 dark:text-slate-300">{project.lead}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    {project.completedIssues}/{project.totalIssues} issues
                  </span>
                </div>
              </div>
            </Card>
          ))}

          {filteredProjects.length === 0 && (
            <div className="col-span-full bg-white dark:bg-[#131b2e] p-8 rounded-lg border border-slate-200 dark:border-slate-800 text-center text-slate-400 dark:text-slate-500 text-xs">
              No projects matching your search criteria.
            </div>
          )}
        </div>
      ) : (
        <Card bordered={false} className="shadow-sm border border-slate-200/80 dark:border-slate-800 dark:bg-[#131b2e]">
          <Table
            rowKey="id"
            columns={columns}
            dataSource={filteredProjects}
            pagination={false}
            onRow={(record) => ({
              onClick: () => {
                setActiveProjectKey(record.key);
                navigate('/board');
              },
              className: 'cursor-pointer',
            })}
            className="jira-table"
          />
        </Card>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal open={createModalOpen} onCancel={() => setCreateModalOpen(false)} />
    </div>
  );
}

export default Projects;

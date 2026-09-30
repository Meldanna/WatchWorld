import React, { useState } from 'react';
import { McpServerConfig, McpTool } from '../types';
import { ThemeConfig } from '../lib/theme';
import {
  Server,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Play,
  Activity,
  Layers,
  Wrench,
  Wifi,
  WifiOff,
  Code,
  Terminal,
} from 'lucide-react';

interface McpModalProps {
  isOpen: boolean;
  onClose: () => void;
  mcpServers: McpServerConfig[];
  theme: ThemeConfig;
  onSaveMcpServer: (server: McpServerConfig) => void;
  onDeleteMcpServer: (id: string) => void;
  onToggleServer: (id: string) => void;
}

export const McpModal: React.FC<McpModalProps> = ({
  isOpen,
  onClose,
  mcpServers,
  theme,
  onSaveMcpServer,
  onDeleteMcpServer,
  onToggleServer,
}) => {
  const [editingServer, setEditingServer] = useState<McpServerConfig | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [type, setType] = useState<McpServerConfig['type']>('sse');
  const [endpoint, setEndpoint] = useState('');
  const [description, setDescription] = useState('');
  const [toolsStr, setToolsStr] = useState('');

  if (!isOpen) return null;

  const startCreate = () => {
    setIsCreating(true);
    setEditingServer(null);
    setName('');
    setType('sse');
    setEndpoint('http://localhost:3001/sse');
    setDescription('');
    setToolsStr('read_file, list_dir');
  };

  const startEdit = (server: McpServerConfig) => {
    setEditingServer(server);
    setIsCreating(false);
    setName(server.name);
    setType(server.type);
    setEndpoint(server.endpoint);
    setDescription(server.description || '');
    setToolsStr(server.tools.map((t) => t.name).join(', '));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !endpoint.trim()) return;

    const parsedTools: McpTool[] = toolsStr
      .split(/[,，\s]+/)
      .map((t) => t.trim())
      .filter(Boolean)
      .map((tName) => {
        const existing = editingServer?.tools.find((et) => et.name === tName);
        return (
          existing || {
            name: tName,
            description: `MCP 工具方法: ${tName}`,
            parametersSchema: '{"input": "string"}',
          }
        );
      });

    const serverToSave: McpServerConfig = {
      id: editingServer?.id || `mcp-${Date.now()}`,
      name: name.trim(),
      type,
      endpoint: endpoint.trim(),
      description: description.trim(),
      tools: parsedTools,
      enabled: editingServer ? editingServer.enabled : true,
      status: 'connected',
    };

    onSaveMcpServer(serverToSave);
    setIsCreating(false);
    setEditingServer(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 sm:p-5 z-10 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150 text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl ${theme.accentBadge} flex items-center justify-center`}>
              <Server size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <span>MCP (Model Context Protocol) 服务管理</span>
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                连接外部 MCP 工具服务器（SSE / Stdio / API），赋能 AI 真实环境操作
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        {isCreating || editingServer ? (
          <form onSubmit={handleSave} className="flex-1 overflow-y-auto py-3 space-y-3 text-xs text-slate-700 dark:text-slate-300">
            <div className="flex items-center justify-between">
              <h3 className={`text-xs font-semibold ${theme.primaryText}`}>
                {isCreating ? '添加 MCP 服务器' : `配置 MCP: ${editingServer?.name}`}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setEditingServer(null);
                }}
                className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
              >
                返回列表
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                  服务名称 *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例如：本地文件系统 MCP、GitHub MCP..."
                  required
                  className="w-full bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-slate-500 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                  连接协议
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-slate-500 text-slate-900 dark:text-slate-100"
                >
                  <option value="sse">SSE (HTTP Server-Sent Events)</option>
                  <option value="stdio">Stdio (本地进程命令行)</option>
                  <option value="custom_api">Custom Tools API</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1 font-mono">
                MCP 端点地址 / 启动命令 *
              </label>
              <input
                type="text"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="例如：http://localhost:3001/sse 或 npx -y @modelcontextprotocol/server-filesystem"
                required
                className="w-full bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-slate-500 text-slate-900 dark:text-slate-100 font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                暴露的工具方法名称 (逗号分隔)
              </label>
              <input
                type="text"
                value={toolsStr}
                onChange={(e) => setToolsStr(e.target.value)}
                placeholder="例如：read_file, write_file, execute_command"
                className="w-full bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-slate-500 text-slate-900 dark:text-slate-100 font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                服务功能描述
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="简述该服务为大模型带来的工具扩展能力..."
                className="w-full bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-slate-500 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setEditingServer(null);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
              >
                取消
              </button>
              <button
                type="submit"
                className={`px-4 py-1.5 rounded-lg ${theme.primaryBg} ${theme.primaryHover} text-white font-medium`}
              >
                保存 MCP 服务
              </button>
            </div>
          </form>
        ) : (
          <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
            <div className="flex items-center justify-between px-1 mb-1">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                已注册 MCP 服务器 ({mcpServers.filter((s) => s.enabled).length}/{mcpServers.length} 运行中)
              </span>
              <button
                onClick={startCreate}
                className={`flex items-center gap-1 text-xs ${theme.primaryText} font-medium py-1 px-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700`}
              >
                <Plus size={14} />
                <span>添加 MCP 服务</span>
              </button>
            </div>

            {mcpServers.map((server) => (
              <div
                key={server.id}
                className={`p-3 rounded-xl border transition-all flex flex-col gap-2 ${
                  server.enabled
                    ? 'bg-slate-50/80 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800'
                    : 'bg-slate-100/50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-900 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      onClick={() => onToggleServer(server.id)}
                      className={`p-1 rounded-lg border ${
                        server.enabled
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-500/40'
                          : 'bg-slate-200 text-slate-400 border-slate-300 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700'
                      }`}
                      title={server.enabled ? '已激活' : '未启用'}
                    >
                      {server.enabled ? <Wifi size={14} /> : <WifiOff size={14} />}
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold truncate">
                          {server.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                          {server.type.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                        {server.endpoint}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => startEdit(server)}
                      className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
                      title="编辑"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`确认删除 MCP「${server.name}」？`)) {
                          onDeleteMcpServer(server.id);
                        }
                      }}
                      className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-500"
                      title="删除"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Tool Pills */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-200 dark:border-slate-800/80">
                  <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                    <Wrench size={10} /> 工具列表:
                  </span>
                  {server.tools.map((t) => (
                    <span
                      key={t.name}
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                      title={t.description}
                    >
                      {t.name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-400">
            支持标准 Model Context Protocol 工具协议注入
          </span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-medium text-xs text-slate-700 dark:text-slate-200"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};

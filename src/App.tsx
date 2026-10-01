import React, { useState, useEffect, useRef } from 'react';
import {
  ApiProviderConfig,
  Agent,
  PromptPreset,
  ChatGroup,
  ChatSession,
  ChatMessage,
  AiContextVisibilityFilter,
  MessageVersion,
  RegexRule,
  KnowledgeItem,
  ThemePalette,
  UiMode,
  McpServerConfig,
  AgentSkill,
  MessageDisplaySettings,
  TimelineBranch,
  WebDavConfig,
  WorldDocument,
} from './types';
import { Storage } from './lib/storage';
import { sendChatMessage, analyzeRoleRelationships } from './lib/api';
import { THEMES } from './lib/theme';
import { applyRegexRules } from './lib/regexProcessor';
import { estimateTokens } from './lib/tokenEstimator';
import {
  detectTimelineIntent,
  enrichTimelineProgression,
  buildTimelineTreePromptContext,
  createDefaultMainTimeline,
  allocateTimelineCodeTag,
  TIMELINE_COLORS,
} from './lib/timelineMemory';
import { pullFromWebDav } from './lib/webdavSync';
import { Header } from './components/Header';
import { SidebarDrawer } from './components/SidebarDrawer';
import { ChatMessageList } from './components/ChatMessageList';
import { ChatInput } from './components/ChatInput';
import { ProviderModal } from './components/ProviderModal';
import { AgentModal } from './components/AgentModal';
import { PromptModal } from './components/PromptModal';
import { GroupModal } from './components/GroupModal';
import { AiVisibilityModal } from './components/AiVisibilityModal';
import { RegexModal } from './components/RegexModal';
import { KnowledgeBaseModal } from './components/KnowledgeBaseModal';
import { ThemeModal } from './components/ThemeModal';
import { McpModal } from './components/McpModal';
import { SkillModal } from './components/SkillModal';
import { SettingsModal } from './components/SettingsModal';
import { TimelineModal } from './components/TimelineModal';
import { PromptDualBoxModal } from './components/PromptDualBoxModal';
import { SearchModal } from './components/SearchModal';
import { DocumentModal } from './components/DocumentModal';

export default function App() {
  // 1. Persistent State
  const [providers, setProviders] = useState<ApiProviderConfig[]>(() =>
    Storage.getProviders()
  );
  const [activeProviderId, setActiveProviderId] = useState<string>(() =>
    Storage.getActiveProviderId()
  );
  const [groups, setGroups] = useState<ChatGroup[]>(() => Storage.getGroups());
  const [agents, setAgents] = useState<Agent[]>(() => Storage.getAgents());
  const [prompts, setPrompts] = useState<PromptPreset[]>(() => Storage.getPrompts());
  const [regexRules, setRegexRules] = useState<RegexRule[]>(() => Storage.getRegexRules());
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeItem[]>(() =>
    Storage.getKnowledgeBase()
  );
  const [themePalette, setThemePalette] = useState<ThemePalette>(() =>
    Storage.getThemePalette()
  );
  const [uiMode, setUiMode] = useState<UiMode>(() => Storage.getUiMode());
  const [mcpServers, setMcpServers] = useState<McpServerConfig[]>(() =>
    Storage.getMcpServers()
  );
  const [skills, setSkills] = useState<AgentSkill[]>(() => Storage.getSkills());
  const [displaySettings, setDisplaySettings] = useState<MessageDisplaySettings>(() =>
    Storage.getDisplaySettings()
  );
  const [sessions, setSessions] = useState<ChatSession[]>(() => Storage.getSessions());
  const [activeSessionId, setActiveSessionId] = useState<string>(() =>
    Storage.getActiveSessionId()
  );
  const [webdavConfig, setWebdavConfig] = useState<WebDavConfig>(() =>
    Storage.getWebDavConfig()
  );
  const [worldDocuments, setWorldDocuments] = useState<WorldDocument[]>(() =>
    Storage.getWorldDocuments()
  );

  // Active theme computed
  const theme = THEMES[themePalette] || THEMES.emerald;

  // Active Session computation
  const activeSession =
    sessions.find((s) => s.id === activeSessionId) || sessions[0];

  const activeProvider =
    providers.find((p) => p.id === (activeSession?.providerId || activeProviderId)) ||
    providers[0];

  const activeAgent =
    agents.find((a) => a.id === activeSession?.agentId) || agents[0];

  const activeGroup = groups.find((g) => g.id === activeSession?.groupId);

  // 2. UI Modal states
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isVisibilityModalOpen, setIsVisibilityModalOpen] = useState(false);
  const [isRegexModalOpen, setIsRegexModalOpen] = useState(false);
  const [isKnowledgeModalOpen, setIsKnowledgeModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isMcpModalOpen, setIsMcpModalOpen] = useState(false);
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [isDisplaySettingsModalOpen, setIsDisplaySettingsModalOpen] = useState(false);
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);
  const [isDualBoxPromptModalOpen, setIsDualBoxPromptModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [filterByActiveTimeline, setFilterByActiveTimeline] = useState(false);

  // 3. Chat runtime states & draft persistence
  const [inputDraft, setInputDraft] = useState(() =>
    Storage.getInputDraft(activeSession?.id || '')
  );
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync draft per session
  useEffect(() => {
    if (activeSession?.id) {
      setInputDraft(Storage.getInputDraft(activeSession.id));
    }
  }, [activeSession?.id]);

  const handleDraftChange = (val: string) => {
    setInputDraft(val);
    if (activeSession?.id) {
      Storage.setInputDraft(activeSession.id, val);
    }
  };

  // 2.5 WebDAV: 启动时自动拉取最新数据，冲突以时间戳较新为准
  useEffect(() => {
    if (webdavConfig.enabled) {
      pullFromWebDav(webdavConfig).then((res) => {
        if (res.success && res.remoteData) {
          try {
            const parsed = JSON.parse(res.remoteData);
            const localData = JSON.parse(Storage.exportAllData());
            if ((parsed.exportTime || 0) > (localData.exportTime || 0)) {
              Storage.importAllData(res.remoteData);
              setSessions(Storage.getSessions());
              setWorldDocuments(Storage.getWorldDocuments());
            }
          } catch {
            // ignore
          }
        }
      });
    }
  }, []);

  // Sync to HTML class for dark/light mode
  useEffect(() => {
    const root = document.documentElement;
    if (uiMode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    Storage.setUiMode(uiMode);
  }, [uiMode]);

  // Sync to localStorage
  useEffect(() => {
    Storage.setProviders(providers);
  }, [providers]);

  useEffect(() => {
    Storage.setActiveProviderId(activeProviderId);
  }, [activeProviderId]);

  useEffect(() => {
    Storage.setGroups(groups);
  }, [groups]);

  useEffect(() => {
    Storage.setAgents(agents);
  }, [agents]);

  useEffect(() => {
    Storage.setPrompts(prompts);
  }, [prompts]);

  useEffect(() => {
    Storage.setRegexRules(regexRules);
  }, [regexRules]);

  useEffect(() => {
    Storage.setKnowledgeBase(knowledgeBase);
  }, [knowledgeBase]);

  useEffect(() => {
    Storage.setThemePalette(themePalette);
  }, [themePalette]);

  useEffect(() => {
    Storage.setMcpServers(mcpServers);
  }, [mcpServers]);

  useEffect(() => {
    Storage.setSkills(skills);
  }, [skills]);

  useEffect(() => {
    Storage.setDisplaySettings(displaySettings);
  }, [displaySettings]);

  useEffect(() => {
    Storage.setSessions(sessions);
  }, [sessions]);

  useEffect(() => {
    Storage.setActiveSessionId(activeSessionId);
  }, [activeSessionId]);

  // Helper to update active session
  const updateCurrentSession = (updater: (prev: ChatSession) => ChatSession) => {
    setSessions((prevSessions) =>
      prevSessions.map((s) => (s.id === activeSession.id ? updater(s) : s))
    );
  };

  // Toggle UI light/dark mode
  const handleToggleUiMode = () => {
    setUiMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Helper to create a new session
  const handleNewSession = (targetGroupId?: string) => {
    const newId = `session-${Date.now()}`;
    const newSession: ChatSession = {
      id: newId,
      title: '新对话',
      groupId: targetGroupId || activeGroup?.id || groups[0]?.id || 'group-default',
      agentId: activeAgent?.id || agents[0]?.id || 'agent-omni',
      providerId: activeProviderId,
      model: activeProvider?.defaultModel || 'gemini-3.8-flash',
      aiContextVisibility: 'all',
      uiRenderLimit: 0,
      connectedKnowledgeIds: ['kb-quick-notes'],
      connectedSkillIds: ['skill-web-research', 'skill-code-debugger'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    };

    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newId);
  };

  // Get active connected knowledge items and skills for current session
  const connectedKnowledgeItems = knowledgeBase.filter((k) =>
    (activeSession?.connectedKnowledgeIds || []).includes(k.id)
  );

  const activeConnectedSkills = skills.filter((s) =>
    (activeSession?.connectedSkillIds || []).includes(s.id)
  );

  // Compute total tokens consumed by current session
  const sessionTotalTokens = React.useMemo(() => {
    if (!activeSession || !activeSession.messages) return 0;
    return activeSession.messages.reduce((acc, m) => {
      if (m.role === 'user') {
        return acc + (m.tokens || estimateTokens(m.content));
      } else if (m.role === 'assistant') {
        const v = m.versions?.[m.currentVersionIndex] || m.versions?.[0];
        const vTokens = v?.tokens || estimateTokens(v?.content || m.content);
        return acc + vTokens;
      }
      return acc + estimateTokens(m.content);
    }, 0);
  }, [activeSession]);

  // Send a new chat message
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return;

    const processedText = applyRegexRules(text, regexRules, 'input');
    const userTokens = estimateTokens(processedText);

    const userMsgId = `msg-u-${Date.now()}`;
    const assistantMsgId = `msg-a-${Date.now() + 1}`;

    // 0. Timeline Memory Management & Auto-Detection
    const currentTimelines =
      activeSession.timelines && activeSession.timelines.length > 0
        ? activeSession.timelines
        : [createDefaultMainTimeline()];

    let targetTimelineId = activeSession.activeTimelineId || currentTimelines[0].id;
    let nextTimelines = [...currentTimelines];

    if (activeSession.timelineMemoryEnabled) {
      const detection = detectTimelineIntent(processedText, currentTimelines);
      if (detection.triggered) {
        if (detection.action === 'switch_existing' && detection.targetTimelineId) {
          targetTimelineId = detection.targetTimelineId;
        } else if (detection.action === 'create_new') {
          const newId = `timeline-${Date.now()}`;
          const usedColors = new Set(nextTimelines.map((t) => t.color));
          const pickColor =
            TIMELINE_COLORS.find((c) => !usedColors.has(c.id)) || TIMELINE_COLORS[0];

          const parentBranch = nextTimelines.find((t) => t.id === targetTimelineId);
          const allocatedCode = allocateTimelineCodeTag(nextTimelines, parentBranch);
          const branchDescName = detection.newTimelineName || `时间线 ${nextTimelines.length}`;

          const newBranch: TimelineBranch = {
            id: newId,
            name: branchDescName,
            tag: allocatedCode,
            codeTag: allocatedCode,
            descriptionTag: branchDescName,
            visible: true,
            color: pickColor.id,
            description:
              detection.initialDescription ||
              `关于「${detection.newTimelineName}」的全新时间线分支。`,
            plotSummary: `时间线由此开启：${processedText.slice(0, 45)}`,
            keyMilestones: [`建立时间线【${detection.newTimelineName}】`],
            messageIds: [userMsgId],
            parentId: targetTimelineId, // Linked to parent branch, building message tree
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          nextTimelines.push(newBranch);
          targetTimelineId = newId;
        }
      }
    }

    const currentBranch =
      nextTimelines.find((t) => t.id === targetTimelineId) || nextTimelines[0];

    const currentMaxFloor = activeSession.messages.reduce(
      (max, m) => Math.max(max, m.floorNumber || 0),
      0
    );

    const isMainCommon =
      targetTimelineId === 'timeline-main' ||
      currentBranch.codeTag === '通用' ||
      !activeSession.timelineMemoryEnabled;

    const userMessage: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: processedText,
      timestamp: Date.now(),
      tokens: userTokens,
      versions: [],
      currentVersionIndex: 0,
      timelineId: targetTimelineId,
      timelineTag: currentBranch.codeTag || currentBranch.tag,
      floorNumber: currentMaxFloor + 1,
      codeTag: currentBranch.codeTag || currentBranch.tag || '通用',
      descriptionTag: currentBranch.descriptionTag || currentBranch.name || '通用世界观',
      isCommon: isMainCommon,
    };

    const assistantMessage: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      currentVersionIndex: 0,
      timelineId: targetTimelineId,
      timelineTag: currentBranch.codeTag || currentBranch.tag,
      floorNumber: currentMaxFloor + 2,
      codeTag: currentBranch.codeTag || currentBranch.tag || '通用',
      descriptionTag: currentBranch.descriptionTag || currentBranch.name || '通用世界观',
      isCommon: isMainCommon,
      versions: [
        {
          content: '',
          timestamp: Date.now(),
          model: activeSession.model || activeProvider.defaultModel,
          providerName: activeProvider.name,
        },
      ],
    };

    const isFirstUserMessage =
      activeSession.messages.filter((m) => m.role === 'user').length === 0;

    const newTitle =
      isFirstUserMessage && activeSession.title === '新对话'
        ? text.slice(0, 20) + (text.length > 20 ? '...' : '')
        : activeSession.title;

    const updatedMessages = [...activeSession.messages, userMessage, assistantMessage];

    updateCurrentSession((prev) => ({
      ...prev,
      title: newTitle,
      updatedAt: Date.now(),
      messages: updatedMessages,
      timelines: nextTimelines,
      activeTimelineId: targetTimelineId,
    }));

    handleDraftChange('');

    setIsStreaming(true);
    setStreamingMessageId(assistantMsgId);
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const requestStartTime = Date.now();

    // Background Message Tree context for AI
    const timelinePrompt = activeSession.timelineMemoryEnabled
      ? buildTimelineTreePromptContext(
          currentBranch,
          nextTimelines,
          [...activeSession.messages, userMessage]
        )
      : undefined;

    // 3.2 提示词系统：双框组合与推入通用缓存
    const baseSystemPrompt =
      activeSession.systemPromptFixed ||
      activeSession.systemPromptOverride ||
      activeAgent.systemPrompt;

    const combinedSystemInstruction = [
      baseSystemPrompt,
      activeSession.isCommonPushed && activeSession.systemPromptInjectedCommon
        ? `\n# 【通用世界观基石缓存】:\n${activeSession.systemPromptInjectedCommon}`
        : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    try {
      const finalReply = await sendChatMessage({
        provider: activeProvider,
        agent: activeAgent,
        model: activeSession.model || activeProvider.defaultModel,
        messages: [...activeSession.messages, userMessage],
        systemInstruction: combinedSystemInstruction,
        temperature: activeAgent.temperature,
        aiContextVisibility: activeSession.aiContextVisibility || 'all',
        connectedKnowledge: connectedKnowledgeItems,
        activeSkills: activeConnectedSkills,
        activeMcpServers: mcpServers,
        regexRules: regexRules,
        timelineContextPrompt: timelinePrompt,
        allTimelines: nextTimelines,
        activeTimelineId: targetTimelineId,
        timelineMemoryEnabled: activeSession.timelineMemoryEnabled,
        signal: controller.signal,
        onChunk: (accumulated) => {
          updateCurrentSession((prev) => {
            const nextMessages = prev.messages.map((m) => {
              if (m.id === assistantMsgId) {
                const nextVersions = [...m.versions];
                nextVersions[0] = {
                  ...nextVersions[0],
                  content: accumulated,
                };
                return {
                  ...m,
                  versions: nextVersions,
                };
              }
              return m;
            });
            return { ...prev, messages: nextMessages };
          });
        },
      });

      const latencyMs = Date.now() - requestStartTime;
      const tokensCount = estimateTokens(finalReply || '');

      if (finalReply) {
        let finalTimelines = nextTimelines;
        if (activeSession.timelineMemoryEnabled) {
          const enriched = enrichTimelineProgression(
            currentBranch,
            processedText,
            finalReply
          );
          finalTimelines = nextTimelines.map((t) => {
            if (t.id === targetTimelineId) {
              return {
                ...t,
                description: enriched.updatedDescription,
                plotSummary: enriched.updatedPlotSummary,
                keyMilestones: enriched.newMilestones,
                messageIds: Array.from(
                  new Set([...t.messageIds, userMsgId, assistantMsgId])
                ),
                updatedAt: Date.now(),
              };
            }
            return t;
          });
        }

        updateCurrentSession((prev) => {
          const nextMessages = prev.messages.map((m) => {
            if (m.id === assistantMsgId) {
              const nextVersions = [...m.versions];
              nextVersions[0] = {
                ...nextVersions[0],
                content: finalReply,
                latencyMs,
                tokens: tokensCount,
              };
              return {
                ...m,
                versions: nextVersions,
                latencyMs,
                tokens: tokensCount,
                timelineId: targetTimelineId,
                timelineTag: currentBranch.tag,
              };
            }
            return m;
          });
          return {
            ...prev,
            messages: nextMessages,
            timelines: finalTimelines,
            activeTimelineId: targetTimelineId,
          };
        });
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        const errorText = `[请求失败]: ${err.message || '未知错误'}`;
        const latencyMs = Date.now() - requestStartTime;
        updateCurrentSession((prev) => {
          const nextMessages = prev.messages.map((m) => {
            if (m.id === assistantMsgId) {
              const nextVersions = [...m.versions];
              nextVersions[0] = {
                ...nextVersions[0],
                content: errorText,
                latencyMs,
              };
              return { ...m, versions: nextVersions, latencyMs };
            }
            return m;
          });
          return { ...prev, messages: nextMessages };
        });
      }
    } finally {
      setIsStreaming(false);
      setStreamingMessageId(null);
      abortControllerRef.current = null;
    }
  };

  // Roll AI message branch
  const handleRollMessage = async (messageId: string) => {
    if (isStreaming) return;

    const targetIndex = activeSession.messages.findIndex((m) => m.id === messageId);
    if (targetIndex === -1) return;

    const targetMsg = activeSession.messages[targetIndex];
    if (targetMsg.role !== 'assistant') return;

    const contextMessages = activeSession.messages.slice(0, targetIndex);

    const newVersionIndex = targetMsg.versions.length;
    const newVersion: MessageVersion = {
      content: '',
      timestamp: Date.now(),
      model: activeSession.model || activeProvider.defaultModel,
      providerName: activeProvider.name,
    };

    updateCurrentSession((prev) => {
      const nextMessages = [...prev.messages];
      const updatedVersions = [...targetMsg.versions, newVersion];
      nextMessages[targetIndex] = {
        ...targetMsg,
        versions: updatedVersions,
        currentVersionIndex: newVersionIndex,
      };
      return { ...prev, messages: nextMessages };
    });

    setIsStreaming(true);
    setStreamingMessageId(messageId);
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const requestStartTime = Date.now();

    const rollTimelineId = targetMsg.timelineId || activeSession.activeTimelineId;
    const sessionTimelines = activeSession.timelines || [];
    const rollBranch =
      sessionTimelines.find((t) => t.id === rollTimelineId) || sessionTimelines[0];

    const timelinePrompt =
      activeSession.timelineMemoryEnabled && rollBranch
        ? buildTimelineTreePromptContext(rollBranch, sessionTimelines, contextMessages)
        : undefined;

    try {
      const finalReply = await sendChatMessage({
        provider: activeProvider,
        agent: activeAgent,
        model: activeSession.model || activeProvider.defaultModel,
        messages: contextMessages,
        systemInstruction: activeSession.systemPromptOverride || activeAgent.systemPrompt,
        temperature: activeAgent.temperature,
        aiContextVisibility: activeSession.aiContextVisibility || 'all',
        connectedKnowledge: connectedKnowledgeItems,
        activeSkills: activeConnectedSkills,
        activeMcpServers: mcpServers,
        regexRules: regexRules,
        timelineContextPrompt: timelinePrompt,
        signal: controller.signal,
        onChunk: (accumulated) => {
          updateCurrentSession((prev) => {
            const nextMessages = [...prev.messages];
            const currentM = nextMessages[targetIndex];
            if (currentM) {
              const vArr = [...currentM.versions];
              vArr[newVersionIndex] = {
                ...vArr[newVersionIndex],
                content: accumulated,
              };
              nextMessages[targetIndex] = {
                ...currentM,
                versions: vArr,
              };
            }
            return { ...prev, messages: nextMessages };
          });
        },
      });

      const latencyMs = Date.now() - requestStartTime;
      const tokensCount = estimateTokens(finalReply || '');

      if (finalReply) {
        updateCurrentSession((prev) => {
          const nextMessages = [...prev.messages];
          const currentM = nextMessages[targetIndex];
          if (currentM) {
            const vArr = [...currentM.versions];
            vArr[newVersionIndex] = {
              ...vArr[newVersionIndex],
              content: finalReply,
              latencyMs,
              tokens: tokensCount,
            };
            nextMessages[targetIndex] = {
              ...currentM,
              versions: vArr,
              latencyMs,
              tokens: tokensCount,
            };
          }
          return { ...prev, messages: nextMessages };
        });
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        const errorText = `[重新生成分支失败]: ${err.message || '未知错误'}`;
        const latencyMs = Date.now() - requestStartTime;
        updateCurrentSession((prev) => {
          const nextMessages = [...prev.messages];
          const currentM = nextMessages[targetIndex];
          if (currentM) {
            const vArr = [...currentM.versions];
            vArr[newVersionIndex] = {
              ...vArr[newVersionIndex],
              content: errorText,
              latencyMs,
            };
            nextMessages[targetIndex] = {
              ...currentM,
              versions: vArr,
              latencyMs,
            };
          }
          return { ...prev, messages: nextMessages };
        });
      }
    } finally {
      setIsStreaming(false);
      setStreamingMessageId(null);
      abortControllerRef.current = null;
    }
  };

  const handleSwitchVersion = (messageId: string, versionIndex: number) => {
    updateCurrentSession((prev) => {
      const nextMessages = prev.messages.map((m) => {
        if (m.id === messageId) {
          return {
            ...m,
            currentVersionIndex: versionIndex,
          };
        }
        return m;
      });
      return { ...prev, messages: nextMessages };
    });
  };

  const handleEditContent = (messageId: string, newContent: string) => {
    updateCurrentSession((prev) => {
      const nextMessages = prev.messages.map((m) => {
        if (m.id === messageId) {
          if (m.role === 'assistant') {
            const nextVersions = [...m.versions];
            const vIdx = m.currentVersionIndex ?? 0;
            if (nextVersions[vIdx]) {
              nextVersions[vIdx] = {
                ...nextVersions[vIdx],
                content: newContent,
              };
            }
            return { ...m, versions: nextVersions };
          } else {
            return { ...m, content: newContent };
          }
        }
        return m;
      });
      return { ...prev, messages: nextMessages };
    });
  };

  const handleDeleteMessage = (messageId: string) => {
    updateCurrentSession((prev) => ({
      ...prev,
      messages: prev.messages.filter((m) => m.id !== messageId),
    }));
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsStreaming(false);
    setStreamingMessageId(null);
  };

  const handleChangeAiContextVisibility = (mode: AiContextVisibilityFilter) => {
    updateCurrentSession((prev) => ({
      ...prev,
      aiContextVisibility: mode,
    }));
  };

  const handleChangeUiRenderLimit = (limit: number) => {
    updateCurrentSession((prev) => ({
      ...prev,
      uiRenderLimit: limit,
    }));
  };

  const handleRenameSession = (sessionId: string, newTitle: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, title: newTitle } : s))
    );
  };

  const handleClearSession = (sessionId: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, messages: [] } : s))
    );
  };

  const handleDeleteSession = (sessionId: string) => {
    const remaining = sessions.filter((s) => s.id !== sessionId);
    if (remaining.length === 0) {
      handleNewSession();
    } else {
      setSessions(remaining);
      if (activeSessionId === sessionId) {
        setActiveSessionId(remaining[0].id);
      }
    }
  };

  const handleMoveSessionGroup = (sessionId: string, targetGroupId: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, groupId: targetGroupId } : s))
    );
  };

  const handleToggleConnectKnowledge = (id: string) => {
    updateCurrentSession((prev) => {
      const current = prev.connectedKnowledgeIds || [];
      const next = current.includes(id)
        ? current.filter((kId) => kId !== id)
        : [...current, id];
      return { ...prev, connectedKnowledgeIds: next };
    });
  };

  const handleToggleConnectSkill = (id: string) => {
    updateCurrentSession((prev) => {
      const current = prev.connectedSkillIds || [];
      const next = current.includes(id)
        ? current.filter((sId) => sId !== id)
        : [...current, id];
      return { ...prev, connectedSkillIds: next };
    });
  };

  const handleToggleMcpServer = (id: string) => {
    setMcpServers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const handleSaveMcpServer = (server: McpServerConfig) => {
    setMcpServers((prev) => {
      const idx = prev.findIndex((s) => s.id === server.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = server;
        return copy;
      }
      return [server, ...prev];
    });
  };

  const handleDeleteMcpServer = (id: string) => {
    setMcpServers((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSaveSkill = (skill: AgentSkill) => {
    setSkills((prev) => {
      const idx = prev.findIndex((s) => s.id === skill.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = skill;
        return copy;
      }
      return [skill, ...prev];
    });
  };

  const handleDeleteSkill = (id: string) => {
    setSkills((prev) => prev.filter((s) => s.id !== id));
  };

  const handleToggleRegexRule = (id: string) => {
    setRegexRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const handleSaveRegexRule = (rule: RegexRule) => {
    setRegexRules((prev) => {
      const idx = prev.findIndex((r) => r.id === rule.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = rule;
        return copy;
      }
      return [rule, ...prev];
    });
  };

  const handleDeleteRegexRule = (id: string) => {
    setRegexRules((prev) => prev.filter((r) => r.id !== id));
  };

  const handleSaveKnowledgeItem = (item: KnowledgeItem) => {
    setKnowledgeBase((prev) => {
      const idx = prev.findIndex((k) => k.id === item.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = item;
        return copy;
      }
      return [item, ...prev];
    });
  };

  const handleDeleteKnowledgeItem = (id: string) => {
    setKnowledgeBase((prev) => prev.filter((k) => k.id !== id));
  };

  const handleApplyAsSystemPrompt = (promptContent: string, title: string) => {
    updateCurrentSession((prev) => ({
      ...prev,
      systemPromptOverride: promptContent,
    }));
  };

  const handleSelectAgent = (agentId: string) => {
    updateCurrentSession((prev) => ({
      ...prev,
      agentId,
    }));
  };

  const handleSaveAgent = (agent: Agent) => {
    setAgents((prev) => {
      const idx = prev.findIndex((a) => a.id === agent.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = agent;
        return copy;
      }
      return [agent, ...prev];
    });
  };

  const handleDeleteAgent = (agentId: string) => {
    setAgents((prev) => prev.filter((a) => a.id !== agentId));
  };

  const handleSavePrompt = (prompt: PromptPreset) => {
    setPrompts((prev) => {
      const idx = prev.findIndex((p) => p.id === prompt.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = prompt;
        return copy;
      }
      return [prompt, ...prev];
    });
  };

  const handleDeletePrompt = (promptId: string) => {
    setPrompts((prev) => prev.filter((p) => p.id !== promptId));
  };

  const handleSaveProvider = (provider: ApiProviderConfig) => {
    setProviders((prev) => {
      const idx = prev.findIndex((p) => p.id === provider.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = provider;
        return copy;
      }
      return [...prev, provider];
    });
  };

  const handleDeleteProvider = (providerId: string) => {
    setProviders((prev) => prev.filter((p) => p.id !== providerId));
  };

  const handleSaveGroup = (group: ChatGroup) => {
    setGroups((prev) => {
      const idx = prev.findIndex((g) => g.id === group.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = group;
        return copy;
      }
      return [...prev, group];
    });
  };

  const handleDeleteGroup = (groupId: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.groupId === groupId ? { ...s, groupId: 'group-default' } : s))
    );
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
  };

  const handleExportData = () => {
    const dataStr = Storage.exportAllData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omnichat-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (jsonStr: string): boolean => {
    const ok = Storage.importAllData(jsonStr);
    if (ok) {
      setSessions(Storage.getSessions());
      setProviders(Storage.getProviders());
      setAgents(Storage.getAgents());
      setGroups(Storage.getGroups());
      setPrompts(Storage.getPrompts());
      setRegexRules(Storage.getRegexRules());
      setWorldDocuments(Storage.getWorldDocuments());
      setWebdavConfig(Storage.getWebDavConfig());
    }
    return ok;
  };

  const handleImportData = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json,application/json';
    fileInput.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          const ok = handleImportJson(content);
          if (ok) {
            alert('数据导入成功！页面将自动刷新应用配置。');
            window.location.reload();
          } else {
            alert('导入失败，请检查备份文件格式是否正确。');
          }
        }
      };
      reader.readAsText(file);
    };
    fileInput.click();
  };

  // 4.4 标签与通用状态交互
  const lastUserMessage = [...(activeSession?.messages || [])]
    .reverse()
    .find((m) => m.role === 'user');
  const lastUserMessageTimelineId = lastUserMessage?.timelineId;

  const handleToggleCommon = (messageId: string) => {
    updateCurrentSession((prev) => {
      const nextMessages = prev.messages.map((m) => {
        if (m.id === messageId) {
          const nextIsCommon = !m.isCommon;
          return {
            ...m,
            isCommon: nextIsCommon,
            codeTag: nextIsCommon ? '通用' : (m.codeTag === '通用' ? undefined : m.codeTag),
            descriptionTag: nextIsCommon ? '通用世界观' : m.descriptionTag,
          };
        }
        return m;
      });
      return { ...prev, messages: nextMessages };
    });
  };

  const handleToggleAnalysisVisibility = (messageId: string) => {
    updateCurrentSession((prev) => {
      const nextMessages = prev.messages.map((m) => {
        if (m.id === messageId) {
          const currentVis = m.analysisVisibility || 'visible';
          return {
            ...m,
            analysisVisibility: (currentVis === 'visible' ? 'hidden' : 'visible') as 'visible' | 'hidden',
          };
        }
        return m;
      });
      return { ...prev, messages: nextMessages };
    });
  };

  const handleSaveAnalysisToDoc = (message: ChatMessage) => {
    const content =
      message.role === 'assistant'
        ? (message.versions[message.currentVersionIndex] || message.versions[0])?.content || message.content
        : message.content;

    const newDoc: WorldDocument = {
      id: `doc-analysis-${Date.now()}`,
      title: `心理博弈分析·#${message.floorNumber || 1} (${message.codeTag || '分析'})`,
      category: 'analysis',
      content,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: ['角色分析', message.codeTag || '分析'],
    };

    setWorldDocuments((prev) => {
      const next = [newDoc, ...prev];
      Storage.setWorldDocuments(next);
      return next;
    });
    alert('已将本篇角色心理动力学分析归档至世界观文档库！');
  };

  // 十、角色关系分析 Agent 独立调用
  const handleTriggerRoleAnalysis = async () => {
    if (isStreaming) return;
    const sessionTimelines = activeSession.timelines || [];
    const activeTimeline =
      sessionTimelines.find((t) => t.id === activeSession.activeTimelineId) ||
      sessionTimelines[0];

    const branchCode = activeTimeline?.codeTag || activeTimeline?.tag || '通用';
    const branchName = activeTimeline?.descriptionTag || activeTimeline?.name || '主线';

    const contextSnippets = activeSession.messages
      .map((m) => {
        const text =
          m.role === 'assistant'
            ? (m.versions[m.currentVersionIndex] || m.versions[0])?.content || m.content
            : m.content;
        const tag = m.codeTag || '通用';
        return `[${tag}] #${m.floorNumber || 1} ${m.role === 'user' ? '用户' : 'AI'}: ${text}`;
      })
      .join('\n');

    setIsStreaming(true);
    const tempMsgId = `analysis-${Date.now()}`;
    const maxFloor = activeSession.messages.reduce(
      (max, m) => Math.max(max, m.floorNumber || 0),
      0
    );

    const initialMsg: ChatMessage = {
      id: tempMsgId,
      role: 'assistant',
      content: '正在启动角色关系分析 Agent 进行深层心理学研判...',
      timestamp: Date.now(),
      floorNumber: maxFloor + 1,
      timelineId: activeSession.activeTimelineId,
      codeTag: '分析',
      descriptionTag: '角色心理博弈',
      isAnalysis: true,
      analysisVisibility: 'visible',
      analysisBranchCode: branchCode,
      versions: [
        {
          content: '正在启动角色关系分析 Agent 进行深层心理学研判...',
          timestamp: Date.now(),
          model: activeSession.model || activeProvider.defaultModel,
          providerName: activeProvider.name,
        },
      ],
      currentVersionIndex: 0,
    };

    updateCurrentSession((prev) => ({
      ...prev,
      messages: [...prev.messages, initialMsg],
    }));

    try {
      const report = await analyzeRoleRelationships({
        provider: activeProvider,
        model: activeSession.model || activeProvider.defaultModel,
        contextText: contextSnippets || '暂无详细历史记录。',
        currentBranchCode: branchCode,
        currentBranchName: branchName,
      });

      updateCurrentSession((prev) => ({
        ...prev,
        messages: prev.messages.map((m) => {
          if (m.id === tempMsgId) {
            return {
              ...m,
              content: report,
              versions: [
                {
                  content: report,
                  timestamp: Date.now(),
                  model: activeSession.model || activeProvider.defaultModel,
                  providerName: activeProvider.name,
                },
              ],
            };
          }
          return m;
        }),
      }));
    } catch (err: any) {
      updateCurrentSession((prev) => ({
        ...prev,
        messages: prev.messages.map((m) => {
          if (m.id === tempMsgId) {
            const failText = `[分析 Agent 调用失败]: ${err.message || '网络连接超时'}`;
            return {
              ...m,
              content: failText,
              versions: [{ content: failText, timestamp: Date.now() }],
            };
          }
          return m;
        }),
      }));
    } finally {
      setIsStreaming(false);
    }
  };

  // 2.4 窗口内全文搜索直达
  const handleJumpToMessage = (messageId: string) => {
    setIsSearchModalOpen(false);
    setTimeout(() => {
      const el = document.getElementById(`msg-${messageId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-2', 'ring-indigo-500', 'rounded-2xl', 'transition-all');
        setTimeout(() => {
          el.classList.remove('ring-2', 'ring-indigo-500');
        }, 2500);
      }
    }, 100);
  };

  // 世界观文档管理
  const handleSaveWorldDocument = (doc: WorldDocument) => {
    setWorldDocuments((prev) => {
      const idx = prev.findIndex((d) => d.id === doc.id);
      let next: WorldDocument[];
      if (idx >= 0) {
        next = [...prev];
        next[idx] = doc;
      } else {
        next = [doc, ...prev];
      }
      Storage.setWorldDocuments(next);
      return next;
    });
  };

  const handleDeleteWorldDocument = (docId: string) => {
    setWorldDocuments((prev) => {
      const next = prev.filter((d) => d.id !== docId);
      Storage.setWorldDocuments(next);
      return next;
    });
  };

  const handleInjectDocAsPrompt = (content: string, target: 'fixed' | 'common') => {
    if (target === 'fixed') {
      updateCurrentSession((prev) => ({
        ...prev,
        systemPromptFixed: prev.systemPromptFixed ? `${prev.systemPromptFixed}\n\n${content}` : content,
        systemPromptOverride: prev.systemPromptFixed ? `${prev.systemPromptFixed}\n\n${content}` : content,
      }));
    } else {
      updateCurrentSession((prev) => ({
        ...prev,
        systemPromptInjectedCommon: prev.systemPromptInjectedCommon ? `${prev.systemPromptInjectedCommon}\n\n${content}` : content,
        isCommonPushed: true,
      }));
    }
    alert(`设定文档内容已成功注入至【${target === 'fixed' ? '本身的提示词' : '注入的通用'}】区域！`);
  };

  // 3.1 双框提示词区域逻辑
  const handleSaveDualBoxPrompt = (fixedPrompt: string, commonPrompt: string, isCommonPushed: boolean) => {
    updateCurrentSession((prev) => ({
      ...prev,
      systemPromptFixed: fixedPrompt,
      systemPromptInjectedCommon: commonPrompt,
      systemPromptOverride: fixedPrompt,
      isCommonPushed,
    }));
  };

  const handlePushCommonMessages = () => {
    const commonMessages = (activeSession.messages || []).filter(
      (m) => m.isCommon || m.timelineId === 'timeline-main' || m.codeTag === '通用'
    );
    const commonSnippets = commonMessages.map((m) => {
      const floorStr = m.floorNumber ? `[来自 #${m.floorNumber}]` : '';
      const role = m.role === 'user' ? '用户设定' : '基础世界观';
      const content =
        m.role === 'assistant'
          ? (m.versions[m.currentVersionIndex] || m.versions[0])?.content || m.content
          : m.content;
      return `${floorStr} ${role}：${content.trim()}`;
    });

    const generated = commonSnippets.join('\n\n');
    updateCurrentSession((prev) => ({
      ...prev,
      systemPromptInjectedCommon: generated,
      isCommonPushed: true,
    }));
  };

  const handleRevertCommonMessages = () => {
    updateCurrentSession((prev) => ({
      ...prev,
      systemPromptInjectedCommon: '',
      isCommonPushed: false,
    }));
  };

  return (
    <div className={`flex flex-col h-screen w-full bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden select-none font-sans transition-colors`}>
      {/* Header - Simplified */}
      <Header
        currentSession={activeSession}
        theme={theme}
        uiMode={uiMode}
        onToggleUiMode={handleToggleUiMode}
        onOpenSidebar={() => setIsSidebarOpen(true)}
        onOpenSettings={() => setIsDisplaySettingsModalOpen(true)}
        onOpenTimelineModal={() => setIsTimelineModalOpen(true)}
        onOpenDocumentModal={() => setIsDocumentModalOpen(true)}
        onTriggerRoleAnalysis={handleTriggerRoleAnalysis}
      />

      {/* Main Conversation Window */}
      <main className="flex-1 flex flex-col min-h-0 relative">
        <ChatMessageList
          messages={activeSession.messages}
          agent={activeAgent}
          aiContextVisibility={activeSession.aiContextVisibility || 'all'}
          uiRenderLimit={activeSession.uiRenderLimit ?? 0}
          theme={theme}
          displaySettings={displaySettings}
          sessionTotalTokens={sessionTotalTokens}
          isStreaming={isStreaming}
          streamingMessageId={streamingMessageId}
          timelines={activeSession.timelines || []}
          activeTimelineId={activeSession.activeTimelineId}
          filterByActiveTimeline={filterByActiveTimeline}
          onToggleFilterByActiveTimeline={() => setFilterByActiveTimeline((prev) => !prev)}
          onOpenTimelineModal={(timelineId) => {
            if (timelineId && timelineId !== activeSession.activeTimelineId) {
              updateCurrentSession((prev) => ({ ...prev, activeTimelineId: timelineId }));
            }
            setIsTimelineModalOpen(true);
          }}
          onRoll={handleRollMessage}
          onSwitchVersion={handleSwitchVersion}
          onEditContent={handleEditContent}
          onDeleteMessage={handleDeleteMessage}
          onChangeAiContextVisibility={handleChangeAiContextVisibility}
          onChangeUiRenderLimit={handleChangeUiRenderLimit}
          onToggleCommon={handleToggleCommon}
          onToggleAnalysisVisibility={handleToggleAnalysisVisibility}
          onSaveAnalysisToDoc={handleSaveAnalysisToDoc}
        />

        {/* Mobile Chat Input Area */}
        <ChatInput
          onSendMessage={handleSendMessage}
          onStopGeneration={handleStopGeneration}
          isStreaming={isStreaming}
          activeAgent={activeAgent}
          aiContextVisibility={activeSession.aiContextVisibility || 'all'}
          connectedKnowledgeCount={connectedKnowledgeItems.length}
          activeRegexCount={regexRules.filter((r) => r.enabled).length}
          connectedSkillCount={activeConnectedSkills.length}
          activeMcpCount={mcpServers.filter((s) => s.enabled).length}
          theme={theme}
          onOpenPromptModal={() => setIsPromptModalOpen(true)}
          onOpenAgentModal={() => setIsAgentModalOpen(true)}
          onOpenVisibilityModal={() => setIsVisibilityModalOpen(true)}
          onOpenKnowledgeModal={() => setIsKnowledgeModalOpen(true)}
          onOpenRegexModal={() => setIsRegexModalOpen(true)}
          onOpenMcpModal={() => setIsMcpModalOpen(true)}
          onOpenSkillModal={() => setIsSkillModalOpen(true)}
          inputDraft={inputDraft}
          setInputDraft={handleDraftChange}
          timelines={activeSession.timelines || []}
          activeTimelineId={activeSession.activeTimelineId}
          onSelectTimeline={(tid) => updateCurrentSession((prev) => ({ ...prev, activeTimelineId: tid }))}
          tagDisplayMode={activeSession.tagDisplayMode || 'desc'}
          onToggleTagDisplayMode={() =>
            updateCurrentSession((prev) => ({
              ...prev,
              tagDisplayMode: prev.tagDisplayMode === 'code' ? 'desc' : 'code',
            }))
          }
          lastUserMessageTimelineId={lastUserMessageTimelineId}
          onTriggerRoleAnalysis={handleTriggerRoleAnalysis}
          onOpenDualBoxPromptModal={() => setIsDualBoxPromptModalOpen(true)}
          onOpenSearchModal={() => setIsSearchModalOpen(true)}
        />
      </main>

      {/* Sliding Sidebar Drawer */}
      <SidebarDrawer
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        sessions={sessions}
        groups={groups}
        agents={agents}
        theme={theme}
        uiMode={uiMode}
        onToggleUiMode={handleToggleUiMode}
        activeSessionId={activeSession.id}
        onSelectSession={(id) => setActiveSessionId(id)}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        onOpenGroupModal={() => setIsGroupModalOpen(true)}
        onOpenSettingsModal={() => setIsProviderModalOpen(true)}
        onOpenDisplaySettingsModal={() => setIsDisplaySettingsModalOpen(true)}
        onOpenTimelineModal={() => setIsTimelineModalOpen(true)}
        onOpenAgentModal={() => setIsAgentModalOpen(true)}
        onOpenPromptModal={() => setIsPromptModalOpen(true)}
        onOpenKnowledgeModal={() => setIsKnowledgeModalOpen(true)}
        onOpenRegexModal={() => setIsRegexModalOpen(true)}
        onOpenThemeModal={() => setIsThemeModalOpen(true)}
        onOpenMcpModal={() => setIsMcpModalOpen(true)}
        onOpenSkillModal={() => setIsSkillModalOpen(true)}
        onExportData={handleExportData}
        onImportData={handleImportData}
      />

      {/* Provider Settings Modal */}
      <ProviderModal
        isOpen={isProviderModalOpen}
        onClose={() => setIsProviderModalOpen(false)}
        providers={providers}
        activeProviderId={activeProviderId}
        onSelectProvider={(id) => {
          setActiveProviderId(id);
          updateCurrentSession((prev) => ({ ...prev, providerId: id }));
        }}
        onSaveProvider={handleSaveProvider}
        onDeleteProvider={handleDeleteProvider}
      />

      {/* Agent Modal */}
      <AgentModal
        isOpen={isAgentModalOpen}
        onClose={() => setIsAgentModalOpen(false)}
        agents={agents}
        activeAgentId={activeAgent.id}
        onSelectAgent={handleSelectAgent}
        onSaveAgent={handleSaveAgent}
        onDeleteAgent={handleDeleteAgent}
      />

      {/* Prompt Modal */}
      <PromptModal
        isOpen={isPromptModalOpen}
        onClose={() => setIsPromptModalOpen(false)}
        prompts={prompts}
        activeSystemPrompt={activeSession.systemPromptOverride}
        onInsertToInput={(content) => {
          setInputDraft((prev) => (prev ? `${prev}\n${content}` : content));
        }}
        onApplyAsSystemPrompt={handleApplyAsSystemPrompt}
        onSavePrompt={handleSavePrompt}
        onDeletePrompt={handleDeletePrompt}
      />

      {/* Group Modal */}
      <GroupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        groups={groups}
        sessions={sessions}
        onSaveGroup={handleSaveGroup}
        onDeleteGroup={handleDeleteGroup}
        onReorderGroups={setGroups}
      />

      {/* AI Visibility & UI Render Limit Modal */}
      <AiVisibilityModal
        isOpen={isVisibilityModalOpen}
        onClose={() => setIsVisibilityModalOpen(false)}
        currentAiContextMode={activeSession.aiContextVisibility || 'all'}
        uiRenderLimit={activeSession.uiRenderLimit ?? 0}
        theme={theme}
        onChangeAiContextMode={handleChangeAiContextVisibility}
        onChangeUiRenderLimit={handleChangeUiRenderLimit}
      />

      {/* Regex Modal */}
      <RegexModal
        isOpen={isRegexModalOpen}
        onClose={() => setIsRegexModalOpen(false)}
        rules={regexRules}
        theme={theme}
        onSaveRule={handleSaveRegexRule}
        onDeleteRule={handleDeleteRegexRule}
        onToggleRule={handleToggleRegexRule}
      />

      {/* Knowledge Base Modal */}
      <KnowledgeBaseModal
        isOpen={isKnowledgeModalOpen}
        onClose={() => setIsKnowledgeModalOpen(false)}
        knowledgeBase={knowledgeBase}
        connectedKnowledgeIds={activeSession.connectedKnowledgeIds || []}
        theme={theme}
        onSaveKnowledgeItem={handleSaveKnowledgeItem}
        onDeleteKnowledgeItem={handleDeleteKnowledgeItem}
        onToggleConnectToSession={handleToggleConnectKnowledge}
      />

      {/* MCP Modal */}
      <McpModal
        isOpen={isMcpModalOpen}
        onClose={() => setIsMcpModalOpen(false)}
        mcpServers={mcpServers}
        theme={theme}
        onSaveMcpServer={handleSaveMcpServer}
        onDeleteMcpServer={handleDeleteMcpServer}
        onToggleServer={handleToggleMcpServer}
      />

      {/* Skill Modal */}
      <SkillModal
        isOpen={isSkillModalOpen}
        onClose={() => setIsSkillModalOpen(false)}
        skills={skills}
        connectedSkillIds={activeSession.connectedSkillIds || []}
        theme={theme}
        onSaveSkill={handleSaveSkill}
        onDeleteSkill={handleDeleteSkill}
        onToggleConnectSkill={handleToggleConnectSkill}
      />

      {/* Theme Modal */}
      <ThemeModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        currentTheme={themePalette}
        onSelectTheme={setThemePalette}
      />

      {/* Message Display, WebDAV & Metadata Settings Modal */}
      <SettingsModal
        isOpen={isDisplaySettingsModalOpen}
        onClose={() => setIsDisplaySettingsModalOpen(false)}
        displaySettings={displaySettings}
        onChangeDisplaySettings={setDisplaySettings}
        webdavConfig={webdavConfig}
        onChangeWebDavConfig={(cfg) => {
          setWebdavConfig(cfg);
          Storage.setWebDavConfig(cfg);
        }}
        onExportJson={handleExportData}
        onImportJson={handleImportJson}
        theme={theme}
        sessionTotalTokens={sessionTotalTokens}
      />

      {/* Timeline Memory Organizer & Message Tree Modal */}
      <TimelineModal
        isOpen={isTimelineModalOpen}
        onClose={() => setIsTimelineModalOpen(false)}
        session={activeSession}
        theme={theme}
        onUpdateSession={updateCurrentSession}
        filterByActiveTimeline={filterByActiveTimeline}
        onToggleFilterByActiveTimeline={() => setFilterByActiveTimeline((prev) => !prev)}
      />

      {/* 3.1 双框提示词区域 Modal */}
      <PromptDualBoxModal
        isOpen={isDualBoxPromptModalOpen}
        onClose={() => setIsDualBoxPromptModalOpen(false)}
        session={activeSession}
        theme={theme}
        onSavePrompt={handleSaveDualBoxPrompt}
        onPushCommonMessages={handlePushCommonMessages}
        onRevertCommonMessages={handleRevertCommonMessages}
      />

      {/* 2.4 窗口内全文搜索 Modal */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        messages={activeSession.messages}
        timelines={activeSession.timelines || []}
        theme={theme}
        onJumpToMessage={handleJumpToMessage}
      />

      {/* 世界观设定与文档库 Modal */}
      <DocumentModal
        isOpen={isDocumentModalOpen}
        onClose={() => setIsDocumentModalOpen(false)}
        documents={worldDocuments}
        onSaveDocument={handleSaveWorldDocument}
        onDeleteDocument={handleDeleteWorldDocument}
        onInjectAsPrompt={handleInjectDocAsPrompt}
        theme={theme}
      />
    </div>
  );
}

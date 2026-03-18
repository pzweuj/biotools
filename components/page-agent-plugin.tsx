"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, Bot, Settings, Play, X, Send } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useI18n } from "@/lib/i18n"

interface PageAgentConfig {
  model: string
  baseURL: string
  apiKey: string
}

const DEFAULT_CONFIG: PageAgentConfig = {
  model: "qwen3.5-plus",
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  apiKey: ""
}

// 动态导入 PageAgent
let PageAgent: any = null

interface Message {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: Date
}

export function PageAgentPlugin() {
  const { locale } = useI18n()
  const [isOpen, setIsOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [config, setConfig] = useState<PageAgentConfig>(DEFAULT_CONFIG)
  const [isMounted, setIsMounted] = useState(false)
  const [isAgentRunning, setIsAgentRunning] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const agentRef = useRef<any>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // 翻译函数
  const translate = (zhText: string, enText: string) => locale === "zh" ? zhText : enText

  // 确保只在客户端运行
  useEffect(() => {
    setIsMounted(true)
    // 动态导入 PageAgent
    import("page-agent").then((module) => {
      PageAgent = module.PageAgent
    })
    // 从 localStorage 加载配置
    const saved = localStorage.getItem("page-agent-config")
    if (saved) {
      setConfig(JSON.parse(saved))
    }
  }, [])

  // 控制 body 类名以调整主内容区域
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("agent-panel-open")
    } else {
      document.body.classList.remove("agent-panel-open")
    }
  }, [isOpen])

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (agentRef.current) {
        agentRef.current.dispose()
        agentRef.current = null
      }
    }
  }, [])

  if (!isMounted) {
    return null
  }

  const addMessage = (role: Message["role"], content: string) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date()
    }])
  }

  const startAgent = async () => {
    if (!config.apiKey.trim()) {
      setShowSettings(true)
      return
    }

    // 如果已有 agent，先清理
    if (agentRef.current) {
      agentRef.current.dispose()
      agentRef.current = null
    }

    try {
      // 保存配置到 localStorage
      localStorage.setItem("page-agent-config", JSON.stringify(config))

      // 创建新的 PageAgent 实例
      const agent = new PageAgent({
        model: config.model,
        baseURL: config.baseURL,
        apiKey: config.apiKey,
        language: locale === "zh" ? "zh-CN" : "en-US",
      })

      agentRef.current = agent

      // 强制隐藏 panel - 通过覆盖 panel.show 方法
      const originalShow = agent.panel.show.bind(agent.panel)
      agent.panel.show = () => {
        originalShow()
        // 立即隐藏
        setTimeout(() => agent.panel.hide(), 0)
      }

      // 监听 panel 相关的 DOM 事件来隐藏它
      const hidePanel = () => {
        if (agent.panel && agent.panel.element) {
          agent.panel.hide()
        }
      }

      // 初始隐藏
      setTimeout(() => {
        if (agent.panel) {
          agent.panel.hide()
          // 如果面板元素存在，设置样式隐藏
          const panelEl = document.querySelector('[class*="page-agent"]')
          if (panelEl) {
            (panelEl as HTMLElement).style.display = 'none'
          }
        }
      }, 100)

      // 监听历史变化来显示执行步骤
      agent.addEventListener("historychange", () => {
        const history = agent.history
        if (history.length > 0) {
          const lastEvent = history[history.length - 1]
          if (lastEvent.type === "step") {
            addMessage("system", `执行: ${lastEvent.action.name}`)
          } else if (lastEvent.type === "observation") {
            addMessage("assistant", lastEvent.content)
          }
        }
      })

      // 添加系统消息
      addMessage("system", translate("Agent 已启动，请描述你想要执行的任务", "Agent started. Describe the task you want to execute."))
      setIsAgentRunning(true)

    } catch (error: any) {
      console.error("Failed to start agent:", error)
      addMessage("system", `${translate("启动失败", "Failed to start")}: ${error.message}`)
    }
  }

  const executeTask = async () => {
    if (!inputValue.trim() || !agentRef.current) return

    const task = inputValue
    setInputValue("")
    addMessage("user", task)

    try {
      const result = await agentRef.current.execute(task)
      if (result.success) {
        addMessage("assistant", result.data || translate("任务完成", "Task completed"))
      } else {
        addMessage("assistant", `${translate("任务失败", "Task failed")}: ${result.data}`)
      }
    } catch (error: any) {
      addMessage("assistant", `${translate("执行错误", "Execution error")}: ${error.message}`)
    }
  }

  const stopAgent = () => {
    if (agentRef.current) {
      agentRef.current.stop()
      agentRef.current.dispose()
      agentRef.current = null
    }
    setIsAgentRunning(false)
    setMessages([])
    addMessage("system", translate("Agent 已停止", "Agent stopped"))
  }

  // 设置页面
  if (showSettings) {
    return (
      <>
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className={`fixed right-0 top-1/2 -translate-y-1/2 z-50 font-mono transition-all duration-300 ${
            isOpen ? "right-[400px]" : "right-0"
          } rounded-l-lg rounded-r-none h-24 w-10 flex flex-col items-center justify-center gap-1`}
          variant="default"
        >
          <Bot className="w-5 h-5" />
          {isOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>

        <div
          className={`fixed right-0 top-14 h-[calc(100vh-3.5rem)] w-[400px] bg-background border-l shadow-xl z-40 transition-transform duration-300 overflow-hidden ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <Card className="w-full h-full border-0 rounded-none shadow-none flex flex-col">
            <CardHeader className="border-b py-3 flex-shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-mono flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  {translate("设置", "Settings")}
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowSettings(false)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="space-y-2">
                <label className="font-mono text-xs">
                  API Key
                </label>
                <Input
                  type="password"
                  placeholder="sk-..."
                  value={config.apiKey}
                  onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                  className="terminal-input font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="font-mono text-xs">
                  Model
                </label>
                <Input
                  placeholder="qwen3.5-plus"
                  value={config.model}
                  onChange={(e) => setConfig({ ...config, model: e.target.value })}
                  className="terminal-input font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="font-mono text-xs">
                  Base URL
                </label>
                <Input
                  placeholder="https://dashscope.aliyuncs.com/compatible-mode/v1"
                  value={config.baseURL}
                  onChange={(e) => setConfig({ ...config, baseURL: e.target.value })}
                  className="terminal-input font-mono text-sm"
                />
              </div>

              <div className="pt-4 border-t space-y-2">
                <Button
                  onClick={() => {
                    setShowSettings(false)
                    startAgent()
                  }}
                  className="w-full font-mono text-sm"
                  disabled={!config.apiKey.trim()}
                >
                  <Play className="w-4 h-4 mr-1" />
                  {translate("启动 Agent", "Start Agent")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  // 对话页面
  return (
    <>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed right-0 top-1/2 -translate-y-1/2 z-50 font-mono transition-all duration-300 ${
          isOpen ? "right-[400px]" : "right-0"
        } rounded-l-lg rounded-r-none h-24 w-10 flex flex-col items-center justify-center gap-1`}
        variant="default"
      >
        <Bot className="w-5 h-5" />
        {isOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </Button>

      <div
        className={`fixed right-0 top-14 h-[calc(100vh-3.5rem)] w-[400px] bg-background border-l shadow-xl z-40 transition-transform duration-300 flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <Card className="w-full h-full border-0 rounded-none shadow-none flex flex-col">
          {/* 头部 */}
          <CardHeader className="border-b py-3 flex-shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-mono flex items-center gap-2">
                <Bot className="w-4 h-4" />
                Page Agent
                {isAgentRunning && (
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                )}
              </CardTitle>
              <div className="flex items-center gap-1">
                {!isAgentRunning ? (
                  <Button variant="ghost" size="sm" onClick={() => setShowSettings(true)}>
                    <Settings className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" onClick={stopAgent}>
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          {/* 消息区域 */}
          <div className="flex-1 overflow-y-auto px-4 py-2" ref={scrollRef}>
            <div className="space-y-3">
              {!isAgentRunning ? (
                <div className="text-center space-y-4 py-8">
                  <Bot className="w-12 h-12 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground font-mono">
                    {translate(
                      "点击下方按钮启动 AI 代理",
                      "Click the button below to start the AI agent"
                    )}
                  </p>
                  <Button onClick={startAgent} className="font-mono text-sm">
                    <Play className="w-4 h-4 mr-1" />
                    {translate("启动 Agent", "Start Agent")}
                  </Button>
                </div>
              ) : (
                <>
                  {messages.length === 0 && (
                    <div className="text-center text-muted-foreground font-mono text-xs py-4">
                      {translate(
                        "描述你想要执行的任务",
                        "Describe the task you want to execute"
                      )}
                    </div>
                  )}
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === "user" ? "justify-end" : msg.role === "system" ? "justify-center" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg px-3 py-2 font-mono text-xs ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : msg.role === "system"
                            ? "bg-muted text-muted-foreground text-center w-full"
                            : "bg-muted"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* 输入区域 */}
          {isAgentRunning && (
            <div className="p-3 border-t flex-shrink-0 space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder={translate("输入任务描述...", "Enter task description...")}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="terminal-input font-mono text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      executeTask()
                    }
                  }}
                />
                <Button onClick={executeTask} size="icon">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </>
  )
}
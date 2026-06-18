# BioTools

[English](./README.en.md) | 中文

一个现代化的生物信息学工具集合，提供常用的分子生物学计算和参考工具。

## 🔒 隐私优先 / 本地计算

**所有计算都在你的浏览器中本地完成** —— 序列、引物、qPCR Cq 表、VCF 等数据**永远不会**上传到服务器。

- 🔒 **本地工具（27+）**：序列分析、引物 Tm、PCR、qPCR、TMB、限制酶、稀释、缓冲液… 全部在浏览器内执行。
- 🌐 **联网工具（6 个）**：Mutalyzer、SpliceAI、TransVar、ManeLoca、DeepHPO、Warfarin 调用各自上游 API；侧边栏明确标记 `🌐 Online` 徽章。
- 🚫 **零账号、零云存储**：没有登录、没有用户数据库、没有日志。
- 🚫 **零 AI 入参**：项目实验性的 PageAgent 已下线，不会把你的输入交给任何大模型。
- 📊 仅启用 [Vercel Analytics](https://vercel.com/docs/analytics) 的访问统计（PV / Web Vitals 指标），**不收集任何输入数据**。

## 🚀 快速开始

### 环境要求
- Node.js 20.0 或更高版本
- pnpm 9（推荐）或 npm

### 安装与运行
```bash
pnpm install        # 安装依赖
pnpm dev            # 本地开发（http://localhost:3000）
pnpm build          # 生产构建
pnpm start          # 启动生产服务
```

### 质量门禁
```bash
pnpm typecheck      # TypeScript 严格检查
pnpm test           # 单元测试（vitest）
pnpm test:coverage  # 覆盖率报告
pnpm lint           # ESLint
```

## 🛠️ 技术栈

- **框架**: Next.js 16（Turbopack）
- **语言**: TypeScript 5（strict 模式 + `tsc --noEmit` CI gate）
- **UI**: Tailwind CSS v4 + Radix UI + next-themes（含暗黑模式）
- **图表**: Recharts（按工具懒加载）
- **测试**: Vitest
- **部署**: Vercel

## 🤝 需求

如需要新的功能，请在 [Issues](https://github.com/pzweuj/biotools/issues) 中提出。我们欢迎任何形式的贡献！

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

---

如果这个项目对你有帮助，请给它一个 ⭐️！

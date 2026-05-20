# 需求通 - 商业化升级计划

## 当前状态：可演示 MVP
- PostgreSQL 数据库（已切换，通过 Prisma ORM）
- 已接入 DeepSeek / OpenAI / Anthropic Claude（真实 AI 调用，需配置 API Key）
- AI Provider 显式选择 + fallback 链（需 AI_FALLBACK=true）
- Mock AI 兜底（无 Key 时自动降级）
- 异步 AI 任务系统（`/api/ai-jobs`，支持萃取/PRD 生成异步执行）
- 无认证、无权限体系、无团队/组织/成员管理
- 分页、排序、搜索防抖、状态枚举、状态流转校验、错误状态已就绪
- PRD Prompt 已改为"证据/推断/待确认"三栏
- AI 状态栏显示 provider、model、mock、fallback、最近错误
- Seed 接口受 NODE_ENV + SEED_SECRET 双重保护

## 商业化必做清单（按优先级）

### Phase 1：真实可用（让产品能跑起来）
- [x] 切换到真实 AI（DeepSeek / OpenAI / Claude）
- [x] AI Provider 显式选择 + fallback 链
- [x] 需求列表分页 + 排序 + 搜索防抖
- [x] AI 失败状态（failed）+ 重试入口
- [x] 状态流转校验（防止非法状态变更）
- [x] PRD Prompt 证据/推断/待确认三栏
- [x] AI 状态栏（provider、model、mock、fallback、错误）
- [x] Seed 接口安全加固
- [x] 生产数据库（PostgreSQL，已通过 Prisma adapter 切换）
- [ ] 用户认证（NextAuth / Clerk）
- [ ] 文件上传（客户聊天记录文件、音频）
- [ ] 错误监控 + 日志

### Phase 2：核心增强（让产品好用）
- [x] 萃取结果编辑（人工修正 AI 输出）
- [x] PRD 版本管理 + diff 对比
- [ ] 需求关联推荐（升级为 embedding 语义检索）
- [ ] 导出功能（PDF / Word / Markdown）

### Phase 3：团队协作（让产品能多人用）
- [ ] 团队 / 组织管理
- [ ] 需求分配 + 评论 @功能
- [ ] 审批工作流（多级审批）
- [ ] 通知系统（邮件 / WebSocket）

### Phase 4：高级功能（让产品有壁垒）
- [ ] 语音转写（Whisper / GPT-4o Transcribe）
- [ ] 向量检索（pgvector 相似需求推荐）
- [ ] 自定义 Prompt 模板
- [ ] API 开放接口
- [ ] 数据分析报表

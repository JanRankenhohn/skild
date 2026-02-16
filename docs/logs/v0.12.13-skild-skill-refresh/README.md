# 2026-02-16 Skild Skill Docs Refresh

## 背景 / 问题

- skild 技能文档与当前 CLI 选项、平台清单存在偏差
- 缺少对多技能来源选择、scope 默认值、discover 查询能力的说明

## 决策

- 以 CLI 真实能力为准更新 skills/skild 文档
- 补齐 install/update/uninstall 的 scope 说明与 config 默认值
- 增加 discover API 的过滤/排序说明与平台路径表（含 project 路径）

## 变更内容

- skills/skild/SKILL.md：更新版本号、discover 参数、安装别名、平台路径与默认配置说明
- skills/skild/commands.md：补齐 install/uninstall/update 选项与目标平台清单
- skills/skild/troubleshooting.md：补齐 scope 默认值与 SKILD_HOME 说明

## 功能说明

- 目标/范围：确保 skild 技能文档与 CLI 选项一致，降低错误使用成本
- 输入：文档阅读与命令使用（install/update/uninstall/search/sync/config）
- 输出：更准确的选项与路径说明，减少误导
- 默认策略与边界：以 CLI 源码为准，不新增新能力

## 使用方式

```bash
# 多技能来源时选择一个
skild install owner/repo --skill skills/pdf

# 设置默认平台与 scope
skild config set defaultPlatform codex
skild config set defaultScope project
```

## 验证（怎么确认符合预期）

```bash
pnpm build
pnpm lint
pnpm typecheck

tmpdir="$(mktemp -d)"
cd "$tmpdir"
SKILD_HOME="$tmpdir/home" node /Users/peiwang/Projects/skild/packages/cli/dist/index.js --help
```

验收点：

- build/lint/typecheck 全部通过
- `skild --help` 正常输出且无报错

## 发布 / 部署

无（仅文档更新）

## 影响范围 / 风险

- Breaking change? 否
- 回滚方式：回退文档变更

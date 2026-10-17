# Benchmark Studio

benchmark 从跑到看的工作台，覆盖两段流程：

1. **跑之前**：把题目 prompt 和 `shared-prompt.md` 拼成可以直接粘贴到 harness 的完整 prompt（「Prompt」页）。
2. **跑之后**：按每个产出目录里的 `bench.json` 一键启动、预览、停止（「预览」页）。

`bench.json` 不由 Studio 猜，由 [bench-launch skill](../.agents/skills/bench-launch/SKILL.md) 在跑完之后统一补写。

## 启动

在**仓库根目录**直接运行：

```bash
pnpm install    # 第一次
pnpm dev        # http://127.0.0.1:5274
```

仓库根是一个只包含 `studio/` 的 pnpm workspace，不需要再 `cd studio`。根目录下可用的命令：

| 命令 | 作用 |
| --- | --- |
| `pnpm dev` | 启动 Studio（带实时扫盘和进程管理接口） |
| `pnpm bench status [project]` | 列出所有产出及其 `bench.json` 状态 |
| `pnpm bench check <产出>` | 只校验 `bench.json` |
| `pnpm bench run <产出> [--keep]` | 真实启动 → 等就绪 → 抓首页 → 停止；`--keep` 保持运行 |
| `pnpm prompt pelican gpt astra codex` | 打印拼好的 prompt |
| `pnpm typecheck` / `pnpm build` | 类型检查 / 产线构建 |

`<产出>` 可以写组合 id（`pelican/gpt/astra/codex`），也可以写目录路径。

## 推荐工作流

```
批量跑 benchmark（Prompt 页复制 prompt → 各 harness）
        ↓
调用 bench-launch skill：读懂各产出 → 写 bench.json → pnpm bench run 真实验证
        ↓
Studio 顶栏点刷新 → 预览页一键启动 / 查看 / 停止
```

## 数据约定

```
llm-benchmark/
├── package.json / pnpm-workspace.yaml     # 根 workspace，pnpm dev 从这里启动
├── shared-prompt.md                       # 所有题目共用的约束，含 /path/to/target 占位符
├── .agents/skills/bench-launch/           # 补写 bench.json 的 skill
├── benchmarks/
│   ├── catalog.txt                        # 组合全集：family/model/harness 的命名空间
│   └── <project>/
│       ├── prompt.md                      # 这个 benchmark 的题目
│       └── <family>/<model>/<harness>/    # 产出目录
│           └── bench.json                 # 启动规范（跑完后由 skill 补写）
└── studio/                                # 本项目
```

catalog.txt、拼装规则与原来一致：页面上的「组合」列完全由 catalog.txt 驱动；
拼装规则是 `prompt.md + 空行 + shared-prompt.md（占位符替换为产出目录绝对路径）`，
唯一实现在 [src/shared/compose.ts](src/shared/compose.ts)。

## 启动规范 bench.json

三种形态：`static`（直接托管）、`process`（起进程，端口由 Studio 分配）、`unavailable`（写明原因）。
字段说明和各种场景的写法见 [.agents/skills/bench-launch/references/spec.md](../.agents/skills/bench-launch/references/spec.md)，
校验逻辑只有一处实现：[src/shared/launch.ts](src/shared/launch.ts)，Studio、CLI 和 skill 共用。

进程管理（[server/runner.ts](server/runner.ts)）：

* 每次启动都是独立的进程组，停止时整组先 SIGTERM，3 秒后 SIGKILL；Studio 退出（Ctrl-C）时一起清理。
* `"auto"` 端口从 41000–41999 里挑空闲的，通过 `{port}` 占位符和 `PORT` / `PORT_<NAME>` 环境变量传给产出。
* 写死的端口启动前会检查是否被占用，被别的产出占用时会提示是哪一个。
* 最多同时运行 4 个，超出时停掉最早启动的那个。

## 界面

左边两栏和原来一样：项目、组合。右侧文档区分为两个页签：

* **Prompt**：合成预览加复制，和原来一样。
* **预览**：
  * `static` 产出直接内嵌显示；
  * `process` 产出显示启动命令，点「启动并预览」后显示进度，就绪后内嵌页面；
  * 顶部有状态、端口、重启、停止、刷新、新标签打开、在访达中显示；底部是日志面板，启动失败时自动展开；
  * 没有规范、规范有误、标为 unavailable 时，分别说明原因和下一步。

组合列表行尾的小点：空心灰 = 未跑，空心绿 = 已产出但没有规范，实心绿 = 可预览，带光圈 = 运行中，朱红 = 规范有误或上次启动失败。
页签右侧的「N 个运行中」可以跳到任意一个正在运行的产出，也可以直接停掉它。

| 快捷键 | 作用 |
| --- | --- |
| `↑` / `↓` | 切换组合 |
| `←` / `→` | 切换项目 |
| `P` / `V` | 切到 Prompt / 预览 |
| `R` / `S` | 预览页：启动 / 停止当前产出 |
| `/` | 聚焦筛选框，`Esc` 清空 |
| `⌘ ↵` / `Ctrl ↵` | 复制完整 Prompt |

地址形如 `#/pelican/gpt/astra/codex?view=preview`，可以收藏，刷新后保持。

## 接口

| 接口 | 说明 |
| --- | --- |
| `GET /api/manifest` | 每次重新扫盘：全集、覆盖情况、prompt 原文、各产出的启动规范状态 |
| `GET /api/prompt?project=&family=&model=&harness=` | 纯文本 prompt |
| `GET /api/reveal?path=` | 在访达中定位（只允许 `benchmarks/` 内的路径） |
| `GET /api/runs` | 全部运行状态 |
| `POST /api/run/start?id=` / `POST /api/run/stop?id=` | 启动 / 停止；必须带 `X-Bench-Studio: 1` 请求头 |
| `GET /api/run/logs?id=&after=` | 增量日志 |
| `GET /preview/<id>/...` | 托管 static 产出 |

Studio 只监听 `127.0.0.1`。起停接口要求带自定义请求头，被预览的产出跑在别的端口上，跨源发不出这种请求，所以产出页面没法反过来操纵 Studio。

## 本机环境的一个坑

DSH 自带的 node 启用了 hardened runtime，但没带 `com.apple.security.cs.disable-library-validation`
权限，因此**无法 `dlopen` 任何 ad-hoc 签名的 `.node` 原生模块**。这会影响 Vite 8 依赖的 rolldown 和 lightningcss：

* rolldown：加装 `@rolldown/binding-wasm32-wasi`，走 WASM 回退绕开；
* lightningcss：在 [vite.config.ts](vite.config.ts) 里把 `build.cssMinify` 指到 `esbuild` 绕开。

这两处不要随手删，否则 `pnpm dev` / `pnpm build` 在这台机器上会起不来。

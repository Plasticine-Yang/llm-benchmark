# Prompt Studio

把 `benchmarks/` 下的题目 prompt 和仓库根的 `shared-prompt.md` 拼成一段可以直接粘贴到
harness 里跑的 prompt，省掉手改产出路径这一步。

## 数据约定

```
llm-benchmark/
├── shared-prompt.md                       # 所有题目共用的那段约束，含 /path/to/target 占位符
├── benchmarks/
│   ├── catalog.txt                        # 组合全集：family/model/harness 的命名空间
│   └── <project>/
│       ├── prompt.md                      # 这个 benchmark 的题目
│       └── <family>/<model>/<harness>/     # 产出目录，四层
└── prompt-studio/                         # 本项目
```

* `<project>` —— benchmark 题目，例如 `pelican`。判定依据：目录里有 `prompt.md`。
* `<family>` —— 模型厂商 / 系列，例如 `gpt`、`deepseek`、`glm`、`grok`、`seed`。
* `<model>` —— 具体模型，例如 `astra`、`5-6-sol`、`v41-flash`、`4-5`。
* `<harness>` —— 跑这次产出的 agent，例如 `codex`、`dsh`、`opencode`、`grok-cli`。

## 组合全集：benchmarks/catalog.txt

```
gpt/astra            codex, doubao-work, traex
gpt/5-6-sol          codex, traex
deepseek/v4-flash    dsh, opencode, web
...
```

页面上的「组合」列**完全由这份清单驱动，与具体项目无关**。两条约定：

1. **每个项目都是全集的子集。** 项目目录里出现清单外的组合，顶栏会出现「扫描提示」，不会静默忽略。
2. **清单里的组合即使还没有产出目录也可以选。** 这正是跑新组合的入口 —— 选完就能拿到
   `<project>/<family>/<model>/<harness>` 的 target 路径，粘贴进 harness 直接开跑。

展示顺序沿用清单里的书写顺序，想调整顺序或新增模型 / harness 直接改这个文件，刷新页面即生效。

项目列会显示该项目的覆盖度（如 `18/23`），用来一眼看出哪个项目还差哪些组合。

## 拼装规则

```
benchmarks/<project>/prompt.md
        + 空行 +
shared-prompt.md（其中 /path/to/target 已替换为产出目录的绝对路径）
```

替换后的路径形如：

```
/Users/bytedance/code/projects/llm-benchmark/benchmarks/pelican/gpt/astra/codex
```

规则只有一处实现（[src/shared/compose.ts](src/shared/compose.ts)），网页和 CLI 共用。

## 用法

```bash
pnpm install
pnpm dev        # http://127.0.0.1:5274
```

界面是三栏：

* **项目** —— 每个项目带一条覆盖度点阵（一格对应全集里的一个组合，按 catalog.txt 顺序）和 `已跑/全集` 计数；
* **组合** —— 全集按厂商分组列出 `模型 / harness`，绿点表示当前项目已有产出；支持关键字筛选
  （空格分词同时命中，如 `gpt codex`）和「全部 / 已跑 / 待跑」切换；
* **文档区** —— 项目标题、组合、target 路径（仓库内部分加粗），以及合成预览：
  01 题目 prompt、空行、02 替换后的 shared-prompt（替换进去的路径高亮）。底部常驻操作条负责复制。

浅色 / 深色主题在顶栏右上角切换，默认跟随系统，选择会记住。目录结构的警告收在顶栏的「扫描提示」里。

| 快捷键 | 作用 |
| --- | --- |
| `↑` / `↓` | 在（筛选后的）组合间切换 |
| `←` / `→` | 切换项目 |
| `/` | 聚焦筛选框，`Esc` 清空 |
| `⌘ ↵` / `Ctrl ↵` | 复制完整 Prompt |

组合会同步到 URL hash，例如 `#/pelican/gpt/astra/codex`，可以收藏或分享；刷新后保持。

| 命令 | 作用 |
| --- | --- |
| `pnpm dev` | 开发服务器，带实时扫盘接口 |
| `pnpm build` | 类型检查 + 产线构建到 `dist/` |
| `pnpm preview` | 预览构建产物（接口同样可用） |
| `pnpm typecheck` | 只做类型检查 |
| `pnpm prompt` | 列出项目与全集组合 |
| `pnpm prompt pelican gpt astra codex` | 直接打印拼好的 prompt，可重定向到文件 |

## 接口

开发服务器（以及 `preview`）提供三个本地接口：

| 接口 | 说明 |
| --- | --- |
| `GET /api/manifest` | 每次请求都重新扫盘，返回全集 + 各项目覆盖情况 + prompt 原文 |
| `GET /api/prompt?project=&family=&model=&harness=` | 返回拼好的纯文本 prompt |
| `GET /api/reveal?path=` | 在访达中定位产出目录（只允许 `benchmarks/` 内的路径） |

因为是实时扫盘，**改 `catalog.txt` 或新建项目目录后刷新页面就生效**，不需要重新构建。

## 本机环境的一个坑

DSH 自带的 node 启用了 hardened runtime，但没带 `com.apple.security.cs.disable-library-validation`
权限，因此**无法 `dlopen` 任何 ad-hoc 签名的 `.node` 原生模块**。这会打到 Vite 8 依赖的
rolldown 和 lightningcss：

* rolldown —— 通过加装 `@rolldown/binding-wasm32-wasi` 走 WASM 回退绕开；
* lightningcss —— 在 [vite.config.ts](vite.config.ts) 里把 `build.cssMinify` 指到 `esbuild`
  绕开（esbuild 是子进程调用，不受这条限制）。

所以这两处不要随手删掉，否则 `pnpm dev` / `pnpm build` 在这台机器上会起不来。

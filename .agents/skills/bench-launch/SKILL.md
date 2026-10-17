---
name: bench-launch
description: 为 llm-benchmark 仓库里已经跑完的模型产出补写启动规范 bench.json，让 Benchmark Studio 能一键启动、预览、停止。用户说"规范启动方式""整理 benchmark 启动规范""给产出写 bench.json""这些产出在 studio 里起不来/看不了"，或批量跑完 benchmark 后要整理产出时使用。只写 bench.json，不改产出代码。
---

# bench-launch

`benchmarks/<project>/<family>/<model>/<harness>/` 下的每个产出都由不同模型写成，启动方式五花八门。本 skill 读懂每个产出，在它的目录里写一份 `bench.json`，并用真实启动验证。Studio 和 `pnpm bench` 只认 `bench.json`，不再猜。

## 硬规则

- **只写 `bench.json`，不碰产出的任何其他文件。** 产出是被评测对象，改一行代码就污染了结果。起不来就如实写 `unavailable`，别去修 bug。
- 允许 setup 装依赖、打包（会生成 node_modules / dist），但必须带 `unless`，已经有就跳过。
- 每份规范都要用 `pnpm bench run` 真实跑通才算完成；跑不通就继续改规范，或者降级为 `unavailable` 并写清原因。
- 命令都在仓库根目录执行。

## 流程

1. **盘点**：`pnpm bench status [project]`。要处理的是 `missing`、`invalid`、`empty`；用户点名了范围就只做那些。已经有合法规范的不动，除非用户要求重做。
2. **逐个读懂产出**（只看决定启动方式的部分）：
   - 目录里有什么：只有 html，还是有 `package.json`
   - `package.json` 的 scripts、锁文件（pnpm-lock → pnpm，package-lock → npm，都没有 → npm）
   - README 里的启动说明
   - 端口怎么定：`grep -rnE "PORT|port|listen\(" server vite.config.* serve.mjs scripts`，看是否读 `process.env.PORT`、vite 的 `server.port` / `proxy` 有没有写死
   - 生产模式下后端会不会顺带托管 `dist/`
3. **按下面的决策顺序选形态并写 `bench.json`**。字段和示例见 [references/spec.md](references/spec.md)，写之前先读。
4. **校验**：`pnpm bench check <产出>`，只看格式。
5. **真实验证**：`pnpm bench run <产出>`。它会执行 setup、分配端口、启动、等页面能访问、抓首页，最后停掉进程。看到 `✓ GET ... → HTTP 200` 才算通过；首页 title 或字节数明显不对（空白页、报错页）也算没通过。
6. **汇报**：最后再跑一次 `pnpm bench status`，按表格列出每个产出的形态、启动命令、验证结果，以及标为 unavailable 的原因。提醒用户在 Studio 顶栏点刷新就能看到。

批量处理时，每写完一个就验证一个，不要全写完再统一验。同时只跑一个 `bench run`，写死端口的产出之间会冲突。

## 决策顺序：选哪种形态

先满足哪条就用哪条：

1. **空目录、没有任何能打开的入口，或者明显没写完** → `unavailable`，reason 写清楚看到了什么。
2. **没有 `package.json`，直接打开 html 就能看**（像 pelican 那样）→ `static`，`entry` 填入口文件（不一定叫 index.html）。页面依赖构建产物或接口时，不适用这一条。
3. **有一条命令能让单个端口同时提供页面和接口**，并且这个端口能从外部指定（读 `PORT` 环境变量，或者支持 `--port` 参数）→ `process`，`ports` 只写一个 `auto`。通常就是 `start` / `preview` 这类生产模式，依赖 `dist/` 时在 setup 里加打包步骤（`unless: "dist/index.html"`）。**首选这一条**：只占一个端口，最不容易冲突。
4. **纯前端 vite 项目，没有后端** → `vite preview` 或 `vite dev`，追加 `--host 127.0.0.1 --port {port} --strictPort`。命令行参数比配置文件里的 `server.port` 优先级高。
5. **只能前后端两个进程一起跑，并且前端 proxy 里把后端端口写死了** → `ports` 写两个：后端用写死的那个数字，前端用 `auto`。Studio 启动前会检查写死的端口有没有被占，被占时直接报错。能绕开的话优先回到第 3 条，比如后端生产模式本身就托管 dist。
6. 以上都不行 → `unavailable`，写明卡在哪里。

## 常见坑

- `npm run x` / `pnpm x` 会把 `PORT` 环境变量原样传下去，但如果 script 里写死了 `--port 5173`，单靠环境变量改不了端口。这时绕过 script，直接调用 `node_modules/.bin/vite ... --port {port}`。
- 用 `concurrently` 同时起前后端的 dev 脚本，通常各自写死了端口。优先找单进程的生产模式。
- 产出自带 `scripts/with-node.sh` 这类包装脚本时，按它的方式调用，不要绕过。
- `readyUrl`：首页要等很久才出来，或者首页本身就返回 5xx 时，改成一个轻量接口，比如 `/api/health`。
- 首次 setup（安装依赖加打包）可能很慢，把 `readyTimeoutSec` 调大没有意义，因为它只管启动之后的等待时间，setup 不计时。
- 被评测的页面可能会自己访问外网资源，这不影响写规范。

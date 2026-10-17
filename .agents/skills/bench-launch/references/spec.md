# bench.json 规范（version 1）

放在产出目录下：`benchmarks/<project>/<family>/<model>/<harness>/bench.json`。
权威实现是 `studio/src/shared/launch.ts` 里的 `parseSpec`，有疑问以它为准；`pnpm bench check` 会一次报出全部错误。

## 三种形态

### static：直接托管，不起进程

```json
{ "version": 1, "kind": "static", "entry": "index.html" }
```

| 字段 | 必填 | 说明 |
|---|---|---|
| `entry` | 否 | 入口文件，相对产出目录，默认 `index.html` |
| `notes` | 否 | 给人看的备注，显示在 Studio |

Studio 以 `/preview/<project>/<family>/<model>/<harness>/<entry>` 托管整个产出目录，页面里的相对路径都能正常加载。

### process：起进程

```json
{
  "version": 1,
  "kind": "process",
  "setup": [
    { "run": "pnpm install --frozen-lockfile", "unless": "node_modules" },
    { "run": "pnpm build", "unless": "dist/index.html" }
  ],
  "start": "pnpm start",
  "ports": { "app": "auto" },
  "url": "http://127.0.0.1:{port}/"
}
```

| 字段 | 必填 | 默认 | 说明 |
|---|---|---|---|
| `start` | 是 | | 常驻进程的 shell 命令，在 `cwd` 下用 `/bin/sh -c` 执行 |
| `setup` | 否 | `[]` | 启动前依次执行；`unless` 指向的相对路径已存在就跳过；任何一步退出码不为 0 即失败 |
| `ports` | 否 | `{"app":"auto"}` | 端口表。`"auto"` 表示由 Studio 从 41000–41999 里挑一个空闲端口；写数字表示固定端口，启动前会检查是否被占用 |
| `url` | 否 | `http://127.0.0.1:{port}/` | 预览打开的地址 |
| `readyUrl` | 否 | 同 `url` | 就绪检查：轮询直到返回 HTTP 响应且状态码 < 500 |
| `readyTimeoutSec` | 否 | `90` | 从 start 开始计时的就绪超时（1–900） |
| `cwd` | 否 | 产出目录 | 相对产出目录 |
| `env` | 否 | `{}` | 额外的环境变量，值里可以写端口占位符 |
| `notes` | 否 | | 备注 |

**端口怎么传给产出**

- 占位符：`{port}` 是端口表里的第一个，`{port.<name>}` 按名字取，可以用在 `start`、`setup[].run`、`url`、`readyUrl`、`env` 里。
- 环境变量：`PORT` 等于第一个端口，另外每个端口都有 `PORT_<NAME>`（名字转大写，`-` 换成 `_`）。
- Studio 还会设置 `BROWSER=none`，并去掉 `npm_*` / `pnpm_*` / `VITE_*` / `NODE_ENV` 这些从 Studio 自身继承来的变量；需要 `NODE_ENV=production` 时在 `env` 里写明。

**停止**：每次启动都是独立的进程组，停止时对整组先发 SIGTERM，3 秒后补 SIGKILL。Studio 退出时也会全部清理。

### unavailable：规范过了，但确实看不了

```json
{ "version": 1, "kind": "unavailable", "reason": "产出目录为空，harness 中途失败" }
```

## 按场景的写法

**单端口生产模式，后端读 PORT 并托管 dist**（首选）

```json
{
  "version": 1,
  "kind": "process",
  "setup": [{ "run": "pnpm build", "unless": "dist/index.html" }],
  "start": "pnpm start",
  "url": "http://127.0.0.1:{port}/"
}
```

**零依赖 node 服务，读 PORT**

```json
{ "version": 1, "kind": "process", "start": "node server/index.js" }
```

**纯前端 vite**：用参数覆盖配置里写死的端口

```json
{
  "version": 1,
  "kind": "process",
  "setup": [{ "run": "npm ci", "unless": "node_modules" }],
  "start": "node_modules/.bin/vite --host 127.0.0.1 --port {port} --strictPort"
}
```

**前端 proxy 把后端写死在 3001**：后端固定端口，前端用 auto

```json
{
  "version": 1,
  "kind": "process",
  "ports": { "web": "auto", "api": 3001 },
  "start": "PORT={port.api} node_modules/.bin/tsx server/index.ts & node_modules/.bin/vite --host 127.0.0.1 --port {port.web} --strictPort; wait",
  "url": "http://127.0.0.1:{port.web}/",
  "notes": "vite proxy 写死了 /api → 3001，后端只能用 3001"
}
```

用 `&` 起两个进程时，末尾加 `wait`，保证两个都在同一个进程组里，停止时能一起结束。

# NOCTURNE ONE — 沉浸式产品官网

React 19 + TypeScript + Vite + Tailwind CSS v4。产品本体用 SVG 绘制，声场用 Canvas 绘制，没有外部图片。

```bash
npm install
npm run dev      # 开发
npm run build    # 类型检查 + 生产构建
npm run preview  # 预览 dist
```

## 结构
- `src/styles.css` — 设计变量、Liquid Glass 材质、按钮状态、入场编排、减弱动态效果
- `src/components/Headphones.tsx` — 可分解的 SVG 产品，配色由 `@property` CSS 变量驱动
- `Hero` / `Soundstage` / `Structure` / `ColorSelector` / `SpecsPurchase` / `Footer` — 各页面区块
- `GlassDialog` + `ReservationPanel` / `StoryPlayer` — 从触发按钮展开的原生 `<dialog>`
- `store.ts` — 轻量外部状态，只有订阅方会重新渲染

预约表单提交是模拟的。手机号尾号为 `0000` 时会走服务端失败流程。

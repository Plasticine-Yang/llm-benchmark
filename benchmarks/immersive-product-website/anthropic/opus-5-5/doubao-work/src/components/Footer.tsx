import { ArrowUp } from '@phosphor-icons/react'

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-white/[0.06] bg-graphite-950/60">
      <div className="mx-auto max-w-[1280px] px-5 pb-10 pt-24 sm:px-8 lg:px-10">
        {/* Colophon-style back cover */}
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
          <blockquote className="reveal md:col-span-7">
            <p className="text-[clamp(1.5rem,3vw,2.4rem)] font-light leading-[1.45] tracking-[-0.02em] text-ice-200">
              “我们想做的不是一副更响的耳机，<br className="hidden sm:block" />而是一间可以随身带走的、安静的房间。”
            </p>
            <footer className="mono mt-6 text-[11px] tracking-[0.2em] text-ice-500">— NOCTURNE 声学实验室 · 广州</footer>
          </blockquote>
          <div className="reveal grid grid-cols-2 gap-8 text-[13px] md:col-span-5 md:pl-10" style={{ ['--rd' as string]: '0.1s' }}>
            <div>
              <p className="eyebrow !text-[10px]">Index</p>
              <ul className="mt-4 space-y-2.5 text-ice-300">
                <li><a className="rounded hover:text-ice-50" href="#sound">I. 声场</a></li>
                <li><a className="rounded hover:text-ice-50" href="#structure">II. 结构</a></li>
                <li><a className="rounded hover:text-ice-50" href="#finish">III. 材质</a></li>
                <li><a className="rounded hover:text-ice-50" href="#specs">IV. 规格</a></li>
                <li><a className="rounded hover:text-ice-50" href="#purchase">V. 购买</a></li>
              </ul>
            </div>
            <div>
              <p className="eyebrow !text-[10px]">Colophon</p>
              <dl className="mt-4 space-y-2.5 text-ice-400">
                <div><dt className="inline text-ice-500">字体 </dt><dd className="inline">Geist / Noto Sans SC</dd></div>
                <div><dt className="inline text-ice-500">版次 </dt><dd className="inline">第一版 · 2026 秋</dd></div>
                <div><dt className="inline text-ice-500">编号 </dt><dd className="mono inline">NC-01 / 3499</dd></div>
              </dl>
            </div>
          </div>
        </div>

        <div className="mt-24 select-none" aria-hidden="true">
          <p className="text-metal text-center text-[clamp(3.2rem,15.5vw,14rem)] font-semibold leading-[0.85] tracking-[-0.06em] opacity-80">
            NOCTURNE
          </p>
        </div>

        <div className="hairline mt-10" />
        <div className="mt-6 flex flex-col items-start justify-between gap-4 text-[12px] text-ice-500 sm:flex-row sm:items-center">
          <p>© 2026 NOCTURNE Audio. 本页所示为产品渲染效果，以实物为准。</p>
          <a href="#brand" className="btn btn-ghost !min-h-[36px] !text-[12px]">
            回到封面 <ArrowUp size={14} aria-hidden="true" />
          </a>
        </div>
      </div>
    </footer>
  )
}

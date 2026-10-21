export type Finish = 'obsidian' | 'silver' | 'amber'

type ProductProps = {
  finish: Finish
  mode?: 'hero' | 'exploded' | 'mini'
  labelled?: boolean
}

export function HeadphoneProduct({ finish, mode = 'hero', labelled = false }: ProductProps) {
  return (
    <div
      className={`product product--${mode} finish-${finish}`}
      role={labelled ? 'img' : undefined}
      aria-label={labelled ? 'NOCTURNE ONE 头戴式空间音频耳机' : undefined}
      aria-hidden={labelled ? undefined : true}
    >
      <div className="product-shadow" />
      <div className="headband-wrap">
        <div className="headband-edge" />
        <div className="headband">
          <div className="headband-highlight" />
          <div className="headband-cushion" />
        </div>
      </div>
      <div className="yoke yoke-left"><span /></div>
      <div className="yoke yoke-right"><span /></div>
      <div className="earcup earcup-left">
        <div className="cushion"><i /></div>
        <div className="cup-shell">
          <div className="cup-highlight" />
          <div className="glass-chamber">
            <div className="chamber-refraction" />
            <div className="driver"><span /><i /></div>
            <div className="driver-mark">NØ</div>
          </div>
          <div className="cup-rim" />
        </div>
      </div>
      <div className="earcup earcup-right">
        <div className="cushion"><i /></div>
        <div className="cup-shell">
          <div className="cup-highlight" />
          <div className="glass-chamber">
            <div className="chamber-refraction" />
            <div className="driver"><span /><i /></div>
            <div className="driver-mark">NØ</div>
          </div>
          <div className="cup-rim" />
        </div>
      </div>
      <div className="product-light-sweep" />
    </div>
  )
}

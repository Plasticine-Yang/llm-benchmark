export type PickerItem = {
  id: string;
  caption?: string;
  title?: string;
};

type Props = {
  title: string;
  hint?: string;
  items: PickerItem[];
  activeId?: string;
  onPick: (id: string) => void;
};

export function Picker({ title, hint, items, activeId, onPick }: Props) {
  return (
    <section className="rail">
      <header className="rail-head">
        <h2 className="rail-title">{title}</h2>
        {hint && <span className="rail-hint">{hint}</span>}
      </header>
      <div className="rail-list">
        {items.length === 0 && <p className="rail-empty">—</p>}
        {items.map((item) => {
          const active = item.id === activeId;
          return (
            <button
              key={item.id}
              type="button"
              className={`rail-item${active ? ' is-active' : ''}`}
              onClick={() => onPick(item.id)}
              aria-pressed={active}
              title={item.title ?? item.id}
            >
              <span className="rail-name">{item.id}</span>
              {item.caption && <span className="rail-caption">{item.caption}</span>}
            </button>
          );
        })}
      </div>
    </section>
  );
}

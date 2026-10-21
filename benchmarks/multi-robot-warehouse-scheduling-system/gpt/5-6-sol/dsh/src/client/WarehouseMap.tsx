import { useMemo, useState } from "react";
import type { Point, SimulationState } from "../shared/types";

const pointKey = (point: Point) => `${point.x},${point.y}`;

interface Props {
  state: SimulationState;
  selectedRobotId: string | null;
  onSelectRobot: (id: string | null) => void;
  onToggleCell: (point: Point, blocked: boolean) => void;
}

export function WarehouseMap({ state, selectedRobotId, onSelectRobot, onToggleCell }: Props) {
  const [hovered, setHovered] = useState<Point | null>(null);
  const walls = useMemo(() => new Set(state.map.walls.map(pointKey)), [state.map.walls]);
  const blocked = useMemo(() => new Set(state.map.blocked.map(pointKey)), [state.map.blocked]);
  const bottlenecks = useMemo(() => new Set(state.map.bottlenecks.map(pointKey)), [state.map.bottlenecks]);
  const shelfByCell = useMemo(() => new Map(state.map.shelves.map((shelf) => [pointKey(shelf.position), shelf])), [state.map.shelves]);
  const stationByCell = useMemo(() => new Map(state.map.workstations.map((station) => [pointKey(station.position), station])), [state.map.workstations]);
  const robotByCell = useMemo(() => new Map(state.robots.map((robot) => [pointKey(robot.position), robot])), [state.robots]);
  const selected = state.robots.find((robot) => robot.id === selectedRobotId) ?? null;
  const routeIndex = useMemo(() => new Map((selected?.route ?? []).map((point, index) => [pointKey(point), index])), [selected]);

  const canToggle = (point: Point) => !walls.has(pointKey(point))
    && !shelfByCell.has(pointKey(point))
    && !robotByCell.has(pointKey(point));

  return (
    <section className="map-panel panel">
      <div className="panel-heading map-heading">
        <div>
          <p className="eyebrow">LIVE FLOOR / ZONE 07</p>
          <h2>Warehouse topology</h2>
        </div>
        <div className="map-legend">
          <span><i className="legend-dot route" /> active route</span>
          <span><i className="legend-dot bottleneck" /> bottleneck</span>
          <span><i className="legend-dot blocked" /> blocked</span>
        </div>
      </div>
      <div className="map-shell">
        <div
          className="warehouse-grid"
          style={{
            gridTemplateColumns: `repeat(${state.map.width}, minmax(15px, 1fr))`,
            gridTemplateRows: `repeat(${state.map.height}, minmax(15px, 1fr))`,
          }}
          onMouseLeave={() => setHovered(null)}
        >
          {Array.from({ length: state.map.width * state.map.height }, (_, index) => {
            const point = { x: index % state.map.width, y: Math.floor(index / state.map.width) };
            const key = pointKey(point);
            const shelf = shelfByCell.get(key);
            const station = stationByCell.get(key);
            const robot = robotByCell.get(key);
            const pathStep = routeIndex.get(key);
            const classes = [
              "cell",
              walls.has(key) && "wall",
              shelf && "shelf",
              station && "station",
              blocked.has(key) && "blocked-cell",
              bottlenecks.has(key) && "bottleneck-cell",
              pathStep !== undefined && "route-cell",
              hovered?.x === point.x && hovered?.y === point.y && canToggle(point) && "hover-cell",
            ].filter(Boolean).join(" ");
            return (
              <button
                type="button"
                key={key}
                className={classes}
                aria-label={`Cell ${point.x},${point.y}${blocked.has(key) ? " blocked" : ""}`}
                title={robot ? `${robot.name} · ${robot.waitingReason ?? robot.mode}` : shelf?.label ?? station?.label ?? `Cell ${point.x},${point.y} · click to ${blocked.has(key) ? "unblock" : "block"}`}
                onMouseEnter={() => setHovered(point)}
                onClick={() => {
                  if (robot) onSelectRobot(robot.id === selectedRobotId ? null : robot.id);
                  else if (canToggle(point)) onToggleCell(point, !blocked.has(key));
                }}
              >
                {pathStep !== undefined && pathStep > 0 && <span className="route-mark" style={{ background: selected?.color }} />}
                {shelf && <span className="shelf-shape"><b>{shelf.label}</b><i /><i /><i /></span>}
                {station && <span className="station-shape" style={{ borderColor: station.color }}><b>{station.label.replace("PACK ", "")}</b></span>}
                {blocked.has(key) && <span className="block-mark">×</span>}
                {robot && (
                  <span
                    className={`robot-token ${selectedRobotId === robot.id ? "selected" : ""}`}
                    style={{ "--robot-color": robot.color } as React.CSSProperties}
                  >
                    <span>{robot.name.slice(1)}</span>
                    {robot.waitingReason && <i className="wait-pulse">!</i>}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="map-coordinate">{hovered ? `X ${String(hovered.x).padStart(2, "0")} / Y ${String(hovered.y).padStart(2, "0")}` : "SELECT ROBOT TO TRACE ROUTE · CLICK FLOOR TO BLOCK"}</div>
      </div>
    </section>
  );
}

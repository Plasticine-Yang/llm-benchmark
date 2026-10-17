import { useMemo, useState } from 'react';
import { compactRoute, formatJobStatus, robotStatus } from '../format';

const CELL = 34;

function cellCenter(x, y) {
  return { cx: x * CELL + CELL / 2, cy: y * CELL + CELL / 2 };
}

function robotRotation(heading) {
  if (heading === 'N') return -90;
  if (heading === 'E') return 0;
  if (heading === 'S') return 90;
  return 180;
}

export default function WarehouseMap({
  state,
  selectedRobotId,
  onSelectRobot,
  onToggleBlock,
  busy = false,
}) {
  const [hovered, setHovered] = useState(null);
  const { warehouse, blockedCells, robots, jobs } = state;
  const { width, height, terrain, shelves, workstations, pickupByShelf, homes, narrowAisles } = warehouse;

  const shelfByCell = useMemo(() => {
    const map = new Map();
    for (const shelf of shelves) map.set(`${shelf.x},${shelf.y}`, shelf);
    return map;
  }, [shelves]);

  const stationByCell = useMemo(() => {
    const map = new Map();
    for (const station of workstations) map.set(`${station.x},${station.y}`, station);
    return map;
  }, [workstations]);

  const pickupByCell = useMemo(() => {
    const map = new Map();
    for (const [shelfId, point] of Object.entries(pickupByShelf)) {
      map.set(`${point.x},${point.y}`, shelfId);
    }
    return map;
  }, [pickupByShelf]);

  const homeSet = useMemo(() => new Set(homes.map((home) => `${home.x},${home.y}`)), [homes]);
  const blockedSet = useMemo(
    () => new Set(blockedCells.map((cell) => `${cell.x},${cell.y}`)),
    [blockedCells],
  );
  const robotByCell = useMemo(() => {
    const map = new Map();
    for (const robot of robots) map.set(`${robot.x},${robot.y}`, robot);
    return map;
  }, [robots]);
  const activeJobByRobot = useMemo(() => {
    const map = new Map();
    for (const job of jobs) {
      if (job.robotId && (job.status === 'assigned' || job.status === 'loaded')) map.set(job.robotId, job);
    }
    return map;
  }, [jobs]);
  const selectedRobot = robots.find((robot) => robot.id === selectedRobotId) ?? null;

  const describeCell = (x, y) => {
    const key = `${x},${y}`;
    const terrainCode = terrain[y][x];
    const robot = robotByCell.get(key);
    const shelf = shelfByCell.get(key);
    const station = stationByCell.get(key);
    const pickupShelf = pickupByCell.get(key);
    const isHome = homeSet.has(key);
    const isBlocked = blockedSet.has(key);
    if (terrainCode === '#') return `WALL · ${x},${y}`;
    if (shelf) return `SHELF ${shelf.id} · PICKUP AT ${shelf.pickup.x},${shelf.pickup.y}`;
    const parts = [`CELL ${x},${y}`];
    if (station) parts.push(`${station.id} ${station.name}`);
    else if (pickupShelf) parts.push(`PICKUP · ${pickupShelf}`);
    else if (isHome) parts.push('ROBOT BAY');
    else parts.push('FLOOR');
    if (robot) parts.push(`${robot.id} ${robot.name}`);
    if (isBlocked) parts.push('BLOCKED');
    return parts.join(' · ');
  };

  const handleFloorClick = (x, y) => {
    // Any traversable cell can be toggled, including pickup bays, workstation
    // docks and cells currently occupied by a robot. Robot markers remain
    // clickable for inspection and stop propagation.
    onToggleBlock(x, y);
  };

  const hoveredInfo = hovered ? describeCell(hovered.x, hovered.y) : null;
  const viewWidth = width * CELL;
  const viewHeight = height * CELL;

  return (
    <div className="map-space">
      <div className="map-scan" aria-hidden="true" />
      <svg
        className="warehouse-svg"
        viewBox={`0 0 ${viewWidth} ${viewHeight}`}
        role="img"
        aria-label="Warehouse floor with shelves, routes, robots, workstations and blocked cells"
      >
        <defs>
          <pattern id="floor-grid" width={CELL} height={CELL} patternUnits="userSpaceOnUse">
            <path d={`M ${CELL} 0 L 0 0 0 ${CELL}`} fill="none" stroke="#17212c" strokeWidth="0.7" />
          </pattern>
          <pattern id="wall-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="8" stroke="#24303d" strokeWidth="1.3" />
          </pattern>
          <pattern id="block-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="7" height="7" fill="rgba(255, 83, 111, 0.13)" />
            <line x1="0" y1="0" x2="0" y2="7" stroke="#ff536f" strokeOpacity="0.5" strokeWidth="1.5" />
          </pattern>
          <linearGradient id="shelf-face" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#20303e" />
            <stop offset="1" stopColor="#14202b" />
          </linearGradient>
          <filter id="marker-shadow" x="-70%" y="-70%" width="240%" height="240%">
            <feDropShadow dx="0" dy="2" stdDeviation="2.2" floodColor="#020509" floodOpacity="0.9" />
          </filter>
        </defs>

        <rect width={viewWidth} height={viewHeight} fill="#070c12" />
        <rect
          x={CELL}
          y={CELL}
          width={(width - 2) * CELL}
          height={(height - 2) * CELL}
          fill="#0b121a"
        />
        <rect
          x={CELL}
          y={CELL}
          width={(width - 2) * CELL}
          height={(height - 2) * CELL}
          fill="url(#floor-grid)"
          opacity="0.9"
        />

        {/* Aisles get a faint direction stripe so pedestrians understand the bottlenecks. */}
        {narrowAisles.map((aisle, index) => (
          <g key={aisle.id}>
            {aisle.cells.map((cell) => (
              <rect
                key={`${cell.x},${cell.y}`}
                x={cell.x * CELL}
                y={cell.y * CELL}
                width={CELL}
                height={CELL}
                fill="rgba(94, 231, 196, 0.035)"
              />
            ))}
            <line
              x1={aisle.x * CELL + 5}
              y1={aisle.yStart * CELL + 4}
              x2={aisle.x * CELL + 5}
              y2={(aisle.yEnd + 1) * CELL - 4}
              stroke="rgba(94, 231, 196, 0.28)"
              strokeWidth="1.2"
              strokeDasharray="2 3"
            />
            <line
              x1={(aisle.x + 1) * CELL - 5}
              y1={aisle.yStart * CELL + 4}
              x2={(aisle.x + 1) * CELL - 5}
              y2={(aisle.yEnd + 1) * CELL - 4}
              stroke="rgba(94, 231, 196, 0.28)"
              strokeWidth="1.2"
              strokeDasharray="2 3"
            />
            <text
              x={aisle.x * CELL + CELL / 2}
              y={aisle.yStart * CELL - 7}
              textAnchor="middle"
              fill="rgba(94, 231, 196, 0.7)"
              fontSize="6.2"
              fontFamily="var(--font-mono)"
              letterSpacing="0.8"
            >
              {`AISLE ${String.fromCharCode(65 + index)}`}
            </text>
          </g>
        ))}

        {/* Walls */}
        {Array.from({ length: height }, (_, y) =>
          Array.from({ length: width }, (_, x) => {
            if (terrain[y][x] !== '#') return null;
            return (
              <g key={`wall-${x}-${y}`}>
                <rect x={x * CELL} y={y * CELL} width={CELL} height={CELL} fill="#111821" stroke="#1b2632" strokeWidth="0.6" />
                <rect x={x * CELL + 4} y={y * CELL + 4} width={CELL - 8} height={CELL - 8} fill="url(#wall-hatch)" opacity="0.45" />
              </g>
            );
          }),
        )}

        {/* Shelves */}
        {shelves.map((shelf) => {
          const x = shelf.x * CELL;
          const y = shelf.y * CELL;
          return (
            <g key={shelf.id}>
              <rect
                x={x + 2.2}
                y={y + 2.2}
                width={CELL - 4.4}
                height={CELL - 4.4}
                rx="2.6"
                fill="url(#shelf-face)"
                stroke="#314253"
                strokeWidth="0.9"
              />
              <line x1={x + 6} y1={y + CELL / 2 - 2.5} x2={x + CELL - 6} y2={y + CELL / 2 - 2.5} stroke="#45596c" strokeWidth="1" opacity="0.65" />
              <line x1={x + 6} y1={y + CELL / 2 + 2} x2={x + CELL - 6} y2={y + CELL / 2 + 2} stroke="#263847" strokeWidth="1" />
              <circle cx={x + 6.5} cy={y + 6.5} r="1.6" fill="#5d7183" />
              <text
                x={x + CELL / 2}
                y={y + CELL / 2 - 6}
                textAnchor="middle"
                fill="#b7c8d7"
                fontSize="8.2"
                letterSpacing="0.4"
                fontFamily="var(--font-mono)"
              >
                {shelf.id}
              </text>
            </g>
          );
        })}

        {/* Workstations */}
        {workstations.map((station) => {
          const x = station.x * CELL;
          const y = station.y * CELL;
          return (
            <g key={station.id}>
              <rect
                x={x + 2}
                y={y + 2}
                width={CELL - 4}
                height={CELL - 4}
                rx="3"
                fill="rgba(10, 20, 27, 0.92)"
                stroke={station.accent}
                strokeOpacity="0.75"
                strokeWidth="1.1"
              />
              <rect x={x + 5} y={y + 5} width="3" height={CELL - 10} rx="1" fill={station.accent} opacity="0.6" />
              <text x={x + 13} y={y + 15} fill="#f1f7fb" fontSize="7.4" fontFamily="var(--font-mono)" fontWeight="700">
                WS-{station.id.slice(-1)}
              </text>
              <text x={x + 13} y={y + 24} fill={station.accent} fontSize="5.8" fontFamily="var(--font-mono)" letterSpacing="0.5">
                {station.name}
              </text>
              <title>{`${station.id} workstation · ${station.name} · click to toggle obstacle`}</title>
            </g>
          );
        })}

        {/* Pickup and home bay ground markings */}
        {[...pickupByCell.entries()].map(([key, shelfId]) => {
          const [x, y] = key.split(',').map(Number);
          const left = x * CELL;
          const top = y * CELL;
          return (
            <g key={`pickup-${shelfId}`} opacity="0.82">
              <path
                d={`M ${left + 5} ${top + 10} V ${top + 5} H ${left + 10} M ${left + CELL - 10} ${top + 5} H ${left + CELL - 5} V ${top + 10} M ${left + 5} ${top + CELL - 10} V ${top + CELL - 5} H ${left + 10} M ${left + CELL - 10} ${top + CELL - 5} H ${left + CELL - 5} V ${top + CELL - 10}`}
                fill="none"
                stroke="#5ee7c4"
                strokeWidth="1.1"
                strokeOpacity="0.8"
              />
              <circle cx={left + CELL / 2} cy={top + CELL - 5} r="1.5" fill="#5ee7c4" opacity="0.55" />
              <title>{`Pickup bay for ${shelfId} · click to toggle obstacle`}</title>
            </g>
          );
        })}

        {homes.map((home, index) => {
          const x = home.x * CELL;
          const y = home.y * CELL;
          return (
            <g key={`home-${index}`} opacity="0.45">
              <rect
                x={x + 5}
                y={y + 5}
                width={CELL - 10}
                height={CELL - 10}
                rx="2"
                fill="none"
                stroke="#8ba0b4"
                strokeWidth="0.8"
                strokeDasharray="2.5 2.5"
              />
              <text
                x={x + CELL / 2}
                y={y + CELL - 5.5}
                textAnchor="middle"
                fill="#73879a"
                fontSize="5"
                fontFamily="var(--font-mono)"
              >
                BAY
              </text>
            </g>
          );
        })}

        {/* Planned routes */}
        {robots.map((robot) => {
          const points = compactRoute(robot.route);
          if (points.length < 2) return null;
          const path = points.map((point) => `${point.x * CELL + CELL / 2},${point.y * CELL + CELL / 2}`).join(' ');
          const selected = robot.id === selectedRobotId;
          const last = points[points.length - 1];
          return (
            <g key={`route-${robot.id}`} pointerEvents="none" className="route-layer">
              <polyline
                points={path}
                fill="none"
                stroke="#071017"
                strokeWidth={selected ? 6 : 4.4}
                strokeOpacity="0.78"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polyline
                points={path}
                fill="none"
                stroke={robot.color}
                strokeWidth={selected ? 2.8 : 1.7}
                strokeOpacity={selected ? 0.95 : 0.67}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={robot.waiting ? '3 4' : undefined}
              />
              <circle
                cx={last.x * CELL + CELL / 2}
                cy={last.y * CELL + CELL / 2}
                r={selected ? 3.2 : 2}
                fill="none"
                stroke={robot.color}
                strokeWidth="1.4"
                opacity={selected ? 0.95 : 0.6}
              />
            </g>
          );
        })}

        {/* Cell hit targets + obstacle overlays. Routes stay under these? hit targets are transparent. */}
        {Array.from({ length: height }, (_, y) =>
          Array.from({ length: width }, (_, x) => {
            const code = terrain[y][x];
            const traversable = code !== '#' && code !== 'S';
            const key = `${x},${y}`;
            const blocked = blockedSet.has(key);
            const occupant = robotByCell.get(key);
            if (!traversable) return null;
            return (
              <g key={`hit-${key}`}>
                {blocked && (
                  <g className="blocked-cell">
                    <rect
                      x={x * CELL + 2}
                      y={y * CELL + 2}
                      width={CELL - 4}
                      height={CELL - 4}
                      rx="3"
                      fill="url(#block-hatch)"
                      stroke="#ff536f"
                      strokeOpacity="0.9"
                      strokeWidth="1.2"
                    />
                    <line x1={x * CELL + 10} y1={y * CELL + 10} x2={x * CELL + CELL - 10} y2={y * CELL + CELL - 10} stroke="#ff8b9e" strokeWidth="1.4" />
                    <line x1={x * CELL + CELL - 10} y1={y * CELL + 10} x2={x * CELL + 10} y2={y * CELL + CELL - 10} stroke="#ff8b9e" strokeWidth="1.4" />
                    <text x={x * CELL + CELL / 2} y={y * CELL + 12} textAnchor="middle" fill="#ffb3c1" fontSize="5.5" fontFamily="var(--font-mono)">
                      BLOCKED
                    </text>
                  </g>
                )}
                <rect
                  x={x * CELL}
                  y={y * CELL}
                  width={CELL}
                  height={CELL}
                  fill="transparent"
                  className={`cell-hit ${blocked ? 'cell-hit-blocked' : ''} ${occupant ? 'cell-hit-occupied' : ''}`}
                  onClick={(event) => handleFloorClick(x, y, event)}
                  onMouseEnter={() => setHovered({ x, y })}
                  onMouseLeave={() => setHovered(null)}
                >
                  <title>{`${describeCell(x, y)} · click to toggle obstacle`}</title>
                </rect>
                {/* hover edges */}
              </g>
            );
          }),
        )}

        {/* Robot markers */}
        {robots.map((robot) => {
          const { cx, cy } = cellCenter(robot.x, robot.y);
          const selected = robot.id === selectedRobotId;
          const status = robotStatus(robot);
          const job = activeJobByRobot.get(robot.id);
          return (
            <g
              key={robot.id}
              className={`robot-marker ${selected ? 'is-selected' : ''} ${robot.waiting ? 'is-waiting' : ''}`}
              transform={`translate(${cx} ${cy})`}
              onClick={(event) => {
                event.stopPropagation();
                if (event.shiftKey) onToggleBlock(robot.x, robot.y);
                else onSelectRobot(robot.id);
              }}
              style={{ cursor: 'pointer' }}
            >
              {(selected || robot.waiting) && (
                <circle
                  r={CELL * 0.44}
                  fill="none"
                  stroke={robot.waiting ? '#ffbf69' : robot.color}
                  strokeWidth="1"
                  strokeDasharray={robot.waiting ? '2 3' : undefined}
                  className={robot.waiting ? 'wait-ring' : 'selection-ring'}
                />
              )}
              <g transform={`rotate(${robotRotation(robot.heading)})`}>
                <path
                  d={`M ${CELL * 0.31} 0 L ${CELL * 0.42} -3.8 L ${CELL * 0.42} 3.8 Z`}
                  fill={robot.color}
                  opacity="0.85"
                />
              </g>
              <circle r={CELL * 0.29} fill={robot.color} stroke="#061017" strokeWidth="2.3" filter="url(#marker-shadow)" />
              <circle r={CELL * 0.19} fill="rgba(5, 12, 18, 0.22)" />
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fill="#061017"
                fontSize="8.3"
                fontWeight="800"
                fontFamily="var(--font-mono)"
                letterSpacing="-0.4"
              >
                {robot.id}
              </text>
              {robot.waiting && (
                <g transform={`translate(${CELL * 0.29} ${-CELL * 0.28})`}>
                  <circle r="6.1" fill="#ffbd66" stroke="#0b1219" strokeWidth="1.4" />
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    y="0.4"
                    fill="#1c1304"
                    fontSize="8.5"
                    fontWeight="900"
                    fontFamily="var(--font-mono)"
                  >
                    !
                  </text>
                </g>
              )}
              {job && job.status === 'loaded' && (
                <rect x={-3.2} y={-CELL * 0.29 - 6.6} width="6.4" height="4.2" rx="0.8" fill="#fff3d6" stroke="#071017" strokeWidth="0.8" />
              )}
              <title>
                {`${robot.id} ${robot.name} · ${status.label} · (${robot.x},${robot.y})${
                  job ? ` · ${job.id} ${job.shelfId} → ${job.workstationId}` : ''
                }${robot.waitReason ? ` · ${robot.waitReason}` : ''}`}
              </title>
            </g>
          );
        })}

        {/* Quiet floor telemetry labels */}
        <text x={CELL * 1.2} y={viewHeight - CELL * 0.55} fill="#385064" fontSize="6.2" fontFamily="var(--font-mono)" letterSpacing="1.1">
          SECTOR 07 · AUTONOMOUS FLOOR
        </text>
        <text x={viewWidth - CELL * 1.2} y={viewHeight - CELL * 0.55} textAnchor="end" fill="#385064" fontSize="6.2" fontFamily="var(--font-mono)" letterSpacing="1.1">
          GRID {width}×{height} / LIVE
        </text>
      </svg>

      <div className="map-telemetry" aria-live="off">
        <span className="map-telemetry-dot" />
        {hoveredInfo ?? 'Hover a cell for telemetry · click any traversable cell to toggle an obstacle'}
      </div>

      {selectedRobot && (
        <div className="map-inspector">
          <div className="map-inspector-top">
            <span className="robot-swatch" style={{ background: selectedRobot.color }} />
            <strong>{selectedRobot.id}</strong>
            <span className="map-inspector-name">{selectedRobot.name}</span>
            <span className={`status-pill ${robotStatus(selectedRobot).tone}`}>{robotStatus(selectedRobot).label}</span>
          </div>
          <div className="map-inspector-job">
            {selectedRobot.jobId ? (
              <>
                {(() => {
                  const job = jobs.find((candidate) => candidate.id === selectedRobot.jobId);
                  if (!job) return selectedRobot.jobId;
                  return `${job.id} · ${job.shelfId} → ${job.workstationId} · ${formatJobStatus(job).label}`;
                })()}
              </>
            ) : selectedRobot.status === 'returning' ? (
              'Returning to home bay'
            ) : (
              'Awaiting job assignment'
            )}
          </div>
          {selectedRobot.waitReason ? (
            <div className="map-inspector-wait">
              <span>HOLD</span> {selectedRobot.waitReason}
            </div>
          ) : (
            <div className="map-inspector-route">
              Route claim · {Math.max(0, selectedRobot.route.length - 1)} ticks · {selectedRobot.distanceTravelled} cells travelled
            </div>
          )}
        </div>
      )}
    </div>
  );
}

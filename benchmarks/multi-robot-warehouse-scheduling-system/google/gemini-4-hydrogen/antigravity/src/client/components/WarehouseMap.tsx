import React, { useMemo, useState } from 'react';
import { ShieldAlert, Eye, EyeOff, MapPin } from 'lucide-react';
import {
  GridCell,
  Heading,
  RobotState,
  SimulationSnapshot,
} from '../../shared/types';

interface WarehouseMapProps {
  snapshot: SimulationSnapshot;
  selectedRobotId: string | null;
  selectedShelfId: string;
  selectedWorkstationId: string;
  onSelectRobot: (id: string | null) => void;
  onSelectShelf: (shelfId: string) => void;
  onSelectWorkstation: (wsId: string) => void;
  onToggleBlockCell: (x: number, y: number) => void;
}

const CELL_SIZE = 40;

function headingRotation(heading: Heading): number {
  switch (heading) {
    case 'N':
      return -90;
    case 'S':
      return 90;
    case 'W':
      return 180;
    case 'E':
    default:
      return 0;
  }
}

export const WarehouseMap: React.FC<WarehouseMapProps> = ({
  snapshot,
  selectedRobotId,
  selectedShelfId,
  selectedWorkstationId,
  onSelectRobot,
  onSelectShelf,
  onSelectWorkstation,
  onToggleBlockCell,
}) => {
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number } | null>(null);
  const [hoveredRobot, setHoveredRobot] = useState<RobotState | null>(null);
  const [showAllPaths, setShowAllPaths] = useState(true);
  const [mapMode, setMapMode] = useState<'OBSTACLE' | 'SELECT'>('OBSTACLE');

  const { grid, robots } = snapshot;
  const svgWidth = grid.width * CELL_SIZE;
  const svgHeight = grid.height * CELL_SIZE;

  const robotByPos = useMemo(() => {
    const map = new Map<string, RobotState>();
    for (const r of robots) {
      map.set(`${r.pos.x},${r.pos.y}`, r);
    }
    return map;
  }, [robots]);

  const handleCellClick = (cell: GridCell) => {
    if (cell.type === 'SHELF' && cell.shelfId) {
      onSelectShelf(cell.shelfId);
      return;
    }
    if (mapMode === 'SELECT' && cell.type === 'WORKSTATION' && cell.workstationId) {
      onSelectWorkstation(cell.workstationId);
      return;
    }
    if (cell.type === 'WALL' || cell.type === 'SHELF') return;
    onToggleBlockCell(cell.x, cell.y);
  };

  const hoveredGridCell = hoveredCell ? grid.cells[hoveredCell.y]?.[hoveredCell.x] : null;
  const hoveredOccupant = hoveredCell
    ? robotByPos.get(`${hoveredCell.x},${hoveredCell.y}`)
    : undefined;

  return (
    <section className="panel map-panel">
      <div className="panel-header">
        <div className="panel-title-group">
          <MapPin size={16} className="panel-icon" />
          <h2 className="panel-title">Warehouse Floor &amp; Space-Time Routes</h2>
          <span className="panel-subtitle">
            {grid.width}×{grid.height} · Click any open cell to toggle obstacle
          </span>
        </div>
        <div className="map-toolbar">
          <div className="filter-tabs">
            <button
              type="button"
              className={`tab-btn ${mapMode === 'OBSTACLE' ? 'active' : ''}`}
              onClick={() => setMapMode('OBSTACLE')}
              title="Click any open cell (including workstations) to toggle obstacles"
            >
              Obstacle Click
            </button>
            <button
              type="button"
              className={`tab-btn ${mapMode === 'SELECT' ? 'active' : ''}`}
              onClick={() => setMapMode('SELECT')}
              title="Click shelves or workstations to pick job endpoints"
            >
              Pick Target
            </button>
          </div>
          <button
            type="button"
            className={`btn btn-xs ${showAllPaths ? 'btn-primary-soft' : 'btn-secondary'}`}
            onClick={() => setShowAllPaths((v) => !v)}
          >
            {showAllPaths ? <Eye size={13} /> : <EyeOff size={13} />}
            <span>{showAllPaths ? 'Paths On' : 'Paths Off'}</span>
          </button>
          {selectedRobotId && (
            <button
              type="button"
              className="btn btn-xs btn-secondary"
              onClick={() => onSelectRobot(null)}
            >
              Clear Focus ({selectedRobotId})
            </button>
          )}
        </div>
      </div>

      <div className="map-canvas-wrap">
        <svg
          className="warehouse-svg"
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          role="img"
          aria-label="Multi-robot warehouse grid map"
        >
          <defs>
            <pattern
              id="bottleneckStripe"
              width="8"
              height="8"
              patternTransform="rotate(45 0 0)"
              patternUnits="userSpaceOnUse"
            >
              <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(245, 158, 11, 0.14)" strokeWidth="2" />
            </pattern>
            <pattern
              id="blockedHazard"
              width="8"
              height="8"
              patternTransform="rotate(-45 0 0)"
              patternUnits="userSpaceOnUse"
            >
              <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(239, 68, 68, 0.45)" strokeWidth="3" />
            </pattern>
          </defs>

          {/* Grid Cells */}
          {grid.cells.map((row) =>
            row.map((cell) => {
              const px = cell.x * CELL_SIZE;
              const py = cell.y * CELL_SIZE;
              const isSelectedShelf =
                cell.type === 'SHELF' && cell.shelfId === selectedShelfId;
              const isSelectedWs =
                cell.type === 'WORKSTATION' && cell.workstationId === selectedWorkstationId;
              const isHovered =
                hoveredCell?.x === cell.x && hoveredCell?.y === cell.y;
              const isTraversableType = cell.type !== 'WALL' && cell.type !== 'SHELF';

              let fill = '#0E1626';
              if (cell.type === 'WALL') fill = '#1E293B';
              else if (cell.type === 'SHELF') fill = '#2D2114';
              else if (cell.type === 'WORKSTATION') fill = '#0F2A24';
              else if (cell.type === 'PICKUP') fill = '#132136';
              else if (cell.type === 'STAGING') fill = '#141D30';

              return (
                <g
                  key={`${cell.x}-${cell.y}`}
                  onClick={() => handleCellClick(cell)}
                  onMouseEnter={() => setHoveredCell({ x: cell.x, y: cell.y })}
                  onMouseLeave={() => setHoveredCell(null)}
                  style={{
                    cursor:
                      isTraversableType || cell.type === 'SHELF' ? 'pointer' : 'default',
                  }}
                >
                  <rect
                    x={px}
                    y={py}
                    width={CELL_SIZE}
                    height={CELL_SIZE}
                    fill={fill}
                    stroke="#1D2A44"
                    strokeWidth={0.8}
                  />

                  {/* Bottleneck aisle overlay */}
                  {cell.bottleneck && !cell.blocked && (
                    <rect
                      x={px + 1}
                      y={py + 1}
                      width={CELL_SIZE - 2}
                      height={CELL_SIZE - 2}
                      fill="url(#bottleneckStripe)"
                    />
                  )}

                  {/* Wall bevel */}
                  {cell.type === 'WALL' && (
                    <rect
                      x={px + 3}
                      y={py + 3}
                      width={CELL_SIZE - 6}
                      height={CELL_SIZE - 6}
                      rx={3}
                      fill="#273549"
                    />
                  )}

                  {/* Staging Bay frame */}
                  {cell.type === 'STAGING' && (
                    <>
                      <rect
                        x={px + 4}
                        y={py + 4}
                        width={CELL_SIZE - 8}
                        height={CELL_SIZE - 8}
                        rx={5}
                        fill="none"
                        stroke="#334155"
                        strokeDasharray="3 2"
                        strokeWidth={1}
                      />
                      <text
                        x={px + CELL_SIZE / 2}
                        y={py + CELL_SIZE - 7}
                        textAnchor="middle"
                        fontSize="7.5"
                        fill="#475569"
                        fontFamily="monospace"
                      >
                        {cell.stagingForRobotId}
                      </text>
                    </>
                  )}

                  {/* Pickup Pad */}
                  {cell.type === 'PICKUP' && (
                    <rect
                      x={px + 6}
                      y={py + 6}
                      width={CELL_SIZE - 12}
                      height={CELL_SIZE - 12}
                      rx={4}
                      fill="none"
                      stroke="#2563EB"
                      strokeOpacity={0.4}
                      strokeDasharray="2 2"
                      strokeWidth={1}
                    />
                  )}

                  {/* Shelf Rack */}
                  {cell.type === 'SHELF' && (
                    <>
                      <rect
                        x={px + 3}
                        y={py + 3}
                        width={CELL_SIZE - 6}
                        height={CELL_SIZE - 6}
                        rx={4}
                        fill={isSelectedShelf ? '#452A0E' : '#3B2814'}
                        stroke={isSelectedShelf ? '#FBBF24' : '#B45309'}
                        strokeWidth={isSelectedShelf ? 2 : 1.2}
                      />
                      <text
                        x={px + CELL_SIZE / 2}
                        y={py + CELL_SIZE / 2 + 3.5}
                        textAnchor="middle"
                        fontSize="9.5"
                        fontWeight="700"
                        fill="#FCD34D"
                        fontFamily="monospace"
                      >
                        {cell.shelfId}
                      </text>
                    </>
                  )}

                  {/* Workstation Dock */}
                  {cell.type === 'WORKSTATION' && (
                    <>
                      <rect
                        x={px + 3}
                        y={py + 3}
                        width={CELL_SIZE - 6}
                        height={CELL_SIZE - 6}
                        rx={5}
                        fill={isSelectedWs ? '#134E4A' : '#0F362E'}
                        stroke={isSelectedWs ? '#34D399' : '#10B981'}
                        strokeWidth={isSelectedWs ? 2 : 1.3}
                      />
                      <text
                        x={px + CELL_SIZE / 2}
                        y={py + CELL_SIZE / 2 + 3.5}
                        textAnchor="middle"
                        fontSize="9.5"
                        fontWeight="700"
                        fill="#6EE7B7"
                        fontFamily="monospace"
                      >
                        {cell.workstationId}
                      </text>
                    </>
                  )}

                  {/* Blocked Obstacle Cell */}
                  {cell.blocked && (
                    <>
                      <rect
                        x={px + 2}
                        y={py + 2}
                        width={CELL_SIZE - 4}
                        height={CELL_SIZE - 4}
                        rx={4}
                        fill="#450A0A"
                        stroke="#EF4444"
                        strokeWidth={1.8}
                      />
                      <rect
                        x={px + 2}
                        y={py + 2}
                        width={CELL_SIZE - 4}
                        height={CELL_SIZE - 4}
                        rx={4}
                        fill="url(#blockedHazard)"
                      />
                      <path
                        d={`M ${px + 12} ${py + 12} L ${px + CELL_SIZE - 12} ${py + CELL_SIZE - 12} M ${px + CELL_SIZE - 12} ${py + 12} L ${px + 12} ${py + CELL_SIZE - 12}`}
                        stroke="#FCA5A5"
                        strokeWidth={2.4}
                        strokeLinecap="round"
                      />
                    </>
                  )}

                  {/* Hover highlight */}
                  {isHovered && isTraversableType && (
                    <rect
                      x={px + 1.5}
                      y={py + 1.5}
                      width={CELL_SIZE - 3}
                      height={CELL_SIZE - 3}
                      rx={3}
                      fill="none"
                      stroke={cell.blocked ? '#4ADE80' : '#F87171'}
                      strokeWidth={1.6}
                      strokeOpacity={0.9}
                    />
                  )}
                </g>
              );
            })
          )}

          {/* Planned Robot Paths */}
          {showAllPaths &&
            robots.map((robot) => {
              if (robot.plannedPath.length <= 1) return null;
              const isSelected = selectedRobotId === robot.id;
              const dimOther = selectedRobotId !== null && !isSelected;
              const points = robot.plannedPath
                .map((wp) => `${wp.x * CELL_SIZE + CELL_SIZE / 2},${wp.y * CELL_SIZE + CELL_SIZE / 2}`)
                .join(' ');
              const dest = robot.plannedPath[robot.plannedPath.length - 1];
              const dx = dest.x * CELL_SIZE + CELL_SIZE / 2;
              const dy = dest.y * CELL_SIZE + CELL_SIZE / 2;

              return (
                <g
                  key={`path-${robot.id}`}
                  pointerEvents="none"
                  opacity={dimOther ? 0.22 : isSelected ? 1 : 0.78}
                >
                  <polyline
                    points={points}
                    fill="none"
                    stroke={robot.color}
                    strokeWidth={isSelected ? 3.5 : 2.2}
                    strokeDasharray={robot.status === 'WAITING' ? '4 4' : '6 3'}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Step dots along planned path */}
                  {robot.plannedPath.slice(1, -1).map((wp, idx) => (
                    <circle
                      key={`${robot.id}-wp-${idx}-${wp.t}`}
                      cx={wp.x * CELL_SIZE + CELL_SIZE / 2}
                      cy={wp.y * CELL_SIZE + CELL_SIZE / 2}
                      r={isSelected ? 2.6 : 1.7}
                      fill={robot.color}
                    />
                  ))}
                  {/* Destination marker */}
                  <circle
                    cx={dx}
                    cy={dy}
                    r={6}
                    fill="none"
                    stroke={robot.color}
                    strokeWidth={1.8}
                  />
                </g>
              );
            })}

          {/* Robots */}
          {robots.map((robot) => {
            const cx = robot.pos.x * CELL_SIZE + CELL_SIZE / 2;
            const cy = robot.pos.y * CELL_SIZE + CELL_SIZE / 2;
            const isSelected = selectedRobotId === robot.id;
            const isWaiting = robot.status === 'WAITING';
            const isBlocked = robot.status === 'BLOCKED';
            const isDwelling =
              robot.status === 'PICKING_UP' || robot.status === 'DROPPING_OFF';

            const ringColor = isBlocked
              ? '#EF4444'
              : isWaiting
                ? '#F59E0B'
                : isDwelling
                  ? '#10B981'
                  : isSelected
                    ? '#FFFFFF'
                    : robot.color;

            return (
              <g
                key={robot.id}
                transform={`translate(${cx}, ${cy})`}
                className="robot-sprite"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectRobot(isSelected ? null : robot.id);
                }}
                onMouseEnter={() => setHoveredRobot(robot)}
                onMouseLeave={() => setHoveredRobot(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Status outer ring */}
                {(isSelected || isWaiting || isBlocked || isDwelling) && (
                  <circle
                    r={16.5}
                    fill="none"
                    stroke={ringColor}
                    strokeWidth={isSelected ? 2.4 : 2}
                    strokeDasharray={isWaiting ? '3 2' : undefined}
                  />
                )}

                {/* Robot Chassis */}
                <circle
                  r={13}
                  fill="#0B1120"
                  stroke={robot.color}
                  strokeWidth={2.5}
                />

                {/* Heading chevron */}
                {robot.heading !== 'NONE' && (
                  <g transform={`rotate(${headingRotation(robot.heading)})`}>
                    <polygon
                      points="14,0 9,-3.5 9,3.5"
                      fill={robot.color}
                    />
                  </g>
                )}

                {/* Cargo indicator */}
                {robot.carryingShelfId && (
                  <rect
                    x={-11}
                    y={-13}
                    width={7}
                    height={7}
                    rx={1.5}
                    fill="#F59E0B"
                    stroke="#0B1120"
                    strokeWidth={1}
                  />
                )}

                {/* Robot short ID */}
                <text
                  y={3.5}
                  textAnchor="middle"
                  fontSize="9.5"
                  fontWeight="800"
                  fill="#F8FAFC"
                  fontFamily="monospace"
                >
                  {robot.id.replace('R-', 'R')}
                </text>

                {/* Status badge tag for WAITING / BLOCKED */}
                {(isWaiting || isBlocked) && (
                  <g transform="translate(0, -19)">
                    <rect
                      x={-16}
                      y={-7}
                      width={32}
                      height={11}
                      rx={3}
                      fill={isBlocked ? '#B91C1C' : '#B45309'}
                    />
                    <text
                      y={1}
                      textAnchor="middle"
                      fontSize="7.2"
                      fontWeight="700"
                      fill="#FFFFFF"
                      fontFamily="monospace"
                    >
                      {isBlocked ? 'BLOCK' : 'WAIT'}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* Live hover inspector bar */}
        <div className="map-inspector-bar">
          {hoveredRobot ? (
            <div className="inspector-content">
              <span
                className="robot-dot"
                style={{ backgroundColor: hoveredRobot.color }}
              />
              <strong>{hoveredRobot.id}</strong>
              <span className="badge badge-status">{hoveredRobot.status}</span>
              <span>
                ({hoveredRobot.pos.x},{hoveredRobot.pos.y})
              </span>
              {hoveredRobot.currentJobId && (
                <span>
                  Job <strong>{hoveredRobot.currentJobId}</strong> ({hoveredRobot.targetShelfId} →{' '}
                  {hoveredRobot.targetWorkstationId})
                </span>
              )}
              {hoveredRobot.waitReason && (
                <span className="inspector-reason">· {hoveredRobot.waitReason}</span>
              )}
            </div>
          ) : hoveredGridCell ? (
            <div className="inspector-content">
              <span>
                Cell ({hoveredGridCell.x},{hoveredGridCell.y}) ·{' '}
                <strong>{hoveredGridCell.type}</strong>
                {hoveredGridCell.bottleneck ? ' · 1-Cell Bottleneck Aisle' : ''}
                {hoveredGridCell.shelfId ? ` · ${hoveredGridCell.shelfId}` : ''}
                {hoveredGridCell.pickupForShelfId
                  ? ` · Pickup for ${hoveredGridCell.pickupForShelfId}`
                  : ''}
                {hoveredGridCell.workstationId ? ` · ${hoveredGridCell.workstationId}` : ''}
                {hoveredGridCell.blocked ? ' · BLOCKED OBSTACLE' : ''}
              </span>
              {hoveredOccupant && <span> · Occupied by {hoveredOccupant.id}</span>}
              {hoveredGridCell.type !== 'WALL' && hoveredGridCell.type !== 'SHELF' && (
                <span className="inspector-hint">
                  — Click to {hoveredGridCell.blocked ? 'unblock' : 'block'}
                </span>
              )}
              {hoveredGridCell.type === 'SHELF' && (
                <span className="inspector-hint">— Click to select shelf</span>
              )}
            </div>
          ) : (
            <div className="inspector-content muted">
              <ShieldAlert size={13} />
              <span>
                Hover cells or robots to inspect. Click any open aisle/floor cell to block or
                unblock in real time.
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="map-legend">
        <span className="legend-item">
          <i className="swatch swatch-shelf" /> Shelf (24)
        </span>
        <span className="legend-item">
          <i className="swatch swatch-pickup" /> Pickup Pad
        </span>
        <span className="legend-item">
          <i className="swatch swatch-ws" /> Workstation (6)
        </span>
        <span className="legend-item">
          <i className="swatch swatch-bottleneck" /> 1-Cell Bottleneck
        </span>
        <span className="legend-item">
          <i className="swatch swatch-blocked" /> Blocked Cell
        </span>
        <span className="legend-item">
          <i className="swatch swatch-staging" /> Robot Bay (10)
        </span>
      </div>
    </section>
  );
};

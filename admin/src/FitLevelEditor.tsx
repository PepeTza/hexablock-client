import { BoardShape } from '@domain/engine/board/board-shape';
import type { HexCoord } from '@domain/engine/hex/hex-coord';
import { HexGeometry } from '@domain/engine/hex/hex-geometry';
import { loadHexPieceCatalog } from '@domain/engine/hex/hex-piece-catalog';
import { createHexFitLevelValidator } from '@domain/variants/hexa-fit/hex-fit-level-validator';
import { useEffect, useState } from 'react';

const CELL_SIZE = 20;
const GRID = BoardShape.ofRadius(new HexGeometry(), 4).coords;
const CATALOG = loadHexPieceCatalog();
const VALIDATOR = createHexFitLevelValidator();
const PIECE_COLORS = ['#327a70', '#b75d40', '#5377af', '#8a5c9e', '#927823'];

interface Draft {
  readonly cells: readonly string[];
  readonly pieces: readonly string[];
  readonly twoStars: string;
  readonly threeStars: string;
}

const EMPTY_DRAFT: Draft = {
  cells: [],
  pieces: [],
  twoStars: '600',
  threeStars: '850',
};

function readDraft(key: string): Draft {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return EMPTY_DRAFT;
    const value: unknown = JSON.parse(raw);
    if (value === null || typeof value !== 'object') return EMPTY_DRAFT;
    if (
      !('cells' in value) ||
      !Array.isArray(value.cells) ||
      !('pieces' in value) ||
      !Array.isArray(value.pieces) ||
      !('twoStars' in value) ||
      typeof value.twoStars !== 'string' ||
      !('threeStars' in value) ||
      typeof value.threeStars !== 'string'
    )
      return EMPTY_DRAFT;

    const savedCells: readonly unknown[] = value.cells;
    const savedPieces: readonly unknown[] = value.pieces;
    return {
      cells: GRID.map((cell) => cell.key()).filter((key) =>
        savedCells.includes(key),
      ),
      pieces: savedPieces.filter(
        (id): id is string => typeof id === 'string' && CATALOG.has(id),
      ),
      twoStars: value.twoStars,
      threeStars: value.threeStars,
    };
  } catch {
    return EMPTY_DRAFT;
  }
}

function polygon({ q, r }: HexCoord): string {
  const x = 170 + CELL_SIZE * Math.sqrt(3) * (q + r / 2);
  const y = 145 + CELL_SIZE * 1.5 * r;
  return Array.from({ length: 6 }, (_, corner) => {
    const angle = ((corner * 60 - 30) * Math.PI) / 180;
    return [
      x + (CELL_SIZE - 1) * Math.cos(angle),
      y + (CELL_SIZE - 1) * Math.sin(angle),
    ].join(',');
  }).join(' ');
}

export function FitLevelEditor({
  accountKey = 'local',
}: {
  readonly accountKey?: string;
}) {
  const storageKey = 'hexablock.fit-draft.v1.' + accountKey;
  const [draft, setDraft] = useState(() => readDraft(storageKey));
  const [selectedPiece, setSelectedPiece] = useState(
    CATALOG.shapes[0]?.id ?? '',
  );
  const [result, setResult] = useState<ReturnType<
    typeof VALIDATOR.validateSpec
  > | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(draft));
      setSaveFailed(false);
    } catch {
      setSaveFailed(true);
    }
  }, [draft, storageKey]);

  function update(change: Partial<Draft>) {
    setDraft({ ...draft, ...change });
    setResult(null);
  }

  function toggleCell(key: string) {
    update({
      cells: draft.cells.includes(key)
        ? draft.cells.filter((cell) => cell !== key)
        : [...draft.cells, key],
    });
  }

  function validate() {
    setResult(
      VALIDATOR.validateSpec({
        figure: GRID.filter((cell) => draft.cells.includes(cell.key())).map(
          ({ q, r }) => ({ q, r }),
        ),
        pieces: draft.pieces,
        starThresholds: {
          twoStars: Number(draft.twoStars),
          threeStars: Number(draft.threeStars),
        },
      }),
    );
  }

  const pieceArea = draft.pieces.reduce(
    (total, id) => total + CATALOG.get(id).size,
    0,
  );
  const areaMatches =
    draft.cells.length > 0 && draft.cells.length === pieceArea;

  return (
    <section className="editor-section" aria-labelledby="fit-editor-heading">
      <div className="editor-header">
        <h2 id="fit-editor-heading">Hexa Fit level editor</h2>
        <div className="editor-metrics">
          <span>Figure: {draft.cells.length} cells</span>
          <span className={areaMatches ? 'metric-match' : undefined}>
            Pieces: {pieceArea} cells
          </span>
        </div>
      </div>
      <div className="editor-grid">
        <fieldset className="editor-panel">
          <legend>Draw the figure</legend>
          <div className="canvas-frame">
            <svg
              width="340"
              height="290"
              viewBox="0 0 340 290"
              style={{ maxWidth: '100%', height: 'auto' }}
            >
              {GRID.map((cell) => {
                const key = cell.key();
                const active = draft.cells.includes(key);
                return (
                  <polygon
                    key={key}
                    className="hex-cell-interactive"
                    points={polygon(cell)}
                    tabIndex={0}
                    role="button"
                    aria-label={'Cell ' + key}
                    aria-pressed={active}
                    fill={active ? '#327a70' : '#edf2f6'}
                    stroke="#415969"
                    onClick={() => toggleCell(key)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        toggleCell(key);
                      }
                    }}
                  />
                );
              })}
            </svg>
          </div>
        </fieldset>
        <div className="editor-controls">
          <fieldset className="editor-panel">
            <legend>Catalog pieces</legend>
            <div className="piece-picker-row">
              <label>
                Piece{' '}
                <select
                  value={selectedPiece}
                  onChange={(event) => setSelectedPiece(event.target.value)}
                >
                  {CATALOG.shapes.map(({ id, size }) => (
                    <option key={id} value={id}>
                      {id} ({size} cells)
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="btn-secondary"
                disabled={!selectedPiece}
                onClick={() =>
                  update({ pieces: [...draft.pieces, selectedPiece] })
                }
              >
                Add piece
              </button>
            </div>
            <ol className="piece-list">
              {draft.pieces.map((id, index) => (
                <li key={index} className="piece-item">
                  <span>{id}</span>
                  <button
                    type="button"
                    className="btn-ghost"
                    aria-label={`Remove ${id} (piece ${index + 1})`}
                    onClick={() =>
                      update({
                        pieces: draft.pieces.filter(
                          (_, current) => current !== index,
                        ),
                      })
                    }
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ol>
          </fieldset>
          <fieldset className="editor-panel">
            <legend>Star thresholds</legend>
            <div className="thresholds-row">
              <label>
                Two stars{' '}
                <input
                  type="number"
                  min="1"
                  value={draft.twoStars}
                  onChange={(event) => update({ twoStars: event.target.value })}
                />
              </label>
              <label>
                Three stars{' '}
                <input
                  type="number"
                  min="1"
                  value={draft.threeStars}
                  onChange={(event) =>
                    update({ threeStars: event.target.value })
                  }
                />
              </label>
            </div>
          </fieldset>
          <div className="editor-actions">
            <button type="button" className="btn-primary" onClick={validate}>
              Validate
            </button>
          </div>
        </div>
      </div>
      {saveFailed && (
        <p role="alert" className="alert-banner">
          This browser could not save the draft.
        </p>
      )}
      {result?.valid === false && (
        <ul role="alert" className="alert-list">
          {result.errors.map(({ field, message }) => (
            <li key={field}>{message}</li>
          ))}
        </ul>
      )}
      {result?.valid === true && (
        <section className="solution-card" aria-label="Validation result">
          <p role="status" className="solution-status">
            Solution found
          </p>
          <div className="canvas-frame">
            <svg
              role="img"
              aria-label="Fit solution"
              width="340"
              height="290"
              viewBox="0 0 340 290"
              style={{ maxWidth: '100%', height: 'auto' }}
            >
              {result.solution.flatMap(({ pieceIndex, cells }) =>
                cells.map((cell) => (
                  <polygon
                    key={cell.key()}
                    points={polygon(cell)}
                    stroke="#415969"
                    fill={PIECE_COLORS[pieceIndex % PIECE_COLORS.length]}
                  />
                )),
              )}
            </svg>
          </div>
        </section>
      )}
    </section>
  );
}

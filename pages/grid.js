import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import styles from '../styles/Grid.module.css';

const API_BASE = process.env.NEXT_PUBLIC_CW_BASE_URL || '';

const cwPost = async (payload) => {
  const response = await fetch(`${API_BASE}/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=utf-8'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`CW isteği başarısız oldu: ${response.status}`);
  }

  return response.json();
};

const createEmptyBoard = (width, height) => {
  return Array.from({ length: height }, () => Array.from({ length: width }, () => null));
};

export default function GridPage() {
  const [gridNames, setGridNames] = useState([]);
  const [selectedGridIndex, setSelectedGridIndex] = useState(0);
  const [board, setBoard] = useState([]);
  const [cellSize, setCellSize] = useState(120);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const selectedGridName = useMemo(() => gridNames[selectedGridIndex] || '', [gridNames, selectedGridIndex]);

  const loadGridNames = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await cwPost({ action: 'list_grid_names' });
      if (data?.grids && Array.isArray(data.grids)) {
        setGridNames(data.grids);
        setSelectedGridIndex(0);
      } else {
        throw new Error('Geçersiz grid yanıtı alındı.');
      }
    } catch (err) {
      setError(err.message);
      setGridNames([]);
    } finally {
      setLoading(false);
    }
  };

  const loadGridCells = async (gridName) => {
    if (!gridName) return;
    setLoading(true);
    setError(null);

    try {
      const data = await cwPost({ action: 'list_grid_cells', grid: gridName });
      const grid = data?.grids?.[0];
      if (!grid) {
        throw new Error('Grid hücresi verisi bulunamadı.');
      }

      const width = grid.size?.[0] || 0;
      const height = grid.size?.[1] || 0;
      const emptyBoard = createEmptyBoard(width, height);

      if (Array.isArray(data.grids)) {
        data.grids.forEach((gridSlice) => {
          gridSlice.cells?.forEach((cell) => {
            const [x, y] = cell.position || [];
            if (typeof x === 'number' && typeof y === 'number' && y < height && x < width) {
              emptyBoard[y][x] = {
                text: cell.text || '',
                color: Array.isArray(cell.color) ? `rgb(${cell.color.join(',')})` : undefined,
                keyLabel: cell.key || ''
              };
            }
          });
        });
      }

      setBoard(emptyBoard);
    } catch (err) {
      setError(err.message);
      setBoard([]);
    } finally {
      setLoading(false);
    }
  };

  const activateCell = async (x, y) => {
    if (!selectedGridName) return;
    try {
      await cwPost({ action: 'activate_grid_cell', grid: selectedGridName, cell: [x, y] });
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadGridNames();
  }, []);

  useEffect(() => {
    if (selectedGridName) {
      loadGridCells(selectedGridName);
      document.title = `CharacterWorks - ${selectedGridName}`;
    }
  }, [selectedGridName]);

  return (
    <>
      <Head>
        <title>CharacterWorks Grid</title>
      </Head>
      <div className={styles.page}>
        <section className={styles.toolbar}>
          <h1>CharacterWorks Grid</h1>
          {error && <div className={styles.error}>{error}</div>}
          <div className={styles.controls}>
            <label>
              Grid seç:
              <select
                value={selectedGridIndex}
                onChange={(event) => setSelectedGridIndex(Number(event.target.value))}
              >
                {gridNames.map((name, index) => (
                  <option key={name || index} value={index}>
                    {name || `Grid ${index + 1}`}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Boyut:
              <input
                type="range"
                min="60"
                max="220"
                value={cellSize}
                onChange={(event) => setCellSize(Number(event.target.value))}
              />
            </label>
            <button type="button" onClick={() => loadGridCells(selectedGridName)} disabled={loading}>
              Yenile
            </button>
          </div>
        </section>

        <section className={styles.board} style={{ width: board[0]?.length ? board[0].length * (cellSize + 4) : 'auto' }}>
          {loading && <div className={styles.loading}>Yükleniyor...</div>}
          {board.length === 0 && !loading && <div className={styles.empty}>Grid verisi yok.</div>}
          {board.map((row, y) => (
            <div className={styles.row} key={`row-${y}`}>
              {row.map((cell, x) => {
                const hasCell = Boolean(cell);
                const style = {
                  width: cellSize,
                  height: cellSize,
                  boxShadow: hasCell ? `inset 0px 15px ${cell.color}` : undefined
                };
                return (
                  <button
                    key={`cell-${y}-${x}`}
                    className={hasCell ? styles.cell : styles.emptyCell}
                    style={style}
                    type="button"
                    onClick={() => activateCell(x, y)}
                  >
                    {hasCell ? (
                      <>
                        <div>{cell.text}</div>
                        <div className={styles.keyLabel}>{cell.keyLabel}</div>
                      </>
                    ) : (
                      <span />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </section>
      </div>
    </>
  );
}

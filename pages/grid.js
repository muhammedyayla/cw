import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import styles from '../styles/Grid.module.css';

const API_BASE = process.env.NEXT_PUBLIC_CW_BASE_URL || '';

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
  const [baseUrl, setBaseUrl] = useState('');
  const [configured, setConfigured] = useState(Boolean(API_BASE));

  const selectedGridName = useMemo(() => gridNames[selectedGridIndex] || '', [gridNames, selectedGridIndex]);

  const getApiBase = () => {
    const url = (baseUrl || API_BASE || '').trim().replace(/\/+$/, '');
    return url;
  };

  const cwPost = async (payload) => {
    const apiBase = getApiBase();
    if (!apiBase) {
      throw new Error('CW sunucu adresi ayarlı değil. Lütfen IP ve portu girin.');
    }

    // /api/cw proxy üzerinden gönder → CORS sorunu ortadan kalkar
    const response = await fetch('/api/cw', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
        'X-CW-Target': apiBase  // proxy hangi adrese ileteceğini bu başlıktan öğrenir
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    if (!response.ok) {
      let detail = responseText;
      try { detail = JSON.parse(responseText)?.error || responseText; } catch {}
      throw new Error(detail || `CW isteği başarısız oldu: ${response.status}`);
    }

    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      throw new Error('Geçersiz JSON yanıtı alındı. Bu muhtemelen yanlış IP/port veya farklı bir sunucuya istek gönderildi.');
    }
  };

  const saveBaseUrl = () => {
    const normalizedUrl = baseUrl.trim().replace(/\/+$/, '');
    localStorage.setItem('cwBaseUrl', normalizedUrl);
    setBaseUrl(normalizedUrl);
    setConfigured(Boolean(normalizedUrl || API_BASE));
    setError(null);
  };

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
    if (typeof window !== 'undefined') {
      const savedUrl = localStorage.getItem('cwBaseUrl') || '';
      setBaseUrl(savedUrl);
      setConfigured(Boolean(savedUrl || API_BASE));
    }
  }, []);

  useEffect(() => {
    if (configured) {
      loadGridNames();
    }
  }, [configured]);

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
          <div className={styles.config}>
            <label>
              CW Sunucu Adresi:
              <input
                type="text"
                value={baseUrl}
                placeholder="http://127.0.0.1:8080"
                onChange={(event) => setBaseUrl(event.target.value)}
              />
            </label>
            <button type="button" onClick={saveBaseUrl}>
              Adresi Kaydet
            </button>
          </div>
          {!configured && (
            <div className={styles.notice}>
              CW sunucu IP adresi veya portu ayarlı değil. Lütfen bir adres girin ve kaydedin.
            </div>
          )}
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
            <button type="button" onClick={() => loadGridCells(selectedGridName)} disabled={loading || !configured}>
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

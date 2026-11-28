import type { AsyncCommandService } from '@application/use-cases/use-case';
import type {
  LoadSeedConfigsInput,
  SaveSeedConfigInput,
} from '@application/use-cases/seed-settings';
import type {
  SeedGameId,
  SeedSettingsEntry,
} from '@application/ports/admin-seed-config-repository';
import type { SeedMode } from '@domain/content/seed-config';
import { useEffect, useState, type FormEvent } from 'react';

export interface SeedSettingsServices {
  readonly load: AsyncCommandService<
    LoadSeedConfigsInput,
    readonly SeedSettingsEntry[]
  >;
  readonly save: AsyncCommandService<SaveSeedConfigInput, void>;
}

export function SeedSettings({ load, save }: SeedSettingsServices) {
  const [gameId, setGameId] = useState<SeedGameId>('hexa-lines');
  const [entries, setEntries] = useState<readonly SeedSettingsEntry[]>([]);
  const [levelId, setLevelId] = useState('');
  const [mode, setMode] = useState<SeedMode>('random');
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  function select(entry: SeedSettingsEntry | undefined) {
    setLevelId(entry?.levelId ?? '');
    setMode(entry?.config.mode ?? 'random');
    setValue(entry?.config.mode === 'fixed' ? String(entry.config.value) : '');
  }

  useEffect(() => {
    let active = true;
    void load
      .execute({ gameId })
      .then((result) => {
        if (!active) return;
        if (result.isLeft()) {
          setError(result.value.message);
          setEntries([]);
        } else {
          setEntries(result.value);
          select(result.value[0]);
        }
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setError('Seed settings are unavailable.');
        setEntries([]);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [gameId, load]);

  const currentEntry = entries.find(
    (entry) => entry.levelId === (gameId === 'hexa-sort' ? levelId : null),
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading || saving || entries.length === 0) return;
    setError('');
    setStatus('');
    setSaving(true);
    const result = await save
      .execute({
        target: gameId === 'hexa-sort' ? { gameId, levelId } : { gameId },
        config:
          mode === 'random'
            ? { mode }
            : { mode, value: value === '' ? NaN : Number(value) },
      })
      .catch(() => null);
    setSaving(false);
    if (result === null) {
      setError('Seed settings are unavailable.');
    } else if (result.isLeft()) {
      setError(result.value.message);
    } else {
      const config =
        mode === 'random' ? { mode } : { mode, value: Number(value) };
      setEntries(
        entries.map((entry) =>
          entry.levelId === (gameId === 'hexa-sort' ? levelId : null)
            ? { ...entry, config }
            : entry,
        ),
      );
      setStatus('Seed settings saved.');
    }
  }

  return (
    <section className="seed-card" aria-labelledby="seed-settings-heading">
      <div className="seed-header">
        <h2 id="seed-settings-heading">Seed settings</h2>
        {currentEntry && (
          <span className="seed-badge">
            {currentEntry.config.mode === 'fixed'
              ? `Fixed · ${currentEntry.config.value}`
              : 'Random'}
          </span>
        )}
      </div>
      <div className="field-group">
        <label>
          Game
          <select
            value={gameId}
            disabled={saving}
            onChange={(event) => {
              const next = event.target.value;
              if (
                next !== 'hexa-lines' &&
                next !== 'hexa-merge' &&
                next !== 'hexa-sort'
              )
                return;
              setEntries([]);
              setLoading(true);
              setError('');
              setStatus('');
              setGameId(next);
            }}
          >
            <option value="hexa-lines">Hexa Lines</option>
            <option value="hexa-merge">Hexa Merge</option>
            <option value="hexa-sort">Hexa Sort</option>
          </select>
        </label>
      </div>
      {loading && (
        <p role="status" className="status-muted">
          Loading seed settings…
        </p>
      )}
      {!loading && !error && entries.length === 0 && (
        <p className="status-muted">No seed configurations available.</p>
      )}
      {entries.length > 0 && (
        <form
          onSubmit={(event) => {
            void submit(event);
          }}
        >
          <fieldset className="seed-fieldset" disabled={saving}>
            <legend>Seed configuration</legend>
            <div className="seed-fields">
              {gameId === 'hexa-sort' && (
                <label>
                  Level
                  <select
                    value={levelId}
                    onChange={(event) => {
                      select(
                        entries.find(
                          (entry) => entry.levelId === event.target.value,
                        ),
                      );
                      setError('');
                      setStatus('');
                    }}
                  >
                    {entries.map((entry) => (
                      <option key={entry.levelId} value={entry.levelId ?? ''}>
                        {entry.levelId}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label>
                Mode
                <select
                  value={mode}
                  onChange={(event) => {
                    setMode(
                      event.target.value === 'fixed' ? 'fixed' : 'random',
                    );
                    setError('');
                    setStatus('');
                  }}
                >
                  <option value="random">Random</option>
                  <option value="fixed">Fixed</option>
                </select>
              </label>
              {mode === 'fixed' && (
                <label>
                  Fixed seed
                  <input
                    type="number"
                    min="0"
                    max="4294967295"
                    step="1"
                    required
                    value={value}
                    onChange={(event) => {
                      setValue(event.target.value);
                      setError('');
                      setStatus('');
                    }}
                  />
                </label>
              )}
            </div>
            {mode === 'fixed' && (
              <p className="seed-hint">
                Unsigned 32-bit integer from 0 to 4294967295.
              </p>
            )}
            <div className="seed-actions">
              <button type="submit" className="btn-primary">
                Save seed
              </button>
            </div>
          </fieldset>
        </form>
      )}
      {error && (
        <p role="alert" className="alert-banner">
          {error}
        </p>
      )}
      {status && (
        <p role="status" className="status-banner">
          {status}
        </p>
      )}
    </section>
  );
}

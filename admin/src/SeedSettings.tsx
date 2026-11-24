import type { AsyncCommandService } from '@application/use-cases/use-case';
import type {
  LoadSeedConfigsInput,
  SaveSeedConfigInput,
} from '@application/use-cases/seed-settings';
import type {
  SeedGameId,
  SeedSettingsEntry,
  SeedSettingsError,
} from '@application/ports/admin-seed-config-repository';
import type { SeedMode } from '@domain/content/seed-config';
import { useEffect, useState, type FormEvent } from 'react';

export interface SeedSettingsServices {
  readonly load: AsyncCommandService<
    LoadSeedConfigsInput,
    readonly SeedSettingsEntry[],
    SeedSettingsError
  >;
  readonly save: AsyncCommandService<
    SaveSeedConfigInput,
    void,
    SeedSettingsError
  >;
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
    <section aria-labelledby="seed-settings-heading">
      <h2 id="seed-settings-heading">Seed settings</h2>
      <label>
        Game{' '}
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
      {loading && <p role="status">Loading seed settings…</p>}
      {!loading && !error && entries.length === 0 && (
        <p>No seed configurations available.</p>
      )}
      {entries.length > 0 && (
        <form
          onSubmit={(event) => {
            void submit(event);
          }}
        >
          <fieldset disabled={saving}>
            <legend>Seed configuration</legend>
            {gameId === 'hexa-sort' && (
              <label>
                Level{' '}
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
            )}{' '}
            <label>
              Mode{' '}
              <select
                value={mode}
                onChange={(event) => {
                  setMode(event.target.value === 'fixed' ? 'fixed' : 'random');
                  setError('');
                  setStatus('');
                }}
              >
                <option value="random">Random</option>
                <option value="fixed">Fixed</option>
              </select>
            </label>{' '}
            {mode === 'fixed' && (
              <label>
                Fixed seed{' '}
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
            )}{' '}
            <button type="submit">Save seed</button>
          </fieldset>
        </form>
      )}
      {error && <p role="alert">{error}</p>}
      {status && <p role="status">{status}</p>}
    </section>
  );
}

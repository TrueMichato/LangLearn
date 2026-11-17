// This entrypoint is NEVER referenced by the deployable wrangler.toml.
import { BackupVault, handleWorker, type Env } from '../src/index';
import { errorResponse, HttpError, isUUID, json, readJSON } from '../src/protocol';

interface TestEnv extends Env {
  TEST_SECRET: string;
}

export class TestBackupVault extends BackupVault {
  protected override now(): number {
    const table = this.sql.exec("SELECT name FROM sqlite_master WHERE name = 'fixture_clock'").toArray();
    return table.length ? this.sql.exec<{ ms: number }>('SELECT ms FROM fixture_clock').one().ms : super.now();
  }

  override async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/__fixture/')) return super.fetch(request);
    try {
      if (request.headers.get('Authorization') !== `Bearer ${(this.env as TestEnv).TEST_SECRET}`) {
        throw new HttpError(401, 'unauthorized', 'Fixture authentication required.');
      }
      const item = await readJSON(request, 1024) as Record<string, unknown>;
      if (url.pathname === '/__fixture/clock' && Number.isSafeInteger(item.ms)) {
        this.sql.exec('CREATE TABLE IF NOT EXISTS fixture_clock (ms INTEGER NOT NULL)');
        this.sql.exec('DELETE FROM fixture_clock');
        this.sql.exec('INSERT INTO fixture_clock VALUES (?)', item.ms as number);
      } else if (url.pathname === '/__fixture/corrupt' && isUUID(item.id)) {
        this.sql.exec("UPDATE chunks SET chunk_text = 'corrupt synthetic fixture' WHERE checkpoint_id = ? AND chunk_index = 0", item.id);
      } else if (url.pathname === '/__fixture/usage' && Number.isSafeInteger(item.bytes)) {
        // Make impossible-to-fit/rollback tests cheap; production has no quota override.
        this.sql.exec('UPDATE vault SET stored_bytes = ? WHERE singleton = 1', item.bytes as number);
      } else if (url.pathname === '/__fixture/inspect') {
        return json({
          chunks: this.sql.exec('SELECT checkpoint_id, COUNT(*) AS count, MAX(length(chunk_text)) AS max FROM chunks GROUP BY checkpoint_id').toArray(),
        });
      } else {
        throw new HttpError(400, 'invalid-fixture', 'Unknown fixture operation.');
      }
      return json({ ok: true });
    } catch (error) {
      return errorResponse(error);
    }
  }
}

export default {
  async fetch(request: Request, env: TestEnv): Promise<Response> {
    const url = new URL(request.url);
    const match = /^\/__fixture\/([^/]+)\/(clock|corrupt|usage|inspect)$/.exec(url.pathname);
    if (match) {
      if (request.method !== 'POST' || request.headers.get('Authorization') !== `Bearer ${env.TEST_SECRET}` || !isUUID(match[1])) {
        return json({ error: { code: 'unauthorized', message: 'Fixture authentication required.' } }, 401);
      }
      url.pathname = `/__fixture/${match[2]}`;
      return env.VAULTS.get(env.VAULTS.idFromName(match[1].toLowerCase())).fetch(new Request(url, request));
    }
    return handleWorker(request, env);
  },
} satisfies ExportedHandler<TestEnv>;

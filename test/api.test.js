import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchJson } from '../lib/api.js';

test('HTTP errors retain status and rate-limit guidance', async () => {
  await assert.rejects(fetchJson('agents', {
    fetchImpl: async () => new Response('{}', { status: 429, headers: { 'retry-after': '42' } }),
  }), error => error.status === 429 && /retry after 42/.test(error.message));
});

test('slow API calls are aborted within the configured deadline', async () => {
  let aborted = false;
  await assert.rejects(fetchJson('agents', {
    timeoutMs: 20,
    fetchImpl: (_url, { signal }) => new Promise((resolve, reject) => {
      const timer = setTimeout(() => resolve(Response.json({})), 2000);
      signal.addEventListener('abort', () => {
        aborted = true;
        clearTimeout(timer);
        reject(signal.reason);
      }, { once: true });
    }),
  }), /timed out/);
  assert.equal(aborted, true);
});

test('caller cancellation reaches the API request', async () => {
  const controller = new AbortController();
  controller.abort(new Error('cancelled by client'));
  await assert.rejects(fetchJson('agents', {
    signal: controller.signal,
    fetchImpl: async (_url, { signal }) => { signal.throwIfAborted(); },
  }), /cancelled by client/);
});

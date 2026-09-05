/**
 * Regression test for DSH 0.1.2-rc.1 settings compatibility.
 *
 * That release validates namespace strings inside register/get and no longer
 * exports the older settingsNamespace() runtime helper. Importing the plugin
 * must therefore succeed without requesting that removed export, while its
 * settings registration must continue to use the validated "terminal" name.
 */
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import * as dshSettings from '@deepseek-ai/dsh-settings'
import { apply, name } from '../lib/index.js'

assert.equal(dshSettings.settingsNamespace, undefined)
assert.equal(name, 'dsh-plugin-terminal')

const dataDir = mkdtempSync(join(tmpdir(), 'dsh-term-settings-compat-'))
process.env.DSH_PLUGIN_TERMINAL_DATA = dataDir

let registeredNamespace
let registeredRoute
let watched = false
let disposed

const settings = {
  register(namespace) {
    registeredNamespace = namespace
    return {
      watch() {
        watched = true
      },
    }
  },
  get(namespace) {
    assert.equal(namespace, 'terminal')
    return { toggleShortcut: 'meta+j', shellCommand: '' }
  },
}

const ctx = {
  webServer: {
    register(route) {
      registeredRoute = route
      return () => {}
    },
    registerUpgrade() { return () => {} },
  },
  get() { return undefined },
  inject(dependencies, callback) {
    assert.deepEqual(dependencies, ['settings'])
    callback({ settings })
  },
  effect(callback) {
    disposed = callback()
  },
}

try {
  apply(ctx)
  assert.equal(registeredNamespace, 'terminal')
  assert.equal(watched, true)
  assert.equal(registeredRoute?.path, '/terminal-panel')

  let status
  let body
  await registeredRoute.handler({
    headers: {},
    method: 'GET',
    url: '/terminal-panel/config',
  }, {
    writeHead(nextStatus) { status = nextStatus },
    end(text) { body = text },
  })
  assert.equal(status, 200)
  assert.deepEqual(JSON.parse(body), {
    toggleShortcut: 'meta+j',
    shellCommand: '',
  })
  console.log('PASS: DSH 0.1.2-rc.1 settings registration works without settingsNamespace()')
  console.log('PASS: settings value meta+j reaches the browser config route')
} finally {
  disposed?.()
  delete process.env.DSH_PLUGIN_TERMINAL_DATA
  rmSync(dataDir, { recursive: true, force: true })
}

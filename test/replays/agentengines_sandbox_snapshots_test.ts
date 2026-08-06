/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import 'jasmine';

import {ReplayClient} from './_replay_client.js';

describe('AgentEnginesSandboxSnapshots', () => {
  let client: ReplayClient;

  beforeEach(() => {
    client = new ReplayClient({
      project: 'test-project',
      location: 'us-central1',
    });
  });

  it('creates a sandbox environment snapshot', async () => {
    const fetchSpy = client.setupReplay(
        'ae_sandbox_snapshots_create/test_create_sandbox_snapshot.vertex.json');

    const createOp =
        await client.agentEnginesInternal.sandboxes.snapshots.createInternal({
          sourceSandboxEnvironmentName:
              `projects/802583348448/locations/us-central1/reasoningEngines/6130241318758121472/sandboxEnvironments/525190525100228608`,
          config: {
            displayName: 'test_snapshot',
            ttl: '3600s',
            owner: 'test_owner',
          },
        });
    client.verifyInteraction(0, fetchSpy.calls.argsFor(0));
    expect(createOp.name).toBeDefined();
    client.verifyAllInteractions();
  });

  it('gets a sandbox environment snapshot', async () => {
    const fetchSpy = client.setupReplay(
        'ae_sandbox_snapshots_get/test_get_sandbox_snapshot.vertex.json');

    const snapshotName =
        `projects/802583348448/locations/us-central1/reasoningEngines/6130241318758121472/sandboxEnvironmentSnapshots/2433069698686910464`;
    const snapshot =
        await client.agentEnginesInternal.sandboxes.snapshots.getInternal({
          name: snapshotName,
        });
    client.verifyInteraction(0, fetchSpy.calls.argsFor(0));
    expect(snapshot.name).toEqual(snapshotName);
    client.verifyAllInteractions();
  });

  it('lists sandbox environment snapshots', async () => {
    const fetchSpy = client.setupReplay(
        'ae_sandbox_snapshots_list/test_list_sandbox_snapshots.vertex.json');

    const listResponse =
        await client.agentEnginesInternal.sandboxes.snapshots.listInternal({
          name:
              `projects/802583348448/locations/us-central1/reasoningEngines/6130241318758121472`,
        });
    client.verifyInteraction(0, fetchSpy.calls.argsFor(0));
    expect(listResponse.sandboxEnvironmentSnapshots).toBeDefined();
    client.verifyAllInteractions();
  });

  it('deletes a sandbox environment snapshot', async () => {
    const fetchSpy = client.setupReplay(
        'ae_sandbox_snapshots_delete/test_delete_sandbox_snapshot.vertex.json');

    const deleteOp =
        await client.agentEnginesInternal.sandboxes.snapshots.deleteInternal({
          name:
              `projects/802583348448/locations/us-central1/reasoningEngines/6130241318758121472/sandboxEnvironmentSnapshots/421086565159141376`,
        });
    client.verifyInteraction(0, fetchSpy.calls.argsFor(0));
    expect(deleteOp.name).toBeDefined();
    client.verifyAllInteractions();
  });
});

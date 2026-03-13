/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import 'jasmine';

import {NodeAuth} from '@google/genai/vertex_internal';

import {ReplayClient} from './_replay_client.js';

describe('AgentEngines', () => {
  let client: ReplayClient;

  beforeEach(() => {
    client = new ReplayClient({
      project: 'test-project',
      location: 'us-central1',
    });
  });

  it('creates an agent engine', async () => {
    const fetchSpy = client.setupReplay(
        'agent_engine_private_create/test_private_create_with_labels.vertex.json');

    const createOp = await (client.agentEnginesInternal as any).createInternal({
      config: {labels: {'test-label': 'test-value'}}
    });

    client.verifyInteraction(0, fetchSpy.calls.argsFor(0));
    expect(createOp.name).toBeDefined();

    client.verifyAllInteractions();
  });

  it('udpates an agent engine', async () => {
    const fetchSpy = client.setupReplay(
        'agent_engine_private_update/test_private_update.vertex.json');

    const updateOp = await (client.agentEnginesInternal as any).updateInternal({
      name: 'reasoningEngines/2886612747586371584',
      config: {displayName: 'test-agent-engine-updated'}
    });

    client.verifyInteraction(0, fetchSpy.calls.argsFor(0));
    expect(updateOp.name).toBeDefined();

    client.verifyAllInteractions();
  });

  it('gets an agent engine resource', async () => {
    const fetchSpy = client.setupReplay(
        'agent_engine_private_get/test_private_get.vertex.json');

    const reasoningEngine =
        await (client.agentEnginesInternal as any).getInternal({
          name: 'reasoningEngines/2886612747586371584',
        });

    client.verifyInteraction(0, fetchSpy.calls.argsFor(0));
    expect(reasoningEngine.name).toBeDefined();

    client.verifyAllInteractions();
  });

  it('deletes an agent engine resource', async () => {
    const fetchSpy = client.setupReplay(
        'agent_engine_private_delete/test_private_delete.vertex.json');

    const reasoningEngine =
        await (client.agentEnginesInternal as any).deleteInternal({
          name: 'reasoningEngines/7571341522470174720',
        });

    client.verifyInteraction(0, fetchSpy.calls.argsFor(0));
    expect(reasoningEngine.name).toBeDefined();

    client.verifyAllInteractions();
  });
});

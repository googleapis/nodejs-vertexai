/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import 'jasmine';

import {NodeAuth} from '@google/genai/vertex_internal';

import {Client} from '../../src/genai/client.js';

import {ReplaySession} from './replay_util_test';

describe('AgentEngines', () => {
  let client: Client;

  beforeEach(() => {
    spyOn(NodeAuth.prototype, 'addAuthHeaders')
        .and.callFake(async (headers: Headers) => {
          headers.set('Authorization', 'Bearer fake-token');
        });

    client = new Client({
      project: process.env['GOOGLE_CLOUD_PROJECT'],
      location: process.env['GOOGLE_CLOUD_LOCATION'],
    });
  });

  it('creates an agent engine', async () => {
    const replay = new ReplaySession(
        'create_agent_engine/test_create_with_labels.vertex.json');
    replay.start();

    const createOp = await (client.agentEnginesInternal as any).createInternal({
      config: {labels: {'test-label': 'test-value'}}
    });
    expect(createOp.name).toBeDefined();

    // TODO: remove polling when new replay recordings are available.
    let getOpResponse =
        await (client.agentEnginesInternal as any).getAgentOperationInternal({
          operationName: createOp.name
        });
    getOpResponse =
        await (client.agentEnginesInternal as any).getAgentOperationInternal({
          operationName: createOp.name
        });
    expect(getOpResponse.done).toBeTrue();
    const engineName = getOpResponse.response.name;

    await (client.agentEnginesInternal as any)
        .deleteInternal({name: engineName, force: true});

    replay.verify();
  });

  it('updates an agent engine', async () => {
    const replay = new ReplaySession(
        'update_agent_engine/test_agent_engines_update.vertex.json');
    replay.start();

    const createOp =
        await (client.agentEnginesInternal as any).createInternal({});
    let getOpResponse =
        await (client.agentEnginesInternal as any).getAgentOperationInternal({
          operationName: createOp.name
        });
    getOpResponse =
        await (client.agentEnginesInternal as any).getAgentOperationInternal({
          operationName: createOp.name
        });
    const engineName = getOpResponse.response.name;

    const updateOp = await (client.agentEnginesInternal as any).updateInternal({
      name: engineName,
      config: {displayName: 'updated-name'}
    });
    expect(updateOp.name).toBeDefined();

    await (client.agentEnginesInternal as any)
        .deleteInternal({name: engineName, force: true});

    replay.verify();
  });

  it('deletes an agent engine', async () => {
    const replay = new ReplaySession(
        'delete_agent_engine/test_agent_engine_delete.vertex.json');
    replay.start();

    const op = await (client.agentEnginesInternal as any).createInternal({});
    expect(op.name).toBeDefined();

    let getOpResponse =
        await (client.agentEnginesInternal as any).getAgentOperationInternal({
          operationName: op.name
        });
    expect(getOpResponse.done).toBeFalsy();

    getOpResponse =
        await (client.agentEnginesInternal as any).getAgentOperationInternal({
          operationName: op.name
        });
    expect(getOpResponse.done).toBeTrue();
    const engineName = getOpResponse.response.name;

    const deleteOp = await (client.agentEnginesInternal as any).deleteInternal({
      name: engineName
    });
    expect(deleteOp.name).toBeDefined();

    replay.verify();
  });
});

// TODO: add more tests when new replay recordings are available.
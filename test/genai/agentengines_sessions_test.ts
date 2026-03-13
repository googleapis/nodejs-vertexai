/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import 'jasmine';

import {NodeAuth} from '@google/genai/vertex_internal';

import {Client} from '../../src/genai/client.js';

import {ReplaySession} from './replay_util_test';

describe('AgentEnginesSessions', () => {
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

  it('creates an agent engine session', async () => {
    const replay = new ReplaySession(
        'create_agent_engine_session/test_create_session.vertex.json');
    replay.start();

    const createOp =
        await (client.agentEnginesInternal.sessions as any).createInternal({
          name: `projects/${process.env['GOOGLE_CLOUD_PROJECT']}/locations/${
              process.env['GOOGLE_CLOUD_LOCATION']}/reasoningEngines/123`
        });
    expect(createOp.name).toBeDefined();

    // TODO: remove polling when new replay recordings are available.
    let getOpResponse =
        await (client.agentEnginesInternal.sessions as any)
            .getSessionOperationInternal({operationName: createOp.name});
    getOpResponse =
        await (client.agentEnginesInternal.sessions as any)
            .getSessionOperationInternal({operationName: createOp.name});
    expect(getOpResponse.done).toBeTrue();
    const sessionName = getOpResponse.response.name;

    replay.verify();
  });

  it('deletes an agent engine session', async () => {
    const replay = new ReplaySession(
        'delete_agent_engine_session/test_delete_session.vertex.json');
    replay.start();

    const createOp =
        await (client.agentEnginesInternal.sessions as any).createInternal({
          name: `projects/${process.env['GOOGLE_CLOUD_PROJECT']}/locations/${
              process.env['GOOGLE_CLOUD_LOCATION']}/reasoningEngines/123`
        });
    expect(createOp.name).toBeDefined();

    let getOpResponse =
        await (client.agentEnginesInternal.sessions as any)
            .getSessionOperationInternal({operationName: createOp.name});
    expect(getOpResponse.done).toBeFalsy();

    getOpResponse =
        await (client.agentEnginesInternal.sessions as any)
            .getSessionOperationInternal({operationName: createOp.name});
    expect(getOpResponse.done).toBeTrue();
    const sessionName = getOpResponse.response.name;

    const deleteOp =
        await (client.agentEnginesInternal.sessions as any).delete({
          name: sessionName
        });
    expect(deleteOp.name).toBeDefined();

    replay.verify();
  });
});

// TODO: add more tests when new replay recordings are available.
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import 'jasmine';

import {NodeAuth} from 'google3/third_party/javascript/google_genai/src/g3_node/_g3_node_auth';
import {Client} from 'google3/third_party/javascript/node_modules/vertexai/src/genai/client';

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


  it('lists agent engine sessions', async () => {
    const replay = new ReplaySession(
        'list_agent_engine_sessions/test_list_sessions.vertex.json');
    replay.start();

    const agentEngines = client.agentEnginesInternal as any;
    const sessions = (client.agentEnginesInternal as any).sessions as any;

    const reasoningEngineName =
        'projects/1011645623509/locations/us-central1/reasoningEngines/3679111042073362432';
    const opName = `${reasoningEngineName}/operations/1056525481953722368`;
    const sessionName = `${reasoningEngineName}/sessions/4377339958373908480`;
    const sessionOpName = `${sessionName}/operations/6119978838001713152`;

    await agentEngines.createInternal({});
    await agentEngines.getAgentOperationInternal({operationName: opName});
    await agentEngines.getAgentOperationInternal({operationName: opName});

    await sessions.listInternal({name: reasoningEngineName});

    await sessions.createInternal(
        {name: reasoningEngineName, userId: 'test-user-123'});
    await sessions.getSessionOperationInternal({operationName: sessionOpName});
    await sessions.getSessionOperationInternal({operationName: sessionOpName});

    await sessions.get({name: sessionName});

    const listResponse =
        await sessions.listInternal({name: reasoningEngineName});
    expect(listResponse.sessions.length).toBe(1);

    await sessions.delete({name: sessionName});

    replay.verify(true);
  });
});
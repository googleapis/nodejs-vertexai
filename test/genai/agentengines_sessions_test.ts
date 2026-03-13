/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import 'jasmine';

import {NodeAuth} from '@google/genai/vertex_internal';

import {ReplayClient} from './_replay_client.js';
describe('AgentEnginesSessions', () => {
  let client: ReplayClient;

  beforeEach(() => {
    client = new ReplayClient({
      project: 'test-project',
      location: 'us-central1',
    });
  });

  it('creates an agent engine session', async () => {
    const fetchSpy = client.setupReplay(
        'ae_session_private_create/test_private_create_session.vertex.json');

    const createSessionOp =
        await (client.agentEnginesInternal.sessions as any).createInternal({
          name:
              `projects/964831358985/locations/us-central1/reasoningEngines/2886612747586371584`,
          userId: 'test-user-id',
        });
    client.verifyInteraction(0, fetchSpy.calls.argsFor(0));
    expect(createSessionOp.name).toBeDefined();
    client.verifyAllInteractions();
  });

  it('updates an agent engine session', async () => {
    const fetchSpy = client.setupReplay(
        'ae_session_private_update/test_private_update_session.vertex.json');

    const updateSessionOp =
        await (client.agentEnginesInternal.sessions as any).updateInternal({
          name:
              `reasoningEngines/2886612747586371584/sessions/3080649749292908544`,
          config: {
            displayName: 'test-agent-engine-session-updated',
            userId: 'test-user-id'
          }
        });
    client.verifyInteraction(0, fetchSpy.calls.argsFor(0));

    expect(updateSessionOp.name).toBeDefined();
    client.verifyAllInteractions();
  });

  it('gets an agent engine session operation', async () => {
    const fetchSpy = client.setupReplay(
        'ae_session_private_get/test_private_get_session_operation.vertex.json');

    const getSessionOp =
        await (client.agentEnginesInternal.sessions as any)
            .getSessionOperationInternal({
              operationName:
                  `reasoningEngines/2886612747586371584/sessions/3080649749292908544/operations/758783840595476480`
            });
    client.verifyInteraction(0, fetchSpy.calls.argsFor(0));

    expect(getSessionOp.name).toBeDefined();
    client.verifyAllInteractions();
  });

  it('deletes an agent engine session', async () => {
    const fetchSpy = client.setupReplay(
        'ae_session_delete/test_delete_session_non_blocking.vertex.json');

    const deleteSessionOp =
        await (client.agentEnginesInternal.sessions as any).delete({
          name:
              `reasoningEngines/2886612747586371584/sessions/8521561049109889024`
        });
    client.verifyInteraction(0, fetchSpy.calls.argsFor(0));

    expect(deleteSessionOp.name).toBeDefined();
    client.verifyAllInteractions();
  });
});
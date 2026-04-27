/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import 'jasmine';

import {NodeAuth} from '@google/genai/vertex_internal';

import {ReplayClient} from './_replay_client.js';
describe('SessionEvents', () => {
  let client: ReplayClient;

  beforeEach(() => {
    client = new ReplayClient({
      project: 'test-project',
      location: 'us-central1',
    });
  });

  it('appends an agent engine session event', async () => {
    const fetchSpy = client.setupReplay(
        'ae_session_events_append/test_append_session_event.vertex.json');

    const createEventOp =
        await client.agentEnginesInternal.sessions.events.append({
          name:
              'reasoningEngines/2886612747586371584/sessions/6922431337672474624',
          author: 'test-user-123',
          invocationId: 'test-invocation-id',
          timestamp: '2009-02-13T23:31:00+00:00',
        });
    client.verifyInteraction(0, fetchSpy.calls.argsFor(0));
    client.verifyAllInteractions();
  });
  it('lists session events', async () => {
    const fetchSpy = client.setupReplay(
        'ae_session_events_private_list/test_private_list_session_events.vertex.json');

    const listSessionEventsResponse =
        await client.agentEnginesInternal.sessions.events.listInternal({
          name:
              'reasoningEngines/2886612747586371584/sessions/6922431337672474624',
        });
    client.verifyInteraction(0, fetchSpy.calls.argsFor(0));
    expect(listSessionEventsResponse.sessionEvents).toBeDefined();
    expect(listSessionEventsResponse.sessionEvents!.length).toBeGreaterThan(0);
    expect(listSessionEventsResponse.sessionEvents![0].name)
        .toContain('events/2517327301947949056');
    client.verifyAllInteractions();
  });
});
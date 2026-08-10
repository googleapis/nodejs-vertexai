/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import 'jasmine';

import {NodeAuth} from '@google/genai/vertex_internal';

import {ReplayClient} from './_replay_client.js';

describe('Memories', () => {
  let client: ReplayClient;

  beforeEach(() => {
    client = new ReplayClient({
      project: 'test-project',
      location: 'us-central1',
    });
  });

  it('creates a memory in an agent engine', async () => {
    const fetchSpy = client.setupReplay(
        'ae_memories_private_create/test_private_create_memory.vertex.json');

    const createOp = await client.agentEnginesInternal.memories.createInternal({
      name:
          'projects/964831358985/locations/us-central1/reasoningEngines/2886612747586371584',
      fact: 'memory_fact',
      scope: {'user_id': '123'}
    });

    client.verifyInteraction(0, fetchSpy.calls.argsFor(0));
    expect(createOp.name).toBeDefined();

    client.verifyAllInteractions();
  });
  it('deletes an agent engine memory', async () => {
    const fetchSpy =
        client.setupReplay('ae_memories_delete/test_delete_memory.vertex.json');

    const deleteOp = await client.agentEnginesInternal.memories.delete({
      name:
          'projects/964831358985/locations/us-central1/reasoningEngines/2886612747586371584/memories/5605466683931099136',
    });

    client.verifyInteraction(0, fetchSpy.calls.argsFor(0));
    expect(deleteOp.name).toBeDefined();

    client.verifyAllInteractions();
  });

  it('generates an agent engine memory', async () => {
    const fetchSpy = client.setupReplay(
        'ae_memories_private_generate/test_private_generate_memory.vertex.json');

    const aeName =
        'projects/964831358985/locations/us-central1/reasoningEngines/2886612747586371584';

    const generateOp =
        await client.agentEnginesInternal.memories.generateInternal({
          name: aeName,
          vertexSessionSource: {
            session:
                '{PROJECT_AND_LOCATION_PATH}/reasoningEngines/2886612747586371584/sessions/6922431337672474624'
          },
        });

    client.verifyInteraction(0, fetchSpy.calls.argsFor(0));
    expect(generateOp.name).toBeDefined();
    client.verifyAllInteractions();
  });

  it('gets an agent engine memory', async () => {
    const fetchSpy =
        client.setupReplay('ae_memories_get/test_get_memory.vertex.json');

    const memoryName =
        'projects/964831358985/locations/us-central1/reasoningEngines/2886612747586371584/memories/3858070028511346688';
    const memory = await client.agentEnginesInternal.memories.get({
      name: memoryName,
    });

    client.verifyInteraction(0, fetchSpy.calls.argsFor(0));
    expect(memory.name).toBeDefined();

    client.verifyAllInteractions();
  });


  it('gets an agent engine memory operation', async () => {
    const fetchSpy = client.setupReplay(
        'ae_memories_private_get_memory_operation/test_private_get_memory_operation.vertex.json');

    const opName =
        'projects/964831358985/locations/us-central1/reasoningEngines/2886612747586371584/memories/3858070028511346688/operations/1044963283964002304';
    const memoryOperation =
        await client.agentEnginesInternal.memories.getMemoryOperationInternal({
          operationName: opName,
        });

    client.verifyInteraction(0, fetchSpy.calls.argsFor(0));
    expect(memoryOperation.name).toBeDefined();

    client.verifyAllInteractions();
  });

  it('gets an agent engine generate memory operation', async () => {
    const fetchSpy = client.setupReplay(
        'ae_memories_private_get_generate_memories_operation/test_private_get_generate_memories_operation.vertex.json');

    const opName =
        'projects/964831358985/locations/us-central1/reasoningEngines/2886612747586371584/operations/5669315676343369728';
    const generateMemoriesOperation =
        await client.agentEnginesInternal.memories
            .getGenerateMemoriesOperationInternal({
              operationName: opName,
            });

    client.verifyInteraction(0, fetchSpy.calls.argsFor(0));
    expect(generateMemoriesOperation.name).toBeDefined();

    client.verifyAllInteractions();
  });
  it('lists agent engine memories', async () => {
    const fetchSpy = client.setupReplay(
        'ae_memories_private_list/test_private_list_memory.vertex.json');

    const aeName =
        'projects/964831358985/locations/us-central1/reasoningEngines/2886612747586371584';

    const memoryList = await client.agentEnginesInternal.memories.listInternal({
      name: aeName,
    });

    client.verifyInteraction(0, fetchSpy.calls.argsFor(0));
    expect(memoryList.memories![0].name)
        .toEqual(
            'projects/964831358985/locations/us-central1/reasoningEngines/2886612747586371584/memories/3858070028511346688');

    client.verifyAllInteractions();
  });

  it('retrieves an agent engine memory', async () => {
    const fetchSpy = client.setupReplay(
        'ae_memories_private_retrieve/test_private_retrieve.vertex.json');

    const aeName =
        'projects/964831358985/locations/us-central1/reasoningEngines/2886612747586371584';

    const retrievedMemories =
        await client.agentEnginesInternal.memories.retrieveInternal({
          name: aeName,
          scope: {'user_id': '123'},
        });

    client.verifyInteraction(0, fetchSpy.calls.argsFor(0));

    if (retrievedMemories?.retrievedMemories &&
        retrievedMemories.retrievedMemories.length > 0) {
      expect(retrievedMemories.retrievedMemories[0].memory?.name).toBeDefined();
    }

    client.verifyAllInteractions();
  });

  it('rolls back an agent engine memory', async () => {
    const fetchSpy = client.setupReplay(
        'ae_memories_private_rollback/test_private_rollback.vertex.json');

    const rollbackOperation =
        await client.agentEnginesInternal.memories.rollbackInternal({
          name:
              'projects/964831358985/locations/us-central1/reasoningEngines/2886612747586371584/memories/3858070028511346688',
          targetRevisionId: '3001207491565453312',
        });

    client.verifyInteraction(0, fetchSpy.calls.argsFor(0));
    expect(rollbackOperation.name).toBeDefined();

    client.verifyAllInteractions();
  });

  it('updates an agent engine memory', async () => {
    const fetchSpy = client.setupReplay(
        'ae_memories_private_update/test_private_update_memory.vertex.json');

    const memoryName =
        'projects/964831358985/locations/us-central1/reasoningEngines/2886612747586371584/memories/3858070028511346688';

    const updateOp = await client.agentEnginesInternal.memories.updateInternal({
      name: memoryName,
      fact: 'memory_fact_updated',
      scope: {'user_id': '123'},
    });

    client.verifyInteraction(0, fetchSpy.calls.argsFor(0));
    expect(updateOp.name).toBeDefined();

    client.verifyAllInteractions();
  });

  it('purges an agent engine memory', async () => {
    const fetchSpy = client.setupReplay(
        'ae_memories_private_purge/test_private_purge.vertex.json');

    const purgeOp = await client.agentEnginesInternal.memories.purgeInternal({
      name:
          'projects/964831358985/locations/us-central1/reasoningEngines/6086402690647064576',
      filter: 'scope.user_id=123',
    });

    client.verifyInteraction(0, fetchSpy.calls.argsFor(0));
    expect(purgeOp.name).toBeDefined();

    client.verifyAllInteractions();
  });


  it('gets an agent engine memory revision', async () => {
    const fetchSpy = client.setupReplay(
        'ae_memory_revisions_get/test_get_memory_revisions.vertex.json');

    const memoryRevisionName =
        'projects/964831358985/locations/us-central1/reasoningEngines/2886612747586371584/memories/3858070028511346688/revisions/516064922187071488'

    const revision = await client.agentEnginesInternal.memories.revisions.get({
      name: memoryRevisionName,
    });

    client.verifyInteraction(0, fetchSpy.calls.argsFor(0));
    expect(revision.name).toEqual(memoryRevisionName);

    client.verifyAllInteractions();
  });

  it('lists agent engine memory revisions', async () => {
    const fetchSpy = client.setupReplay(
        'ae_memory_revisions_private_list/test_private_list_memory_revisions.vertex.json');

    const aeName =
        'projects/964831358985/locations/us-central1/reasoningEngines/2886612747586371584/memories/3858070028511346688';

    const revisionList =
        await client.agentEnginesInternal.memories.revisions.listInternal({
          name: aeName,
        });

    client.verifyInteraction(0, fetchSpy.calls.argsFor(0));
    expect(revisionList.memoryRevisions![0].name)
        .toEqual(
            'projects/964831358985/locations/us-central1/reasoningEngines/2886612747586371584/memories/3858070028511346688/revisions/516064922187071488');

    client.verifyAllInteractions();
  });
});

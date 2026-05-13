/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {Client} from '../src/client';


const PROJECT = process.env['GCLOUD_PROJECT'];
const LOCATION = 'us-central1';

async function pollOperation(client: Client, operationName: string) {
  let isDone = false;
  let pollCount = 0;
  while (!isDone && pollCount < 120) {
    const status = await client.agentEnginesInternal.getAgentOperationInternal({
      operationName,
    });
    if (status.done) {
      return status;
    }
    pollCount++;
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  throw new Error(
      `Operation ${operationName} did not complete within the timeout.`,
  );
}

describe('agentEnginesInternal', () => {
  let client: Client;
  let agentEngineName: string|undefined;
  let createOperationName: string|undefined;
  let updateOperationName: string|undefined;

  beforeAll(async () => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 600000;
    client = new Client({
      project: PROJECT as string,
      location: LOCATION,
    });

    const createOp = await client.agentEnginesInternal.createInternal({
      config: {
        displayName: 'test-agent-engine-sample',
        description: 'Created from the Vertex JS SDK system tests',
        labels: {'test-label': 'test-value'},
      },
    });
    createOperationName = createOp.name;
    const status = await pollOperation(client, createOperationName!);
    agentEngineName = status.response?.name;
  }, 600000);

  afterAll(async () => {
    // If the test failed during the create operation, try to recover
    // the resource name from the operation to cleanup.
    if (!agentEngineName && createOperationName) {
      try {
        const status =
            await client.agentEnginesInternal.getAgentOperationInternal({
              operationName: createOperationName,
            });
        if (status.done && status.response?.name) {
          agentEngineName = status.response.name;
        }
      } catch (e) {
        console.error('Failed to recover Agent Engine name from operation:', e);
      }
    }

    if (agentEngineName) {
      try {
        await client.agentEnginesInternal.deleteInternal({
          name: agentEngineName,
        });
      } catch (e) {
        console.error('Failed to delete Agent Engine during cleanup:', e);
      }
    }
  });

  it('should create an Agent Engine', async () => {
    // The create operation is tested in the beforeAll hook, so we just
    // need to check that the resource name is defined.
    expect(agentEngineName).toBeDefined();
  });

  it('should get and update an Agent Engine', async () => {
    const agentEngine = await client.agentEnginesInternal.getInternal({
      name: agentEngineName!,
    });
    expect(agentEngine.name).toBeDefined();
    expect(agentEngine.displayName).toEqual('test-agent-engine-sample');
    expect(agentEngine.labels).toEqual({'test-label': 'test-value'});

    const updateOp = await client.agentEnginesInternal.updateInternal({
      name: agentEngineName!,
      config: {
        displayName: 'test-agent-engine-updated',
        description: 'Updated from the Vertex JS SDK system tests',
        updateMask: 'displayName,description',
      },
    });

    expect(updateOp.name).toBeDefined();
    updateOperationName = updateOp.name;

    const status = await pollOperation(client, updateOperationName!);

    if (status.response) {
      expect(status.response.displayName).toEqual('test-agent-engine-updated');
    }
  });

});

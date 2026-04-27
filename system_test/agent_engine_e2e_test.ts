/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {Client} from '../src/client';

const PROJECT = process.env['GCLOUD_PROJECT'];
const LOCATION = 'us-central1';

describe('agentEnginesInternal', () => {
  let client: Client;
  let agentEngineName: string|undefined;
  let operationName: string|undefined;

  beforeEach(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 900000;
    client = new Client({
      project: PROJECT as string,
      location: LOCATION,
    });
  });

  afterAll(async () => {
    // If the test failed during the create operation, try to recover
    // the resource name from the operation to cleanup.
    if (!agentEngineName && operationName) {
      try {
        const status =
            await client.agentEnginesInternal.getAgentOperationInternal({
              operationName,
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
    const createOp = await client.agentEnginesInternal.createInternal({
      config: {
        displayName: 'test-agent-engine-sample',
        description: 'Created from the Vertex JS SDK system tests',
        labels: {'test-label': 'test-value'},
      },
    });

    expect(createOp.name).toBeDefined();
    operationName = createOp.name;

    // Poll for operation completion to get the Agent Engine resource name.
    let isDone = false;
    let pollCount = 0;
    while (!isDone && pollCount < 120) {
      const status =
          await client.agentEnginesInternal.getAgentOperationInternal({
            operationName: operationName!,
          });
      if (status.done) {
        isDone = true;
        agentEngineName = status.response?.name;
      } else {
        pollCount++;
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }

    expect(agentEngineName).toBeDefined();
  });
});

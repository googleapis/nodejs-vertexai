/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import 'jasmine';

import {NodeAuth} from '@google/genai/vertex_internal';

import * as types from '../../src/types.js';

import {ReplayClient} from './_replay_client.js';

describe('AgentEnginesSandboxes', () => {
  let client: ReplayClient;

  beforeEach(() => {
    client = new ReplayClient({
      project: 'test-project',
      location: 'us-central1',
    });
  });

  it('creates an agent engine sandbox', async () => {
    const fetchSpy = client.setupReplay(
        'ae_sandboxes_private_create/test_private_create.vertex.json');

    const createSandboxOp =
        await client.agentEnginesInternal.sandboxes.createInternal({
          name:
              `projects/964831358985/locations/us-central1/reasoningEngines/2886612747586371584`,
          spec: {
            codeExecutionEnvironment: {
              machineConfig: types.MachineConfig.MACHINE_CONFIG_VCPU4_RAM4GIB,
            },
          },
        });
    client.verifyInteraction(0, fetchSpy.calls.argsFor(0));
    expect(createSandboxOp.name).toBeDefined();
    client.verifyAllInteractions();
  });

  it('deletes an agent engine sandbox', async () => {
    const fetchSpy = client.setupReplay(
        'ae_sandboxes_private_delete/test_private_delete.vertex.json');

    const deleteSandboxOp =
        await client.agentEnginesInternal.sandboxes.deleteInternal({
          name:
              `reasoningEngines/2886612747586371584/sandboxEnvironments/6068475153556176896`,
        });
    client.verifyInteraction(0, fetchSpy.calls.argsFor(0));
    expect(deleteSandboxOp.name).toBeDefined();
    client.verifyAllInteractions();
  });
  it('executes code in an agent engine sandbox', async () => {
    const fetchSpy = client.setupReplay(
        'ae_sandboxes_private_execute_code/test_private_execute_code.vertex.json');

    const code = `
with open("test.txt", "r") as input:
    with open("output.txt", "w") as output_txt:
        for line in input:
            output_txt.write(line)
`;
    // Need this to match recorded json file.
    const jsonWithSpace =
        JSON.stringify({code}).replace('{"code":', '{"code": ');

    const executeCodeResponse =
        await client.agentEnginesInternal.sandboxes.executeCodeInternal({
          name:
              `reasoningEngines/2886612747586371584/sandboxEnvironments/6068475153556176896`,
          inputs: [
            {
              mimeType: 'application/json',
              data: Buffer.from(jsonWithSpace).toString('base64'),
            },
            {
              mimeType: 'text/plain',
              data: Buffer.from('Hello, world!').toString('base64'),
              metadata: {
                attributes: {
                  file_name: Buffer.from('test.txt').toString('base64'),
                },
              },
            },
          ],
        });
    client.verifyInteraction(0, fetchSpy.calls.argsFor(0));
    expect(executeCodeResponse.outputs).toBeDefined();
    client.verifyAllInteractions();
  });
  it('gets an agent engine sandbox', async () => {
    const fetchSpy = client.setupReplay(
        'ae_sandboxes_private_get/test_private_get.vertex.json');

    const sandboxName =
        `projects/964831358985/locations/us-central1/reasoningEngines/2886612747586371584/sandboxEnvironments/3186171392039059456`;
    const sandbox = await client.agentEnginesInternal.sandboxes.getInternal({
      name: sandboxName,
    });
    client.verifyInteraction(0, fetchSpy.calls.argsFor(0));
    expect(sandbox.name).toEqual(sandboxName);
    client.verifyAllInteractions();
  });
  it('gets an agent engine sandbox operation', async () => {
    const fetchSpy = client.setupReplay(
        'ae_sandboxes_private_get_sandbox_operation/test_private_get_operation.vertex.json');

    const operationName =
        `projects/964831358985/locations/us-central1/operations/4799455193970245632`;
    const sandbox =
        await client.agentEnginesInternal.sandboxes.getSandboxOperationInternal(
            {
              operationName: operationName,
            });
    client.verifyInteraction(0, fetchSpy.calls.argsFor(0));
    expect(sandbox.name).toEqual(operationName);
    client.verifyAllInteractions();
  });
  it('lists sandboxes for an agent engine', async () => {
    const fetchSpy = client.setupReplay(
        'ae_sandboxes_private_list/test_private_list.vertex.json');

    const aeName = `reasoningEngines/2886612747586371584`;
    const listSandboxesResponse =
        await client.agentEnginesInternal.sandboxes.listInternal({
          name: aeName,
        });
    client.verifyInteraction(0, fetchSpy.calls.argsFor(0));
    expect(listSandboxesResponse.sandboxEnvironments).toHaveSize(2);
    client.verifyAllInteractions();
  });
});
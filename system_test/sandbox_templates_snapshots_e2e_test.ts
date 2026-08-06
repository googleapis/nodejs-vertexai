/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {Client} from '../src/client.js';
import * as types from '../src/types.js';

const PROJECT = process.env['GCLOUD_PROJECT'];
const LOCATION = 'us-central1';

// This end-to-end test provisions a real Agent Engine sandbox (a running
// container VM), which requires a project with sandbox provisioning enabled.
// That infrastructure is not available in the standard client-library CI
// project, so the test only runs when RUN_SANDBOX_E2E is set (e.g. against a
// sandbox-enabled project). CI skips it; the templates/snapshots CRUD paths are
// covered by the replay unit tests.
const sandboxE2eDescribe =
    process.env['RUN_SANDBOX_E2E'] === 'true' ? describe : xdescribe;

/** Polls an Agent Engine operation until it completes. */
async function pollAgentOperation(client: Client, operationName: string) {
  for (let pollCount = 0; pollCount < 120; pollCount++) {
    const status = await client.agentEnginesInternal.getAgentOperationInternal({
      operationName,
    });
    if (status.done) {
      return status;
    }
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  throw new Error(`Operation ${operationName} did not complete within the timeout.`);
}

/** Polls a sandbox operation until it completes. */
async function pollSandboxOperation(client: Client, operationName: string) {
  for (let pollCount = 0; pollCount < 120; pollCount++) {
    const status =
        await client.agentEnginesInternal.sandboxes.getSandboxOperationInternal({
          operationName,
        });
    if (status.done) {
      return status;
    }
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  throw new Error(`Operation ${operationName} did not complete within the timeout.`);
}

/** Polls a sandbox template operation until it completes. */
async function pollTemplateOperation(client: Client, operationName: string) {
  for (let pollCount = 0; pollCount < 120; pollCount++) {
    const status =
        await client.agentEnginesInternal.sandboxes.templates
            .getSandboxEnvironmentTemplateOperation({operationName});
    if (status.done) {
      return status;
    }
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  throw new Error(`Operation ${operationName} did not complete within the timeout.`);
}

/** Polls a sandbox snapshot operation until it completes. */
async function pollSnapshotOperation(client: Client, operationName: string) {
  for (let pollCount = 0; pollCount < 120; pollCount++) {
    const status =
        await client.agentEnginesInternal.sandboxes.snapshots
            .getSandboxSnapshotOperation({operationName});
    if (status.done) {
      return status;
    }
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  throw new Error(`Operation ${operationName} did not complete within the timeout.`);
}

sandboxE2eDescribe('agentEngineSandboxTemplatesAndSnapshots', () => {
  let client: Client;
  let agentEngineName: string|undefined;

  beforeAll(async () => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 600000;
    client = new Client({
      project: PROJECT as string,
      location: LOCATION,
    });

    // Create a temporary Agent Engine to own the sandboxes.
    const createOp = await client.agentEnginesInternal.createInternal({
      config: {
        displayName: 'sandbox-templates-snapshots-sample',
        labels: {'test-label': 'test-value'},
      },
    });
    const status = await pollAgentOperation(client, createOp.name!);
    agentEngineName = status.response?.name;
  }, 600000);

  afterAll(async () => {
    if (agentEngineName) {
      try {
        await client.agentEnginesInternal.deleteInternal({name: agentEngineName});
      } catch (e) {
        console.error('Failed to delete Agent Engine during cleanup:', e);
      }
    }
  });

  it('should create, get, list, and delete a sandbox template', async () => {
    // 1. Create a sandbox environment template.
    const createOp =
        await client.agentEnginesInternal.sandboxes.templates.createInternal({
          name: agentEngineName!,
          displayName: 'Example Sandbox Template',
          config: {
            defaultContainerEnvironment: {
              defaultContainerCategory: types.DefaultContainerCategory
                                            .DEFAULT_CONTAINER_CATEGORY_COMPUTER_USE,
            },
            egressControlConfig: {internetAccess: true},
          },
        });
    const status = await pollTemplateOperation(client, createOp.name!);
    const templateName = status.response?.name;
    expect(templateName).toBeDefined();

    // 2. Get the template.
    const template =
        await client.agentEnginesInternal.sandboxes.templates.getInternal({
          name: templateName!,
        });
    expect(template.name).toEqual(templateName);

    // 3. List templates.
    const listResponse =
        await client.agentEnginesInternal.sandboxes.templates.listInternal({
          name: agentEngineName!,
        });
    expect(listResponse.sandboxEnvironmentTemplates).toBeDefined();

    // 4. Delete the template.
    const deleteOp =
        await client.agentEnginesInternal.sandboxes.templates.deleteInternal({
          name: templateName!,
        });
    expect(deleteOp.name).toBeDefined();
  });

  it('should create, get, list, and delete a sandbox snapshot', async () => {
    // Snapshots capture the state of a running sandbox, and only
    // template-based (e.g. computer-use) sandboxes are snapshottable. Create a
    // computer-use template, then a sandbox from it, before snapshotting.
    const templateCreateOp =
        await client.agentEnginesInternal.sandboxes.templates.createInternal({
          name: agentEngineName!,
          displayName: 'Snapshot Source Template',
          config: {
            defaultContainerEnvironment: {
              defaultContainerCategory: types.DefaultContainerCategory
                                            .DEFAULT_CONTAINER_CATEGORY_COMPUTER_USE,
            },
            egressControlConfig: {internetAccess: true},
          },
        });
    const templateStatus =
        await pollTemplateOperation(client, templateCreateOp.name!);
    const templateName = templateStatus.response?.name;
    expect(templateName).toBeDefined();

    try {
      // Create a sandbox from the template so it has a snapshottable state.
      const sandboxCreateOp =
          await client.agentEnginesInternal.sandboxes.createInternal({
            name: agentEngineName!,
            config: {sandboxEnvironmentTemplate: templateName!},
          });
      const sandboxStatus =
          await pollSandboxOperation(client, sandboxCreateOp.name!);
      const sandboxName = sandboxStatus.response?.name;
      expect(sandboxName).toBeDefined();

      try {
        // 1. Create a snapshot of the sandbox.
        const createOp =
            await client.agentEnginesInternal.sandboxes.snapshots.createInternal(
                {
                  sourceSandboxEnvironmentName: sandboxName!,
                  config: {
                    displayName: 'Example Sandbox Snapshot',
                    ttl: '3600s',
                  },
                });
        const status = await pollSnapshotOperation(client, createOp.name!);
        const snapshotName = status.response?.name;
        expect(snapshotName).toBeDefined();

        // 2. Get the snapshot.
        const snapshot =
            await client.agentEnginesInternal.sandboxes.snapshots.getInternal({
              name: snapshotName!,
            });
        expect(snapshot.name).toEqual(snapshotName);

        // 3. List snapshots.
        const listResponse =
            await client.agentEnginesInternal.sandboxes.snapshots.listInternal({
              name: agentEngineName!,
            });
        expect(listResponse.sandboxEnvironmentSnapshots).toBeDefined();

        // 4. Delete the snapshot.
        const deleteOp =
            await client.agentEnginesInternal.sandboxes.snapshots.deleteInternal(
                {
                  name: snapshotName!,
                });
        expect(deleteOp.name).toBeDefined();
      } finally {
        // Clean up the source sandbox.
        await client.agentEnginesInternal.sandboxes.deleteInternal({
          name: sandboxName!,
        });
      }
    } finally {
      // Clean up the source template.
      await client.agentEnginesInternal.sandboxes.templates.deleteInternal({
        name: templateName!,
      });
    }
  });
});

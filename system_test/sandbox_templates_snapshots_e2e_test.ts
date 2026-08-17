/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {Client} from '../src/client.js';
import * as types from '../src/types.js';

const PROJECT = process.env['GCLOUD_PROJECT'];
const LOCATION = 'us-central1';

// This end-to-end test provisions a real sandbox environment (a running
// container VM), which requires a project with sandbox provisioning enabled.
// That infrastructure is not available in the standard client-library CI
// project, so the test only runs when RUN_SANDBOX_E2E is set (e.g. against a
// sandbox-enabled project). CI skips it; the templates/snapshots CRUD paths are
// covered by the replay unit tests.
const sandboxE2eDescribe =
    process.env['RUN_SANDBOX_E2E'] === 'true' ? describe : xdescribe;

/** Polls a sandbox environment operation until it completes. */
async function pollSandboxOperation(client: Client, operationName: string) {
  for (let pollCount = 0; pollCount < 120; pollCount++) {
    const status = await client.sandboxes.environments.getSandboxOperation(
        {operationName});
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
    const status = await client.sandboxes.templates
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
    const status = await client.sandboxes.snapshots.getSandboxSnapshotOperation(
        {operationName});
    if (status.done) {
      return status;
    }
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  throw new Error(`Operation ${operationName} did not complete within the timeout.`);
}

/** Returns the config for a computer-use sandbox template with internet access. */
function computerUseTemplateConfig(): types.CreateSandboxEnvironmentTemplateConfig {
  return {
    defaultContainerEnvironment: {
      defaultContainerCategory:
          types.DefaultContainerCategory.DEFAULT_CONTAINER_CATEGORY_COMPUTER_USE,
    },
    egressControlConfig: {internetAccess: true},
  };
}

// The sandbox API is used directly from the top-level `client.sandboxes`
// accessor. The parent agent engine name is omitted, so the SDK lazily reuses a
// shared default agent engine for this project + location.
sandboxE2eDescribe('sandboxTemplatesAndSnapshots', () => {
  let client: Client;

  beforeAll(async () => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 600000;
    client = new Client({
      project: PROJECT as string,
      location: LOCATION,
    });
  }, 600000);

  it('should create, get, list, and delete a sandbox template', async () => {
    // 1. Create a sandbox environment template (no agent engine name needed).
    const createOp = await client.sandboxes.templates.create({
      displayName: 'Example Sandbox Template',
      config: computerUseTemplateConfig(),
    });
    const status = await pollTemplateOperation(client, createOp.name!);
    const templateName = status.response?.name;
    expect(templateName).toBeDefined();

    // 2. Get the template.
    const template =
        await client.sandboxes.templates.get({name: templateName!});
    expect(template.name).toEqual(templateName);

    // 3. List templates.
    const listResponse = await client.sandboxes.templates.list();
    expect(listResponse.sandboxEnvironmentTemplates).toBeDefined();

    // 4. Delete the template.
    const deleteOp =
        await client.sandboxes.templates.delete({name: templateName!});
    expect(deleteOp.name).toBeDefined();
  });

  it('should create, snapshot, restore, and delete a template-based sandbox', async () => {
    // Snapshots capture the state of a running sandbox, and only template-based
    // (e.g. computer-use) sandboxes are snapshottable. Create a computer-use
    // template, then a sandbox from it, before snapshotting.
    const templateCreateOp = await client.sandboxes.templates.create({
      displayName: 'Snapshot Source Template',
      config: computerUseTemplateConfig(),
    });
    const templateStatus =
        await pollTemplateOperation(client, templateCreateOp.name!);
    const templateName = templateStatus.response?.name;
    expect(templateName).toBeDefined();

    let sandboxName: string|undefined;
    let restoredSandboxName: string|undefined;
    try {
      // Create a sandbox environment from the template.
      const sandboxCreateOp = await client.sandboxes.environments.create({
        config: {
          displayName: 'Snapshot Source Sandbox',
          sandboxEnvironmentTemplate: templateName!,
        },
      });
      const sandboxStatus =
          await pollSandboxOperation(client, sandboxCreateOp.name!);
      sandboxName = sandboxStatus.response?.name;
      expect(sandboxName).toBeDefined();

      // 1. Create a snapshot of the sandbox.
      const createOp = await client.sandboxes.snapshots.create({
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
          await client.sandboxes.snapshots.get({name: snapshotName!});
      expect(snapshot.name).toEqual(snapshotName);

      // 3. List snapshots.
      const listResponse = await client.sandboxes.snapshots.list();
      expect(listResponse.sandboxEnvironmentSnapshots).toBeDefined();

      // 4. Restore a new sandbox environment from the snapshot.
      const restoreOp = await client.sandboxes.environments.create({
        config: {
          displayName: 'Restored Sandbox',
          sandboxEnvironmentSnapshot: snapshotName!,
        },
      });
      const restoreStatus = await pollSandboxOperation(client, restoreOp.name!);
      restoredSandboxName = restoreStatus.response?.name;
      expect(restoredSandboxName).toBeDefined();

      // 5. Delete the snapshot.
      const deleteOp =
          await client.sandboxes.snapshots.delete({name: snapshotName!});
      expect(deleteOp.name).toBeDefined();
    } finally {
      // Clean up the restored sandbox and the source sandbox.
      if (restoredSandboxName) {
        await client.sandboxes.environments.delete({name: restoredSandboxName});
      }
      if (sandboxName) {
        await client.sandboxes.environments.delete({name: sandboxName});
      }
      // Clean up the source template.
      await client.sandboxes.templates.delete({name: templateName!});
    }
  });
});

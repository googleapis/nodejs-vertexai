/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import 'jasmine';

import * as types from '../../src/types.js';

import {ReplayClient} from './_replay_client.js';

describe('AgentEnginesSandboxTemplates', () => {
  let client: ReplayClient;

  beforeEach(() => {
    client = new ReplayClient({
      project: 'test-project',
      location: 'us-central1',
    });
  });

  it('creates a sandbox environment template', async () => {
    const fetchSpy = client.setupReplay(
        'ae_sandbox_templates_default_create/test_sandbox_templates_default_create.vertex.json');

    const createOp =
        await client.agentEnginesInternal.sandboxes.templates.createInternal({
          name:
              `projects/802583348448/locations/us-central1/reasoningEngines/6130241318758121472`,
          displayName: 'Test Sandbox Template 1',
          config: {
            defaultContainerEnvironment: {
              defaultContainerCategory: types.DefaultContainerCategory
                                            .DEFAULT_CONTAINER_CATEGORY_COMPUTER_USE,
            },
            egressControlConfig: {
              internetAccess: true,
            },
          },
        });
    client.verifyInteraction(0, fetchSpy.calls.argsFor(0));
    expect(createOp.name).toBeDefined();
    client.verifyAllInteractions();
  });

  it('gets a sandbox environment template', async () => {
    const fetchSpy = client.setupReplay(
        'ae_sandbox_templates_get/test_sandbox_templates_get.vertex.json');

    const templateName =
        `projects/254005681254/locations/us-central1/reasoningEngines/208148546254274560/sandboxEnvironmentTemplates/4632233691727265792`;
    const template =
        await client.agentEnginesInternal.sandboxes.templates.getInternal({
          name: templateName,
        });
    client.verifyInteraction(0, fetchSpy.calls.argsFor(0));
    expect(template.name).toEqual(templateName);
    client.verifyAllInteractions();
  });

  it('lists sandbox environment templates', async () => {
    const fetchSpy = client.setupReplay(
        'ae_sandbox_templates_list/test_sandbox_templates_list.vertex.json');

    const listResponse =
        await client.agentEnginesInternal.sandboxes.templates.listInternal({
          name:
              `projects/254005681254/locations/us-central1/reasoningEngines/208148546254274560`,
        });
    client.verifyInteraction(0, fetchSpy.calls.argsFor(0));
    expect(listResponse.sandboxEnvironmentTemplates).toBeDefined();
    client.verifyAllInteractions();
  });

  it('deletes a sandbox environment template', async () => {
    const fetchSpy = client.setupReplay(
        'ae_sandbox_templates_delete/test_sandbox_templates_delete.vertex.json');

    const deleteOp =
        await client.agentEnginesInternal.sandboxes.templates.deleteInternal({
          name:
              `projects/254005681254/locations/us-central1/reasoningEngines/208148546254274560/sandboxEnvironmentTemplates/4632233691727265792`,
        });
    client.verifyInteraction(0, fetchSpy.calls.argsFor(0));
    expect(deleteOp.name).toBeDefined();
    client.verifyAllInteractions();
  });

  it('gets a sandbox environment template operation', async () => {
    const fetchSpy = client.setupReplay(
        'ae_sandbox_templates_get_sandbox_template_operation/test_get_sandbox_template_operation.vertex.json');

    const operationName =
        `projects/254005681254/locations/us-central1/operations/7252775414349692928`;
    const op = await client.agentEnginesInternal.sandboxes.templates
                   .getSandboxEnvironmentTemplateOperation({
                     operationName: operationName,
                   });
    client.verifyInteraction(0, fetchSpy.calls.argsFor(0));
    expect(op.name).toEqual(operationName);
    client.verifyAllInteractions();
  });
});

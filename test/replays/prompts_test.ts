/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import 'jasmine';
import {ReplayClient} from './_replay_client.js';

const TEST_PROMPT = {
  promptData: {
    contents: [
      {
        role: 'user',
        parts: [{text: 'Hello, {name}! How are you?'}],
      },
    ],
    model: 'gemini-2.0-flash-001',
    variables: [
      {name: {text: 'Alice'}},
      {name: {text: 'Bob'}}
    ],
    generationConfig: {
      temperature: 0.1,
      candidateCount: 1,
      topP: 0.95,
      topK: 40,
      responseModalities: ['TEXT'],
      responseSchema: {
        type: 'OBJECT',
        properties: {response: {type: 'STRING'}},
      },
    },
    safetySettings: [
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        method: 'SEVERITY',
      },
    ],
    systemInstruction: {
      parts: [{text: 'Please answer in a short sentence.'}],
    },
    tools: [
      {
        googleSearchRetrieval: {
          dynamicRetrievalConfig: {
            mode: 'MODE_DYNAMIC',
          },
        },
      },
    ],
    toolConfig: {},
  },
};

describe('Prompts', () => {
  let client: ReplayClient;

  beforeEach(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 120000;
    client = new ReplayClient({
      project: 'vertex-sdk-dev',
      location: 'us-central1',
    });
  });

  it('creates a prompt', async () => {
    const fetchSpy = client.setupReplay(
        'create_prompt/test_create.vertex.json');

    const prompt = await client.prompts.create({
      prompt: TEST_PROMPT,
      config: {
        promptDisplayName: 'my_prompt',
        versionDisplayName: 'my_version',
      },
    });

    client.verifyInteraction(0, fetchSpy.calls.argsFor(0));
    expect(prompt).toBeDefined();
    client.verifyAllInteractions();
  });

  it('gets a prompt', async () => {
    const fetchSpy = client.setupReplay(
        'get_prompt_resource/test_get_prompt.vertex.json');

    const prompt = await client.prompts.get({
      promptId: '6550997480673116160',
    });

    client.verifyInteraction(0, fetchSpy.calls.argsFor(0));
    expect(prompt).toBeDefined();
    client.verifyAllInteractions();
  });

  it('updates a prompt', async () => {
    const fetchSpy = client.setupReplay(
        'update_prompt/test_update_creates_new_version.vertex.json');

    const prompt = await client.prompts.update({
      promptId: '8005484238453342208',
      prompt: {
        promptData: {
          ...TEST_PROMPT.promptData,
          contents: [
            {
              role: 'user',
              parts: [{text: 'Is this Alice?'}],
            },
          ],
        },
      },
      config: {
        versionDisplayName: 'my_version',
      },
    });

    client.verifyInteraction(0, fetchSpy.calls.argsFor(0));
    expect(prompt).toBeDefined();
    client.verifyAllInteractions();
  });

  it('lists prompts', async () => {
    const fetchSpy = client.setupReplay(
        'list_prompts/test_list_returns_prompts_async.vertex.json');

    const prompts = await client.prompts.list();

    client.verifyInteraction(0, fetchSpy.calls.argsFor(0));
    expect(prompts).toBeDefined();
  });

  it('lists prompt versions', async () => {
    const fetchSpy = client.setupReplay(
        'list_prompts/test_list_versions_async.vertex.json');

    const versions = await client.prompts.listVersions({
      promptId: '3331020504126455808',
    });

    client.verifyInteraction(0, fetchSpy.calls.argsFor(0));
    expect(versions).toBeDefined();
    expect(versions.length).toBeGreaterThan(0);
    client.verifyAllInteractions();
  });

  it('deletes a prompt', async () => {
    const fetchSpy = client.setupReplay(
        'delete_prompt/test_delete_dataset_async.vertex.json');

    // Spy on _wait_for_project_operation to avoid failure due to missing operation name in replay
    spyOn(client.prompts as any, '_wait_for_project_operation').and.resolveTo();

    // Consume the 5 list calls expected by the replay file
    for (let i = 0; i < 5; i++) {
      await client.prompts.list();
    }

    await client.prompts.delete({
      promptId: '5470670131778551808',
    });

    client.verifyInteraction(5, fetchSpy.calls.argsFor(5));
  });

  it('restores a prompt version', async () => {
    const fetchSpy = client.setupReplay(
        'restore_prompt_version/test_restore_version_async.vertex.json');

    // Spy on _wait_for_project_operation to avoid timeout in replay mode
    spyOn(client.prompts as any, '_wait_for_project_operation').and.resolveTo();

    const promptV1 = await client.prompts.createVersion({
        prompt: TEST_PROMPT,
        config: {
            promptDisplayName: 'my_prompt',
            versionDisplayName: 'my_prompt_v1',
        }
    });

    const promptV2 = await client.prompts.update({
        promptId: promptV1._dataset.name.split('/').pop(),
        prompt: {
            promptData: {
                contents: [{role: 'user', parts: [{text: 'Is this Alice?'}]}],
                model: 'gemini-2.0-flash-001',
            }
        },
        config: {
            promptDisplayName: 'my_prompt',
            versionDisplayName: 'my_prompt_v2',
        }
    });

    const myPromptV1Id = promptV1._dataset_version.name.split('/').pop();

    const restoredPrompt = await client.prompts.restoreVersion({
      promptId: promptV1._dataset.name.split('/').pop(),
      versionId: myPromptV1Id,
    });

    client.verifyInteraction(0, fetchSpy.calls.argsFor(0));
    expect(restoredPrompt).toBeDefined();
  });
});

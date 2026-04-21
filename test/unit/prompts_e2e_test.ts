/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import 'jasmine';
import {Client} from '../../src/client.js';

const PROJECT = process.env['GCLOUD_PROJECT'] || 'vertex-sdk-dev';
const LOCATION = 'us-central1';

xdescribe('Prompts E2E', () => {
  let client: Client;
  let promptId: string | undefined;

  beforeEach(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 300000;
    client = new Client({
      project: PROJECT as string,
      location: LOCATION,
    });
  });

  afterAll(async () => {
    if (promptId) {
      try {
        await client.prompts.delete({
          promptId: promptId,
        });
      } catch (e) {
        // Ignore failure during cleanup to avoid failing the test run
      }
    }
  });

  it('should create, get, update, and list prompts', async () => {
    const prompt = await client.prompts.createVersion({
      prompt: {
        promptData: {
          contents: [
            {
              role: 'user',
              parts: [{text: 'Hello, world!'}],
            },
          ],
          model: 'gemini-2.0-flash-001',
        },
      },
      config: {
        promptDisplayName: `system_test_prompt_${Date.now()}`,
      },
    });

    expect(prompt).toBeDefined();
    expect(prompt._dataset).toBeDefined();

    promptId = prompt._dataset?.name?.split('/').pop();
    expect(promptId).toBeDefined();

    if (promptId) {
      const retrievedPrompt = await client.prompts.get({
        promptId: promptId,
      });
      expect(retrievedPrompt).toBeDefined();

      const updatedPrompt = await client.prompts.update({
        promptId: promptId,
        prompt: {
          promptData: {
            contents: [
              {
                role: 'user',
                parts: [{text: 'Hello, world! (updated)'}],
              },
            ],
            model: 'gemini-2.0-flash-001',
          },
        },
        config: {
          versionDisplayName: `updated_version_${Date.now()}`,
        },
      });
      expect(updatedPrompt).toBeDefined();

      const prompts = await client.prompts.list();
      expect(prompts).toBeDefined();
      expect(prompts.length).toBeGreaterThan(0);
    }
  });
});

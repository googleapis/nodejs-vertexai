/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import 'jasmine';
import {ReplayClient} from './_replay_client.js';
describe('Skills', () => {
  let client: ReplayClient;
  beforeEach(() => {
    client = new ReplayClient({
      project: 'test-project',
      location: 'us-central1',
    });
  });
  it('gets a skill resource', async () => {
    const fetchSpy = client.setupReplay(
        'skills_get/test_get_skill.vertex.json');
    const skill = await client.skills.get({
      name: 'projects/demo-project/locations/us-central1/skills/7184367305562783744',
    });
    client.verifyInteraction(0, fetchSpy.calls.argsFor(0));
    expect(skill.name).toBeDefined();
    client.verifyAllInteractions();
  });
});

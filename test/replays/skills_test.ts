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

  it('creates a skill resource with polling', async () => {
    const fetchSpy = client.setupReplay(
        'skills_create/test_create_skill.vertex.json');
    const skill = await client.skills.create({
      skillId: 'my-replay-skill-v2',
      displayName: 'My Replay Skill',
      description: 'My Replay Skill Description',
      config: {
        zippedFilesystem: 'UEsDBBQAAAAIAAAAIQCqBr3MMAAAADgAAAAIAAAAU0tJTEwubWRTVvCtVAhKLchJrFQIzs7MyeEKycgsVgCiRIWS1OIShWKQoEJafpFCEUQVSLRYDwBQSwECFAMUAAAACAAAACEAqga9zDAAAAA4AAAACAAAAAAAAAAAAAAApAEAAAAAU0tJTEwubWRQSwUGAAAAAAEAAQA2AAAAVgAAAAAA',
      }
    });
    client.verifyInteraction(0, fetchSpy.calls.argsFor(0));
    expect(skill.name).toBeDefined();
    client.verifyAllInteractions();
  });

  it('creates a skill resource using prezipped bytes with polling', async () => {
    const fetchSpy = client.setupReplay(
        'skills_create/test_create_skill_with_prezipped_bytes.vertex.json');
    const skill = await client.skills.create({
      skillId: 'my-zipped-replay-skill-v2',
      displayName: 'My Zipped Replay Skill',
      description: 'My Zipped Replay Skill Description',
      config: {
        zippedFilesystem: 'UEsDBBQAAAAAAAAAIQDhyOqPKAAAACgAAAAIAAAAU0tJTEwubWQjIE15IFppcHBlZCBSZXBsYXkgU2tpbGwKVGhpcyBpcyBhIHRlc3QuUEsBAhQDFAAAAAAAAAAhAOHI6o8oAAAAKAAAAAgAAAAAAAAAAAAAAIABAAAAAFNLSUxMLm1kUEsFBgAAAAABAAEANgAAAE4AAAAAAA==',
      }
    });
    client.verifyInteraction(0, fetchSpy.calls.argsFor(0));
    expect(skill.name).toBeDefined();
    client.verifyAllInteractions();
  });
});

/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import 'jasmine';
import {ReplayClient} from './_replay_client.js';
import * as types from '../../src/types.js';
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

  it('updates a skill resource with polling', async () => {
    const fetchSpy = client.setupReplay(
        'skills_update/test_update_skill.vertex.json');
    await client.skills.create({
      skillId: 'my-skill-to-update-1',
      displayName: 'Original Skill',
      description: 'Original Description',
      config: {
        zippedFilesystem: 'UEsDBBQAAAAIAAAAIQA7t4igHwAAAB0AAAAIAAAAU0tJTEwubWRTVghJLS5RCM7OzMnh8szLLMlMzFFIzs8rSc0r0QMAUEsBAhQDFAAAAAgAAAAhADu3iKAfAAAAHQAAAAgAAAAAAAAAAAAAAKQBAAAAAFNLSUxMLm1kUEsFBgAAAAABAAEANgAAAEUAAAAAAA==',
      }
    });

    const skill = (await client.skills.update({
      name: 'projects/682537715590/locations/us-central1/skills/my-skill-to-update-1',
      config: {
        displayName: 'My Updated Replay Skill',
        description: 'My Updated Replay Skill Description',
      }
    })) as types.Skill;

    expect(skill.displayName).toBe('My Updated Replay Skill');
    expect(skill.description).toBe('My Updated Replay Skill Description');
    client.verifyInteraction(0, fetchSpy.calls.argsFor(0));
    client.verifyAllInteractions();
  });

  it('updates a skill resource using prezipped bytes with polling', async () => {
    const fetchSpy = client.setupReplay(
        'skills_update/test_update_skill_with_zipped_bytes.vertex.json');
    await client.skills.create({
      skillId: 'my-skill-to-update-2',
      displayName: 'Original Skill',
      description: 'Original Description',
      config: {
        zippedFilesystem: 'UEsDBBQAAAAIAAAAIQA7t4igHwAAAB0AAAAIAAAAU0tJTEwubWRTVghJLS5RCM7OzMnh8szLLMlMzFFIzs8rSc0r0QMAUEsBAhQDFAAAAAgAAAAhADu3iKAfAAAAHQAAAAgAAAAAAAAAAAAAAKQBAAAAAFNLSUxMLm1kUEsFBgAAAAABAAEANgAAAEUAAAAAAA==',
      }
    });

    const skill = (await client.skills.update({
      name: 'projects/682537715590/locations/us-central1/skills/my-skill-to-update-2',
      config: {
        zippedFilesystem: 'UEsDBBQAAAAAAAAAIQD9a9GnMQAAADEAAAAIAAAAU0tJTEwubWQjIE15IFVwZGF0ZWQgWmlwcGVkIFJlcGxheSBTa2lsbApUaGlzIGlzIHVwZGF0ZWQuUEsBAhQDFAAAAAAAAAAhAP1r0acxAAAAMQAAAAgAAAAAAAAAAAAAAIABAAAAAFNLSUxMLm1kUEsFBgAAAAABAAEANgAAAFcAAAAAAA==',
      }
    })) as types.Skill;

    expect(skill.zippedFilesystem).toBe('UEsDBBQAAAAAAAAAIQD9a9GnMQAAADEAAAAIAAAAU0tJTEwubWQjIE15IFVwZGF0ZWQgWmlwcGVkIFJlcGxheSBTa2lsbApUaGlzIGlzIHVwZGF0ZWQuUEsBAhQDFAAAAAAAAAAhAP1r0acxAAAAMQAAAAgAAAAAAAAAAAAAAIABAAAAAFNLSUxMLm1kUEsFBgAAAAABAAEANgAAAFcAAAAAAA==');
    client.verifyInteraction(0, fetchSpy.calls.argsFor(0));
    client.verifyAllInteractions();
  });

  it('lists skill resources', async () => {
    const fetchSpy = client.setupReplay(
        'skills_list/test_list_skills.vertex.json');
    const pager = await client.skills.list();
    expect(pager.page.length).toBeGreaterThan(0);
    expect(pager.page[0].name).toBeDefined();

    expect(pager.hasNextPage()).toBeTrue();
    const nextPage = await pager.nextPage();
    expect(nextPage.length).toBeGreaterThan(0);

    client.verifyInteraction(0, fetchSpy.calls.argsFor(0));
    client.verifyAllInteractions();
  });

  it('deletes a skill resource with polling', async () => {
    const fetchSpy = client.setupReplay(
        'skills_delete/test_delete_skill.vertex.json');
    await client.skills.create({
      skillId: 'my-skill-to-delete',
      displayName: 'To Be Deleted Skill',
      description: 'Skill to be deleted',
      config: {
        zippedFilesystem: 'UEsDBBQAAAAIAAAAIQCuaWE/HQAAABsAAAAIAAAAU0tJTEwubWRTVghJLS5RCM7OzMnhCslXSEpVSEnNSS1JTdEDAFBLAQIUAxQAAAAIAAAAIQCuaWE/HQAAABsAAAAIAAAAAAAAAAAAAACkAQAAAABTS0lMTC5tZFBLBQYAAAAAAQABADYAAABDAAAAAAA=',
      }
    });

    const result = await client.skills.delete({
      name: 'projects/682537715590/locations/us-central1/skills/my-skill-to-delete',
    });

    expect(result).toBeNull();

    await expectAsync(client.skills.get({
      name: 'projects/682537715590/locations/us-central1/skills/my-skill-to-delete',
    })).toBeRejected();

    client.verifyInteraction(0, fetchSpy.calls.argsFor(0));
    client.verifyAllInteractions();
  });
});

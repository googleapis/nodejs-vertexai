/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Creates a replay session that reads from recorded replay files for GenAI
 * module tests.
 *
 * Usage:
 *   const replay = new ReplaySession('replay_test_filename.vertex.json');
 *   replay.start();
 *   // ... execute SDK code ...
 *   replay.verify();
 *.
 */
export class ReplaySession {
  private replayData: any;
  private interactionIndex = 0;
  private fetchSpy?: jasmine.Spy;

  constructor(replayFileName: string) {
    let replaysDir = process.env['GOOGLE_GENAI_REPLAYS_DIRECTORY'];

    if (!replaysDir) {
      throw new Error(
          'Replays directory not found. Set GOOGLE_GENAI_REPLAYS_DIRECTORY env var.');
    }

    const replayFilePath = path.join(replaysDir, replayFileName);
    const rawData = fs.readFileSync(replayFilePath, 'utf8');
    this.replayData = JSON.parse(rawData);
  }

  start() {
    this.fetchSpy =
        spyOn(global, 'fetch')
            .and.callFake(async (url: any, init?: RequestInit) => {
              if (this.interactionIndex >=
                  this.replayData.interactions.length) {
                throw new Error(`Unexpected fetch call to ${
                    url.toString()}, no more interactions in replay.`);
              }

              const interaction =
                  this.replayData.interactions[this.interactionIndex++];
              const responseStatus = interaction.response.status_code;
              const bodySegments = interaction.response.body_segments || [];

              const responseBody = bodySegments.length === 1 ?
                  JSON.stringify(bodySegments[0]) :
                  '';

              return new Response(responseBody, {
                status: responseStatus,
                headers: new Headers(
                    interaction.response.headers as Record<string, string>),
              });
            });
  }

  verify() {
    if (this.interactionIndex < this.replayData.interactions.length) {
      throw new Error(`Expected ${
          this.replayData.interactions.length} interactions but only ${
          this.interactionIndex} were executed.`);
    }
  }
}

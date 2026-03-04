
/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {ApiClient} from 'google3/third_party/javascript/google_genai/src/_api_client.js';
// Use g3_node for Auth and Uploader
import {NodeAuth} from 'google3/third_party/javascript/google_genai/src/g3_node/_g3_node_auth.js';
import {NodeUploader} from 'google3/third_party/javascript/google_genai/src/g3_node/_g3_node_uploader.js';
// Use src/node for Downloader (it is NOT in g3_node)
import {NodeDownloader} from 'google3/third_party/javascript/google_genai/src/node/_node_downloader.js';

import {AgentEngines} from './agentengines';
import {Sessions} from './sessions';

export class Client {
  private readonly apiClient: ApiClient;
  public readonly agentEnginesInternal: AgentEngines;

  constructor(
      options: {project?: string; location?: string; apiEndpoint?: string;}) {
    const auth = new NodeAuth({
      googleAuthOptions:
          {scopes: ['https://www.googleapis.com/auth/cloud-platform']}
    });

    const uploader = new NodeUploader();
    const downloader = new NodeDownloader();

    this.apiClient = new ApiClient({
      auth,
      uploader,
      downloader,
      project: options.project,
      location: options.location,
      vertexai: true,
      httpOptions: options.apiEndpoint ? {baseUrl: options.apiEndpoint} :
                                         undefined,
      userAgentExtra:
          'vertexai-node-extension'  // TODO: add correct user agent header
    });


    this.agentEnginesInternal = new AgentEngines(this.apiClient);
  }
}


/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {ApiClient, NodeAuth, NodeDownloader, NodeUploader} from '@google/genai/vertex_internal';

import {AgentEngines} from './agentengines';
import {Sessions} from './sessions';

export const SDK_VERSION = '1.10.3';  // x-release-please-version

let agentEnginesInternalWarned = false;

export class Client {
  protected readonly apiClient: ApiClient;
  public readonly _agentEnginesInternal: AgentEngines;

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
      userAgentExtra: `vertex-genai-modules/${SDK_VERSION}`
    });


    this._agentEnginesInternal = new AgentEngines(this.apiClient);
  }

  /**
   * Getter for agentEnginesInternal that logs a warning on first use.
   */
  public get agentEnginesInternal(): AgentEngines {
    if (!agentEnginesInternalWarned) {
      console.warn(
          'The agentEnginesInternal implementation is experimental, and may change in future versions.');
      agentEnginesInternalWarned = true;
    }
    return this._agentEnginesInternal;
  }
}

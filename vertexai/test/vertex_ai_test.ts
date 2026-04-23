/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {VertexAI} from '../src/vertex_ai';
import {GenerativeModelPreview, GenerativeModel} from '../src/models';
import {GoogleAuthError, IllegalArgumentError} from '../src/types/errors';

const PROJECT = 'test_project';
const LOCATION = 'test_location';

class VertexAIForTest extends VertexAI {
  public override getProject(): string {
    return super.getProject();
  }
  public override getLocation(): string {
    return super.getLocation();
  }
}

describe('VertexAI', () => {
  let vertexai: VertexAI;

  beforeEach(() => {
    cleanupEnvironmentVariable();
    vertexai = new VertexAI({
      project: PROJECT,
      location: LOCATION,
    });
  });

  it('no location given, should instantiate VertexAI and VertexAIPreview', () => {
    const vertexaiNoLocation = new VertexAI({
      project: PROJECT,
    }) as VertexAIForTest;
    const generativeModel = vertexaiNoLocation.getGenerativeModel({
      model: 'gemini-pro',
    });
    const generativeModelPreview =
      vertexaiNoLocation.preview.getGenerativeModel({
        model: 'gemini-pro',
      });
    expect(vertexaiNoLocation.getLocation()).toEqual('us-central1');
    expect(vertexaiNoLocation).toBeInstanceOf(VertexAI);
    expect(generativeModel).toBeInstanceOf(GenerativeModel);
    expect(generativeModelPreview).toBeInstanceOf(GenerativeModelPreview);
  });

  it('location in run time env GOOGLE_CLOUD_REGION, should instantiate VertexAI and VertexAIPreview', () => {
    process.env['GOOGLE_CLOUD_REGION'] = 'us-central2';
    process.env['CLOUD_ML_REGION'] = 'us-central3';
    const vertexaiNoLocation = new VertexAI({
      project: PROJECT,
    }) as VertexAIForTest;
    const generativeModel = vertexaiNoLocation.getGenerativeModel({
      model: 'gemini-pro',
    });
    const generativeModelPreview =
      vertexaiNoLocation.preview.getGenerativeModel({
        model: 'gemini-pro',
      });
    expect(vertexaiNoLocation.getLocation()).toEqual('us-central2');
    expect(vertexaiNoLocation).toBeInstanceOf(VertexAI);
    expect(generativeModel).toBeInstanceOf(GenerativeModel);
    expect(generativeModelPreview).toBeInstanceOf(GenerativeModelPreview);
  });

  it('location in run time env CLOUD_ML_REGION, should instantiate VertexAI and VertexAIPreview', () => {
    process.env['CLOUD_ML_REGION'] = 'us-central3';
    const vertexaiNoLocation = new VertexAI({
      project: PROJECT,
    }) as VertexAIForTest;
    const generativeModel = vertexaiNoLocation.getGenerativeModel({
      model: 'gemini-pro',
    });
    const generativeModelPreview =
      vertexaiNoLocation.preview.getGenerativeModel({
        model: 'gemini-pro',
      });
    expect(vertexaiNoLocation.getLocation()).toEqual('us-central3');
    expect(vertexaiNoLocation).toBeInstanceOf(VertexAI);
    expect(generativeModel).toBeInstanceOf(GenerativeModel);
    expect(generativeModelPreview).toBeInstanceOf(GenerativeModelPreview);
  });

  it('location in run time env GOOGLE_CLOUD_REGION, project in GOOGLE_CLOUD_PROJECT, should instantiate VertexAI and VertexAIPreview', () => {
    process.env['GOOGLE_CLOUD_REGION'] = 'us-central2';
    process.env['CLOUD_ML_REGION'] = 'us-central3';
    process.env['GOOGLE_CLOUD_PROJECT'] = 'my-project';
    const vertexaiNoArgs = new VertexAI({}) as VertexAIForTest;
    const generativeModel = vertexaiNoArgs.getGenerativeModel({
      model: 'gemini-pro',
    });
    const generativeModelPreview = vertexaiNoArgs.preview.getGenerativeModel({
      model: 'gemini-pro',
    });
    expect(vertexaiNoArgs.getLocation()).toEqual('us-central2');
    expect(vertexaiNoArgs.getProject()).toEqual('my-project');
    expect(vertexaiNoArgs).toBeInstanceOf(VertexAI);
    expect(generativeModel).toBeInstanceOf(GenerativeModel);
    expect(generativeModelPreview).toBeInstanceOf(GenerativeModelPreview);
  });

  it('cannot resolve project, should throw', () => {
    const expectedProjectNotFoundErrorMessage =
      'Unable to infer your project.' +
      'Please provide a project Id by one of the following:' +
      '\n- Passing a constructor argument by using new VertexAI({project: my-project})' +
      '\n- Setting project using `gcloud config set project my-project`';
    expect(() => {
      new VertexAI({});
    }).toThrow(new IllegalArgumentError(expectedProjectNotFoundErrorMessage));
  });

  it('given undefined google auth options, should be instantiated', () => {
    expect(vertexai).toBeInstanceOf(VertexAI);
  });

  it('given specified google auth options, should be instantiated', () => {
    const googleAuthOptions = {
      scopes: 'https://www.googleapis.com/auth/cloud-platform',
    };
    const vetexai1 = new VertexAI({
      project: PROJECT,
      location: LOCATION,
      googleAuthOptions: googleAuthOptions,
    });
    expect(vetexai1).toBeInstanceOf(VertexAI);
  });

  it('given inconsistent project ID, should throw error', () => {
    const googleAuthOptions = {
      projectId: 'another_project',
    };
    expect(() => {
      new VertexAI({
        project: PROJECT,
        location: LOCATION,
        googleAuthOptions: googleAuthOptions,
      });
    }).toThrow(
      new Error(
        'inconsistent project ID values. argument project got value test_project but googleAuthOptions.projectId got value another_project'
      )
    );
  });

  it('given scopes missing required scope, should throw GoogleAuthError', () => {
    const invalidGoogleAuthOptionsStringScopes = {scopes: 'test.scopes'};
    expect(() => {
      new VertexAI({
        project: PROJECT,
        location: LOCATION,
        googleAuthOptions: invalidGoogleAuthOptionsStringScopes,
      });
    }).toThrow(
      new GoogleAuthError(
        "input GoogleAuthOptions.scopes test.scopes doesn't contain required scope " +
          'https://www.googleapis.com/auth/cloud-platform, ' +
          'please include https://www.googleapis.com/auth/cloud-platform into GoogleAuthOptions.scopes ' +
          'or leave GoogleAuthOptions.scopes undefined'
      )
    );
    const invalidGoogleAuthOptionsArrayScopes = {
      scopes: ['test1.scopes', 'test2.scopes'],
    };
    expect(() => {
      new VertexAI({
        project: PROJECT,
        location: LOCATION,
        googleAuthOptions: invalidGoogleAuthOptionsArrayScopes,
      });
    }).toThrow(
      new GoogleAuthError(
        "input GoogleAuthOptions.scopes test1.scopes,test2.scopes doesn't contain required scope " +
          'https://www.googleapis.com/auth/cloud-platform, ' +
          'please include https://www.googleapis.com/auth/cloud-platform into GoogleAuthOptions.scopes ' +
          'or leave GoogleAuthOptions.scopes undefined'
      )
    );
  });

  it('VertexAIPreview should generate GenerativatModelPreview', () => {
    const generativeModelPreview = vertexai.preview.getGenerativeModel({
      model: 'gemini-pro',
    });

    expect(generativeModelPreview).toBeInstanceOf(GenerativeModelPreview);
  });
  it('VertexAI should generate GenerativatModel', () => {
    const generativeModel = vertexai.getGenerativeModel({
      model: 'gemini-pro',
    });

    expect(generativeModel).toBeInstanceOf(GenerativeModel);
  });
});

function cleanupEnvironmentVariable() {
  delete process.env['GOOGLE_CLOUD_REGION'];
  delete process.env['CLOUD_ML_REGION'];
  delete process.env['GOOGLE_CLOUD_PROJECT'];
}

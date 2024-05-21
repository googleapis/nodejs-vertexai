import {VertexAI} from '../src/vertex_ai';
import {GenerativeModelPreview, GenerativeModel} from '../src/models';
import {GoogleAuthError} from '../src/types/errors';

const PROJECT = 'test_project';
const LOCATION = 'test_location';
describe('VertexAI', () => {
  let vertexai: VertexAI;

  beforeEach(() => {
    vertexai = new VertexAI({
      project: PROJECT,
      location: LOCATION,
    });
  });

  it('no location given, should instantiate VertexAI and VertexAIPreview', () => {
    const vertexaiNoLocation = new VertexAI({project: PROJECT});
    const generativeModel = vertexaiNoLocation.getGenerativeModel({
      model: 'gemini-pro',
    });
    const generativeModelPreview =
      vertexaiNoLocation.preview.getGenerativeModel({
        model: 'gemini-pro',
      });
    expect(vertexaiNoLocation).toBeInstanceOf(VertexAI);
    expect(generativeModel).toBeInstanceOf(GenerativeModel);
    expect(generativeModelPreview).toBeInstanceOf(GenerativeModelPreview);
  });

  it('location in run time env GOOGLE_CLOUD_REGION, should instantiate VertexAI and VertexAIPreview', () => {
    process.env['GOOGLE_CLOUD_REGION'] = 'us-central1';
    const vertexaiNoLocation = new VertexAI({project: PROJECT});
    const generativeModel = vertexaiNoLocation.getGenerativeModel({
      model: 'gemini-pro',
    });
    const generativeModelPreview =
      vertexaiNoLocation.preview.getGenerativeModel({
        model: 'gemini-pro',
      });
    expect(vertexaiNoLocation).toBeInstanceOf(VertexAI);
    expect(generativeModel).toBeInstanceOf(GenerativeModel);
    expect(generativeModelPreview).toBeInstanceOf(GenerativeModelPreview);
  });

  it('location in run time env CLOUD_ML_REGION, should instantiate VertexAI and VertexAIPreview', () => {
    process.env['CLOUD_ML_REGION'] = 'us-central1';
    const vertexaiNoLocation = new VertexAI({project: PROJECT});
    const generativeModel = vertexaiNoLocation.getGenerativeModel({
      model: 'gemini-pro',
    });
    const generativeModelPreview =
      vertexaiNoLocation.preview.getGenerativeModel({
        model: 'gemini-pro',
      });
    expect(vertexaiNoLocation).toBeInstanceOf(VertexAI);
    expect(generativeModel).toBeInstanceOf(GenerativeModel);
    expect(generativeModelPreview).toBeInstanceOf(GenerativeModelPreview);
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

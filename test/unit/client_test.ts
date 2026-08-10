import {AgentEngines} from '../../src/agentengines';
import {Client} from '../../src/client';

describe('GenAI Client Instantiation', () => {
  const options = {
    project: 'test-project',
    location: 'us-central1',
  };

  it('should initialize with provided project and location', () => {
    const client = new Client(options);
    expect(client).toBeDefined();
  });

  it('should expose agentEnginesInternal as an instance of AgentEngines',
     () => {
       const client = new Client(options);
       // This will log an experimental warning.
       expect(client.agentEnginesInternal).toBeDefined();
       expect(client.agentEnginesInternal instanceof AgentEngines).toBe(true);
     });

  it('should correctly initialize AgentEngines submodules', () => {
    const client = new Client(options);
    const ae = client.agentEnginesInternal;
    expect(ae.sessions).toBeDefined();
    expect(ae.sandboxes).toBeDefined();
    expect(ae.memories).toBeDefined();
  });
});

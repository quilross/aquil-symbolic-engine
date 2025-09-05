// Simple R2 test script
import { put, get } from './src/actions/r2.js';

async function testR2() {
  console.log('Testing R2 functionality...');
  
  // Test put
  const putReq = {
    json: async () => ({
      key: 'test-message',
      base64: btoa('Hello ChatGPT! This is a test message in R2.'),
      httpMetadata: { contentType: 'text/plain' }
    })
  };
  
  const env = {
    AQUIL_STORAGE: {
      put: async (key, data, metadata) => {
        console.log('R2 PUT:', key, 'Data length:', data.length);
        return true;
      },
      get: async (key) => {
        console.log('R2 GET:', key);
        return {
          arrayBuffer: async () => new TextEncoder().encode('Hello ChatGPT! This is a test message in R2.').buffer
        };
      }
    }
  };
  
  try {
    const putResult = await put(putReq, env);
    console.log('PUT result:', putResult);
    
    const getReq = {
      url: 'http://test?key=test-message'
    };
    const getResult = await get(getReq, env);
    console.log('GET result:', getResult);
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testR2();

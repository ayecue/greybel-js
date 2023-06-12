import type { Handler } from '@netlify/functions';
import { withPlanetscale } from '@netlify/planetscale';

export const handler: Handler = withPlanetscale(async (event, context) => {
  switch (event.httpMethod) {
    case 'OPTIONS': {
      // To enable CORS
      const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
      };
      return {
        statusCode: 200, // <-- Must be 200 otherwise pre-flight call fails
        headers,
        body: 'This was a preflight call!'
      };
    }
    case 'GET': {
      const {
        planetscale: { connection },
      } = context;
    
      const { queryStringParameters } = event;
      const id = queryStringParameters?.id;
    
      if (!id) {
        return {
          statusCode: 400,
          body: 'Missing id',
        };
      }
    
      const result = await connection.execute('SELECT * FROM code WHERE id = ?', [
        id
      ]);
    
      if (result.rows.length === 0) {
        return {
          statusCode: 404,
          body: 'Not found',
        };
      }
    
      return {
        headers: {
          'Content-Type': 'application/json'
        },
        statusCode: 200,
        body: JSON.stringify(result.rows[0])
      };
    }
    case 'POST':
      const {
        planetscale: { connection },
      } = context;
    
      const { body } = event;
    
      if (!body) {
        return {
          statusCode: 400,
          body: 'Missing body',
        };
      }
    
      const { content } = JSON.parse(body);

      const result = await connection.transaction(async (tx) => {
        await tx.execute('SET @newCodeId = uuid();')
        await tx.execute('INSERT INTO code (id, code) VALUES (@newCodeId, ?)', [
          content
        ]);

        return tx.execute('SELECT @newCodeId');
      })
    
      return {
        headers: {
          'Content-Type': 'application/json'
        },
        statusCode: 201,
        body: JSON.stringify({
          id: result.rows[0]['@newCodeId']
        })
      };
    default: 
  }

  return {
    statusCode: 404,
    body: 'Not found',
  };
});

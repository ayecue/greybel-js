import type { Handler } from "@netlify/functions";
import { withPlanetscale } from "@netlify/planetscale";

export const handler: Handler = withPlanetscale(async (event, context) => {
  const {
    planetscale: { connection },
  } = context;

  const { queryStringParameters } = event;
  const id = queryStringParameters?.id;

  if (!id) {
    return {
      statusCode: 400,
      body: "Missing id",
    };
  }

  const result = await connection.execute("SELECT * FROM code WHERE id = ?", [
    id
  ]);

  if (result.rows.length === 0) {
    return {
      statusCode: 404,
      body: "Not found",
    };
  }

  return {
    headers: {
      "Content-Type": "application/json"
    },
    statusCode: 200,
    body: JSON.stringify(result.rows[0])
  };
});

import type { Handler } from "@netlify/functions";
import { withPlanetscale } from "@netlify/planetscale";

export const handler: Handler = withPlanetscale(async (event, context) => {
  const {
    planetscale: { connection },
  } = context;

  const { body } = event;

  if (!body) {
    return {
      statusCode: 400,
      body: "Missing body",
    };
  }

  const { content } = JSON.parse(body);
  const result = await connection.execute("INSERT INTO code (content) VALUES (?)", [
    content
  ]);

  return {
    headers: {
      "Content-Type": "application/json"
    },
    statusCode: 201,
    body: JSON.stringify({
      id: result.insertId
    })
  };
});

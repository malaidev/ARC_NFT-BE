import { build } from "../../helper";

let app = build();
jest.setTimeout(100000)
test("getMarketBySymbol API test [GET] [/:exchangeName/:symbol]", async () => {
  const res = await app.inject({
    method: 'GET',
    url: "http://localhost:3001/ws/v2/market/Huobi/XRP-HT",
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  });
  expect(res.statusCode).toEqual(200);
});

test("getAllMarketsBySymbol API test [GET] [/allmarkets/:symbol/:marketType]", async () => {
  const res = await app.inject({
    method: 'GET',
    url: "http://localhost:3001/ws/v2/market/allmarkets/XRP-HT/spot",
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  });
  expect(res.statusCode).toEqual(200);
});
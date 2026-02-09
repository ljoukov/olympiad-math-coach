import { describe, expect, it } from "vitest"

import { getBearerToken } from "../lib/server/firebase-id-token"

describe("getBearerToken", () => {
  it("parses Authorization: Bearer <token>", () => {
    const req = new Request("http://example.test", {
      headers: { Authorization: "Bearer abc.def.ghi" },
    })
    expect(getBearerToken(req)).toBe("abc.def.ghi")
  })

  it("is case-insensitive for the header name", () => {
    const req = new Request("http://example.test", {
      headers: { authorization: "Bearer token" },
    })
    expect(getBearerToken(req)).toBe("token")
  })

  it("returns null for missing/invalid header", () => {
    expect(getBearerToken(new Request("http://example.test"))).toBeNull()

    const notBearer = new Request("http://example.test", {
      headers: { Authorization: "Basic abc" },
    })
    expect(getBearerToken(notBearer)).toBeNull()

    const empty = new Request("http://example.test", {
      headers: { Authorization: "Bearer " },
    })
    expect(getBearerToken(empty)).toBeNull()
  })
})

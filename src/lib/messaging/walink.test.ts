import { describe, it, expect } from "vitest";
import { waMeLink } from "@/lib/messaging/walink";

describe("waMeLink", () => {
  it("strips non-digits from the phone", () => {
    expect(waMeLink("+218 91-234 5678")).toBe("https://wa.me/218912345678");
  });

  it("url-encodes the text", () => {
    expect(waMeLink("0912345678", "hi there & co")).toBe(
      "https://wa.me/0912345678?text=hi%20there%20%26%20co",
    );
  });

  it("omits the query when no text is given", () => {
    expect(waMeLink("0912345678")).toBe("https://wa.me/0912345678");
  });

  it("is safe on empty/garbage phone input", () => {
    expect(waMeLink("")).toBe("https://wa.me/");
  });
});

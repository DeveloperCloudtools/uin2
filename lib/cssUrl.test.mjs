import assert from "node:assert/strict";
import test from "node:test";
import { toCssUrl } from "./cssUrl.mjs";

test("preserves percent-encoded characters in image URLs", () => {
  assert.equal(
    toCssUrl(
      "https://uin-multimedia.mypms.pt/uin-pedregal/Carta%20Snacks%202.jpg"
    ),
    'url("https://uin-multimedia.mypms.pt/uin-pedregal/Carta%20Snacks%202.jpg")'
  );
});

test("quotes image URLs containing spaces for CSS", () => {
  assert.equal(
    toCssUrl("https://example.com/image with spaces.jpg"),
    'url("https://example.com/image with spaces.jpg")'
  );
});

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { orderedMedia, primaryImageUrl } from '../lib/product-media.ts';

test('photos are shown by position, so the primary image is the first position, not the first array item', () => {
  const media = [
    { type: 'image', url: 'back.jpg', position: 2 },
    { type: 'image', url: 'front.jpg', position: 0 },
    { type: 'image', url: 'side.jpg', position: 1 },
  ];
  assert.deepEqual(orderedMedia(media).map((item) => item.url), ['front.jpg', 'side.jpg', 'back.jpg']);
  assert.equal(primaryImageUrl({ media }), 'front.jpg');
});

test('older responses without a position keep their array order', () => {
  const media = [{ type: 'image', url: 'a.jpg' }, { type: 'image', url: 'b.jpg' }];
  assert.deepEqual(orderedMedia(media).map((item) => item.url), ['a.jpg', 'b.jpg']);
  assert.equal(primaryImageUrl({ media }), 'a.jpg');
});

test('no photos gives no primary image, and ordering does not change the input', () => {
  assert.equal(primaryImageUrl({ media: [] }), undefined);
  assert.equal(primaryImageUrl(null), undefined);
  const media = [{ url: 'b', position: 1 }, { url: 'a', position: 0 }];
  orderedMedia(media);
  assert.deepEqual(media.map((item) => item.url), ['b', 'a']);
});

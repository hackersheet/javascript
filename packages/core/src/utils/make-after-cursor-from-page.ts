export default function makeAfterCursorFromPage(page: number, first: number) {
  const after = (page - 1) * first;
  if (after === 0) {
    return undefined;
  }
  return Buffer.from(after.toString()).toString('base64');
}

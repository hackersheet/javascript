export default function isUrl(value: string) {
  try {
    new URL(value);
    return true;
  } catch (error) {
    return false;
  }
}

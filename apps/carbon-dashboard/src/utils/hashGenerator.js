import SHA256 from "crypto-js/sha256";

export function generateHash(data) {
  return SHA256(JSON.stringify(data)).toString();
}
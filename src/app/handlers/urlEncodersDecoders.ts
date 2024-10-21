import { encode, decode } from "@frsource/base64";

export const safeEncodeUrl = (str: string) => {
  // return str_replace(array('+', '/'), array('-', '_'), base64_encode(string));
  return encode(str).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
};

export const safeDecodeUrl = (str: string) => {
  // return base64_decode(str_replace(array('-', '_'), array('+', '/'), string));
  return decode(str.replace(/-/g, "+").replace(/_/g, "/"));
};

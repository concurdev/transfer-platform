import { RESET_COLOR } from "./constants";

export function colorMsg(msg: string, color: string): string {
  if (typeof msg !== "string") {
    throw new Error("Message should be a string");
  }

  if (typeof color !== "string") {
    throw new Error("Color should be a valid string");
  }

  return `${color}${msg}${RESET_COLOR}`;
}

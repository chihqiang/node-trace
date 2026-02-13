import { isBrowser } from "../../utils";

export function getScreenInfo(): {
  screen_width: number;
  screen_height: number;
  screen_available_width: number;
  screen_available_height: number;
  screen_color_depth: number;
} {
  if (!isBrowser() || typeof screen === "undefined") {
    return {
      screen_width: 0,
      screen_height: 0,
      screen_available_width: 0,
      screen_available_height: 0,
      screen_color_depth: 0,
    };
  }

  return {
    screen_width: screen.width,
    screen_height: screen.height,
    screen_available_width: screen.availWidth,
    screen_available_height: screen.availHeight,
    screen_color_depth: screen.colorDepth,
  };
}

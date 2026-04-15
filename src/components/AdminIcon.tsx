/**
 * Pure View-based monochrome icon set for the admin screens.
 * No external icon library required — all drawn with React Native Views.
 *
 * Each icon accepts:
 *   size  — overall bounding box (default 20)
 *   color — fill/stroke color (default near-black #1A1A1A)
 */
import React from 'react';
import {View} from 'react-native';

type IP = {size?: number; color?: string};
const D = '#1A1A1A';

/** Map a value from the 20-unit design grid to actual pixels. */
const g = (n: number, size: number) => Math.max(1, Math.round((n / 20) * size));

// ─── BuildingIcon — Property Verification ────────────────────────────────────
// Rectangle building body (no bottom border) + flat roof line + 4 window squares.
export const BuildingIcon = ({size = 20, color = D}: IP) => {
  const s = (n: number) => g(n, size);
  const sw = g(1.5, size);
  return (
    <View style={{width: size, height: size}}>
      {/* Body — open at bottom */}
      <View style={{
        position: 'absolute', left: s(2), top: s(4), right: s(2), bottom: 0,
        borderTopWidth: sw, borderLeftWidth: sw, borderRightWidth: sw,
        borderColor: color,
      }} />
      {/* Flat roof overhangs the body */}
      <View style={{position: 'absolute', left: 0, top: s(4), right: 0, height: sw, backgroundColor: color}} />
      {/* Windows — 2 × 2 grid */}
      <View style={{position: 'absolute', left: s(5), top: s(7), width: s(3), height: s(3), backgroundColor: color}} />
      <View style={{position: 'absolute', right: s(5), top: s(7), width: s(3), height: s(3), backgroundColor: color}} />
      <View style={{position: 'absolute', left: s(5), top: s(12), width: s(3), height: s(3), backgroundColor: color}} />
      <View style={{position: 'absolute', right: s(5), top: s(12), width: s(3), height: s(3), backgroundColor: color}} />
    </View>
  );
};

// ─── ArrowUpIcon — Investment Review ─────────────────────────────────────────
// Upward arrow: filled triangular head + rectangular shaft.
// Communicates growth and returns.
export const ArrowUpIcon = ({size = 20, color = D}: IP) => {
  const s = (n: number) => g(n, size);
  const shaftW = s(3);
  const headHalf = s(5); // half-width of arrowhead base
  const headH = s(7);
  return (
    <View style={{width: size, height: size, alignItems: 'center'}}>
      {/* Triangular head — CSS border triangle trick */}
      <View style={{
        position: 'absolute', top: s(1),
        width: 0, height: 0,
        borderLeftWidth: headHalf, borderRightWidth: headHalf,
        borderBottomWidth: headH,
        borderLeftColor: 'transparent', borderRightColor: 'transparent',
        borderBottomColor: color,
      }} />
      {/* Shaft — starts just below the tip of the triangle */}
      <View style={{
        position: 'absolute',
        top: s(1) + headH - g(1, size),
        bottom: s(2),
        width: shaftW,
        backgroundColor: color,
        borderRadius: 1,
      }} />
    </View>
  );
};

// ─── PersonIcon — User Management ────────────────────────────────────────────
// Circle head + open arc for shoulders/torso.
export const PersonIcon = ({size = 20, color = D}: IP) => {
  const s = (n: number) => g(n, size);
  const sw = g(1.5, size);
  const headSize = s(7);
  const headRadius = headSize / 2;
  const headLeft = Math.round((size - headSize) / 2);
  return (
    <View style={{width: size, height: size}}>
      {/* Head */}
      <View style={{
        position: 'absolute',
        left: headLeft, top: s(1),
        width: headSize, height: headSize,
        borderRadius: headRadius,
        borderWidth: sw, borderColor: color,
      }} />
      {/* Shoulders arc — open at bottom, rounded top */}
      <View style={{
        position: 'absolute',
        left: s(2), top: s(11), right: s(2), bottom: 0,
        borderTopWidth: sw, borderLeftWidth: sw, borderRightWidth: sw,
        borderColor: color,
        borderTopLeftRadius: s(8),
        borderTopRightRadius: s(8),
      }} />
    </View>
  );
};

// ─── ShieldIcon — Moderation Queue ───────────────────────────────────────────
// Rounded-top shield outline with strongly rounded bottom (arch shape).
// Represents protection and safety enforcement.
export const ShieldIcon = ({size = 20, color = D}: IP) => {
  const s = (n: number) => g(n, size);
  const sw = g(1.5, size);
  const w = size - s(4);          // shield width
  const h = size - s(2);          // shield height
  const btmR = Math.round(w / 2); // large bottom radius → arch bottom
  return (
    <View style={{width: size, height: size, alignItems: 'center', paddingTop: s(1)}}>
      <View style={{
        width: w, height: h,
        borderWidth: sw, borderColor: color,
        borderTopLeftRadius: s(4),
        borderTopRightRadius: s(4),
        borderBottomLeftRadius: btmR,
        borderBottomRightRadius: btmR,
      }} />
    </View>
  );
};

// ─── BarChartIcon — Analytics ────────────────────────────────────────────────
// Three vertical bars of varying height with a horizontal baseline.
export const BarChartIcon = ({size = 20, color = D}: IP) => {
  const s = (n: number) => g(n, size);
  const sw = g(1.5, size);
  const baseY = size - s(3);
  return (
    <View style={{width: size, height: size}}>
      {/* Baseline */}
      <View style={{position: 'absolute', left: 0, top: baseY, right: 0, height: sw, backgroundColor: color}} />
      {/* Bar 1 — short */}
      <View style={{position: 'absolute', left: s(1), top: baseY - s(7), width: s(4), height: s(7), backgroundColor: color}} />
      {/* Bar 2 — tall */}
      <View style={{position: 'absolute', left: s(8), top: baseY - s(13), width: s(4), height: s(13), backgroundColor: color}} />
      {/* Bar 3 — medium */}
      <View style={{position: 'absolute', right: s(1), top: baseY - s(9), width: s(4), height: s(9), backgroundColor: color}} />
    </View>
  );
};

// ─── BellIcon — Announcements ────────────────────────────────────────────────
// Bell dome (open bottom arch) + base line + clapper dot.
export const BellIcon = ({size = 20, color = D}: IP) => {
  const s = (n: number) => g(n, size);
  const sw = g(1.5, size);
  return (
    <View style={{width: size, height: size, alignItems: 'center'}}>
      {/* Hanger/stem */}
      <View style={{
        position: 'absolute', top: 0,
        width: sw + 1, height: s(4),
        backgroundColor: color, borderRadius: 1,
      }} />
      {/* Dome — rounded top, open bottom */}
      <View style={{
        position: 'absolute',
        left: s(3), top: s(3), right: s(3), height: s(11),
        borderTopWidth: sw, borderLeftWidth: sw, borderRightWidth: sw,
        borderColor: color,
        borderTopLeftRadius: s(6),
        borderTopRightRadius: s(6),
      }} />
      {/* Rim line */}
      <View style={{position: 'absolute', left: s(1), top: s(13), right: s(1), height: sw, backgroundColor: color}} />
      {/* Clapper dot */}
      <View style={{
        position: 'absolute', top: s(15),
        width: s(3), height: s(3),
        borderRadius: s(2), backgroundColor: color,
      }} />
    </View>
  );
};

// ─── DocListIcon — Audit Logs ────────────────────────────────────────────────
// Document outline with three horizontal lines inside.
export const DocListIcon = ({size = 20, color = D}: IP) => {
  const s = (n: number) => g(n, size);
  const sw = g(1.5, size);
  return (
    <View style={{width: size, height: size}}>
      {/* Document border */}
      <View style={{
        position: 'absolute', left: s(2), top: s(1), right: s(2), bottom: s(1),
        borderWidth: sw, borderColor: color, borderRadius: s(2),
      }} />
      {/* Line 1 */}
      <View style={{position: 'absolute', left: s(5), top: s(6), right: s(5), height: sw, backgroundColor: color}} />
      {/* Line 2 */}
      <View style={{position: 'absolute', left: s(5), top: s(10), right: s(5), height: sw, backgroundColor: color}} />
      {/* Line 3 — shorter, hints at a list */}
      <View style={{position: 'absolute', left: s(5), top: s(14), right: s(8), height: sw, backgroundColor: color}} />
    </View>
  );
};

// ─── PencilIcon — Content Management ─────────────────────────────────────────
// Diagonal pencil: body rectangle + triangular tip + eraser cap, rotated −45°.
export const PencilIcon = ({size = 20, color = D}: IP) => {
  const s = (n: number) => g(n, size);
  const sw = g(1.5, size);
  const bodyW = s(4);
  const bodyH = s(10);
  const tipH = s(3);
  const capH = s(2);
  return (
    <View style={{width: size, height: size, alignItems: 'center', justifyContent: 'center'}}>
      {/* All parts grouped and rotated together */}
      <View style={{transform: [{rotate: '-45deg'}], alignItems: 'center'}}>
        {/* Eraser cap */}
        <View style={{width: bodyW, height: capH, backgroundColor: color, borderRadius: 1}} />
        {/* Body outline */}
        <View style={{width: bodyW, height: bodyH, borderWidth: sw, borderColor: color}} />
        {/* Tip triangle (border trick — points downward) */}
        <View style={{
          width: 0, height: 0,
          borderLeftWidth: bodyW / 2,
          borderRightWidth: bodyW / 2,
          borderTopWidth: tipH,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderTopColor: color,
        }} />
      </View>
    </View>
  );
};

// ─── CalendarIcon — Date filter inputs ───────────────────────────────────────
// Calendar square with two hanger tabs at top, a header band, and day dots.
export const CalendarIcon = ({size = 16, color = D}: IP) => {
  const s = (n: number) => g(n, size);
  const sw = g(1.5, size);
  return (
    <View style={{width: size, height: size}}>
      {/* Calendar box */}
      <View style={{
        position: 'absolute', left: 0, top: s(3), right: 0, bottom: 0,
        borderWidth: sw, borderColor: color, borderRadius: s(2),
      }} />
      {/* Header divider */}
      <View style={{position: 'absolute', left: 0, top: s(7), right: 0, height: sw, backgroundColor: color}} />
      {/* Left hanger tab */}
      <View style={{
        position: 'absolute', left: s(4), top: 0,
        width: sw + 1, height: s(5),
        backgroundColor: color, borderRadius: 1,
      }} />
      {/* Right hanger tab */}
      <View style={{
        position: 'absolute', right: s(4), top: 0,
        width: sw + 1, height: s(5),
        backgroundColor: color, borderRadius: 1,
      }} />
      {/* Day dots — two dots in the body */}
      <View style={{position: 'absolute', left: s(3), top: s(10), width: s(2), height: s(2), backgroundColor: color, borderRadius: 1}} />
      <View style={{position: 'absolute', left: s(8), top: s(10), width: s(2), height: s(2), backgroundColor: color, borderRadius: 1}} />
    </View>
  );
};

// ─── WarningCircleIcon — Error states ────────────────────────────────────────
// Circle outline with exclamation mark (shaft + dot) inside.
// Accepts color prop so callers can tint it red for danger contexts.
export const WarningCircleIcon = ({size = 28, color = D}: IP) => {
  const s = (n: number) => g(n, size);
  const sw = g(1.5, size);
  const r = Math.round(size / 2);
  const shaftW = sw + 1;
  return (
    <View style={{width: size, height: size, alignItems: 'center', justifyContent: 'center'}}>
      {/* Circle border */}
      <View style={{
        position: 'absolute',
        width: size, height: size,
        borderRadius: r,
        borderWidth: sw, borderColor: color,
      }} />
      {/* Exclamation shaft */}
      <View style={{
        position: 'absolute', top: s(5),
        width: shaftW, height: s(8),
        backgroundColor: color, borderRadius: 1,
      }} />
      {/* Exclamation dot */}
      <View style={{
        position: 'absolute', top: s(15),
        width: shaftW, height: shaftW,
        backgroundColor: color, borderRadius: Math.round(shaftW / 2),
      }} />
    </View>
  );
};

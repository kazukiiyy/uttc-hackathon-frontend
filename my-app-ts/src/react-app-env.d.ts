/// <reference types="react-scripts" />

// Fix react-icons type compatibility with React 19
declare module 'react-icons/fa' {
  import { ComponentType, SVGAttributes } from 'react';
  export type IconType = ComponentType<SVGAttributes<SVGElement> & { className?: string }>;
  export const FaTshirt: IconType;
  export const FaMobileAlt: IconType;
  export const FaGamepad: IconType;
  export const FaRunning: IconType;
  export const FaBook: IconType;
  export const FaSprayCan: IconType;
  export const FaUtensils: IconType;
  export const FaEllipsisH: IconType;
}

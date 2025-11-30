
import { ThemeColor } from '../types';

export interface ThemeConfig {
  name: string;
  gradient: string;       // For Navbar, Primary Buttons, Headers
  activeClass: string;    // For Selected States (Calendar)
  lightBg: string;        // For Secondary backgrounds (hover states, badges)
  text: string;           // For Primary Text
  hex: string;            // For Charts
  border: string;         // For Borders
  ring: string;           // For Input Focus Rings
}

export const THEMES: Record<ThemeColor, ThemeConfig> = {
  emerald: {
    name: 'Emerald Forest',
    gradient: 'bg-gradient-to-r from-emerald-500 to-teal-600',
    activeClass: 'bg-gradient-to-br from-emerald-400 to-teal-600 shadow-emerald-200 dark:shadow-none text-white',
    lightBg: 'bg-emerald-50 dark:bg-emerald-900/20',
    text: 'text-emerald-600 dark:text-emerald-400',
    hex: '#10B981',
    border: 'border-emerald-200 dark:border-emerald-800',
    ring: 'focus:ring-emerald-500'
  },
  blue: {
    name: 'Ocean Depth',
    gradient: 'bg-gradient-to-r from-blue-500 to-indigo-600',
    activeClass: 'bg-gradient-to-br from-blue-400 to-indigo-600 shadow-blue-200 dark:shadow-none text-white',
    lightBg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-600 dark:text-blue-400',
    hex: '#3B82F6',
    border: 'border-blue-200 dark:border-blue-800',
    ring: 'focus:ring-blue-500'
  },
  rose: {
    name: 'Velvet Rose',
    gradient: 'bg-gradient-to-r from-rose-500 to-red-600',
    activeClass: 'bg-gradient-to-br from-rose-400 to-red-600 shadow-rose-200 dark:shadow-none text-white',
    lightBg: 'bg-rose-50 dark:bg-rose-900/20',
    text: 'text-rose-600 dark:text-rose-400',
    hex: '#E11D48',
    border: 'border-rose-200 dark:border-rose-800',
    ring: 'focus:ring-rose-500'
  },
  violet: {
    name: 'Royal Amethyst',
    gradient: 'bg-gradient-to-r from-violet-500 to-purple-600',
    activeClass: 'bg-gradient-to-br from-violet-400 to-purple-600 shadow-violet-200 dark:shadow-none text-white',
    lightBg: 'bg-violet-50 dark:bg-violet-900/20',
    text: 'text-violet-600 dark:text-violet-400',
    hex: '#8B5CF6',
    border: 'border-violet-200 dark:border-violet-800',
    ring: 'focus:ring-violet-500'
  },
  orange: {
    name: 'Golden Amber',
    gradient: 'bg-gradient-to-r from-amber-500 to-orange-600',
    activeClass: 'bg-gradient-to-br from-amber-400 to-orange-600 shadow-orange-200 dark:shadow-none text-white',
    lightBg: 'bg-orange-50 dark:bg-orange-900/20',
    text: 'text-orange-600 dark:text-orange-400',
    hex: '#F59E0B',
    border: 'border-orange-200 dark:border-orange-800',
    ring: 'focus:ring-orange-500'
  },
  sunset: {
    name: 'Sunset Glow',
    gradient: 'bg-gradient-to-r from-orange-500 via-red-500 to-pink-500',
    activeClass: 'bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 shadow-red-200 dark:shadow-none text-white',
    lightBg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-600 dark:text-red-400',
    hex: '#EF4444',
    border: 'border-red-200 dark:border-red-800',
    ring: 'focus:ring-pink-500'
  },
  nebula: {
    name: 'Cosmic Nebula',
    gradient: 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500',
    activeClass: 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-purple-200 dark:shadow-none text-white',
    lightBg: 'bg-purple-50 dark:bg-purple-900/20',
    text: 'text-purple-600 dark:text-purple-400',
    hex: '#A855F7',
    border: 'border-purple-200 dark:border-purple-800',
    ring: 'focus:ring-indigo-500'
  }
};

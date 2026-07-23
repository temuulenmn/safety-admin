import React from 'react'

// Muse-style monotone SVG icons — accept a color prop so the sidebar can
// swap fill on hover/active without swapping the file.
const ic = (path) => (color) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    {path(color)}
  </svg>
)

export const icons = {
  dashboard: ic((c) => (
    <>
      <path d="M3 4C3 3.44 3.44 3 4 3H16C16.55 3 17 3.44 17 4V6C17 6.55 16.55 7 16 7H4C3.44 7 3 6.55 3 6V4Z" fill={c}/>
      <path d="M3 10C3 9.44 3.44 9 4 9H10C10.55 9 11 9.44 11 10V16C11 16.55 10.55 17 10 17H4C3.44 17 3 16.55 3 16V10Z" fill={c}/>
      <path d="M14 9C13.44 9 13 9.44 13 10V16C13 16.55 13.44 17 14 17H16C16.55 17 17 16.55 17 16V10C17 9.44 16.55 9 16 9H14Z" fill={c}/>
    </>
  )),
  building: ic((c) => (
    <path fillRule="evenodd" clipRule="evenodd" d="M2 2H12V18H2V2ZM4 4V16H10V4H4ZM6 6H8V8H6V6ZM6 10H8V12H6V10ZM14 8H18V18H14V8ZM16 10V16H16V10ZM8 14H6V16H8V14Z" fill={c}/>
  )),
  users: ic((c) => (
    <>
      <path d="M9 6C9 7.66 7.66 9 6 9C4.34 9 3 7.66 3 6C3 4.34 4.34 3 6 3C7.66 3 9 4.34 9 6Z" fill={c}/>
      <path d="M17 6C17 7.66 15.66 9 14 9C12.34 9 11 7.66 11 6C11 4.34 12.34 3 14 3C15.66 3 17 4.34 17 6Z" fill={c}/>
      <path d="M12.93 17C12.98 16.67 13 16.34 13 16C13 14.36 12.44 12.86 11.5 11.67C12.24 11.24 13.09 11 14 11C16.76 11 19 13.24 19 16V17H12.93Z" fill={c}/>
      <path d="M6 11C8.76 11 11 13.24 11 16V17H1V16C1 13.24 3.24 11 6 11Z" fill={c}/>
    </>
  )),
  clock: ic((c) => (
    <path fillRule="evenodd" clipRule="evenodd" d="M10 2C5.58 2 2 5.58 2 10C2 14.42 5.58 18 10 18C14.42 18 18 14.42 18 10C18 5.58 14.42 2 10 2ZM11 10V5H9V11H14V10H11Z" fill={c}/>
  )),
  calendar: ic((c) => (
    <path fillRule="evenodd" clipRule="evenodd" d="M6 2V3H14V2H16V3H17C18.1 3 19 3.9 19 5V17C19 18.1 18.1 19 17 19H3C1.9 19 1 18.1 1 17V5C1 3.9 1.9 3 3 3H4V2H6ZM17 8V17H3V8H17ZM17 5V6H3V5H17Z" fill={c}/>
  )),
  money: ic((c) => (
    <path fillRule="evenodd" clipRule="evenodd" d="M2 4H18V16H2V4ZM4 6V14H16V6H4ZM10 8C11.1 8 12 8.9 12 10C12 11.1 11.1 12 10 12C8.9 12 8 11.1 8 10C8 8.9 8.9 8 10 8ZM6 6C6 7.1 5.1 8 4 8V6H6ZM14 6H16V8C14.9 8 14 7.1 14 6ZM4 12C5.1 12 6 12.9 6 14H4V12ZM16 12V14H14C14 12.9 14.9 12 16 12Z" fill={c}/>
  )),
  badge: ic((c) => (
    <path fillRule="evenodd" clipRule="evenodd" d="M6 2C4.9 2 4 2.9 4 4V16C4 17.1 4.9 18 6 18H14C15.1 18 16 17.1 16 16V4C16 2.9 15.1 2 14 2H6ZM10 5C11.1 5 12 5.9 12 7C12 8.1 11.1 9 10 9C8.9 9 8 8.1 8 7C8 5.9 8.9 5 10 5ZM6 15C6 12.79 7.79 11 10 11C12.21 11 14 12.79 14 15V16H6V15Z" fill={c}/>
  )),
  shield: ic((c) => (
    <path fillRule="evenodd" clipRule="evenodd" d="M10 1L3 4V10C3 14.4 6.09 18.5 10 19C13.91 18.5 17 14.4 17 10V4L10 1ZM10 3.2L15 5.35V10C15 13.28 12.75 16.35 10 16.97V3.2Z" fill={c}/>
  )),
  book: ic((c) => (
    <path fillRule="evenodd" clipRule="evenodd" d="M4 3C2.9 3 2 3.9 2 5V15C2 16.1 2.9 17 4 17H10V15H4V5H10V3H4ZM16 3C17.1 3 18 3.9 18 5V15C18 16.1 17.1 17 16 17H12V15H16V5H12V3H16ZM10 5H4V15H10V5ZM12 5H16V15H12V5Z" fill={c}/>
  )),
  layers: ic((c) => (
    <path fillRule="evenodd" clipRule="evenodd" d="M10 2L2 6L10 10L18 6L10 2ZM2 10L10 14L18 10M2 14L10 18L18 14" stroke={c} strokeWidth="1.5"/>
  )),
  lock: ic((c) => (
    <path fillRule="evenodd" clipRule="evenodd" d="M6 8V6C6 3.79 7.79 2 10 2C12.21 2 14 3.79 14 6V8H15C16.1 8 17 8.9 17 10V16C17 17.1 16.1 18 15 18H5C3.9 18 3 17.1 3 16V10C3 8.9 3.9 8 5 8H6ZM8 8H12V6C12 4.9 11.1 4 10 4C8.9 4 8 4.9 8 6V8Z" fill={c}/>
  )),
  wrench: ic((c) => (
    <path fillRule="evenodd" clipRule="evenodd" d="M13.44 3.02C15.55 2.7 17.66 3.53 19.05 5.31L14.71 9.65L16.94 11.88L21.28 7.54C22.66 9.62 22.72 12.4 21.14 14.51C19.55 16.62 16.87 17.42 14.53 16.51L4.71 6.7C3.35 5.34 3.35 3.13 4.71 1.77C6.07 0.41 8.28 0.41 9.64 1.77L13.44 3.02Z" fill={c}/>
  )),
  warning: ic((c) => (
    <path fillRule="evenodd" clipRule="evenodd" d="M10 2L18 16H2L10 2ZM10 6L4.53 14H15.47L10 6ZM9 10H11V12H9V10ZM9 13H11V15H9V13Z" fill={c}/>
  )),
  bank: ic((c) => (
    <path fillRule="evenodd" clipRule="evenodd" d="M10 1L1 5V7H19V5L10 1ZM3 8V15H5V8H3ZM7 8V15H9V8H7ZM11 8V15H13V8H11ZM15 8V15H17V8H15ZM1 16V18H19V16H1Z" fill={c}/>
  )),
  group: ic((c) => (
    <path fillRule="evenodd" clipRule="evenodd" d="M7 8C8.66 8 10 6.66 10 5C10 3.34 8.66 2 7 2C5.34 2 4 3.34 4 5C4 6.66 5.34 8 7 8ZM7 10C4.79 10 1 11.11 1 13.29V16H13V13.29C13 11.11 9.21 10 7 10ZM15.5 9C16.88 9 18 7.88 18 6.5C18 5.12 16.88 4 15.5 4C14.12 4 13 5.12 13 6.5C13 7.88 14.12 9 15.5 9ZM15.55 10.5C15.09 10.5 14.67 10.55 14.28 10.63C14.72 10.98 15 11.46 15 12V16H19V13.29C19 11.79 17.5 10.5 15.55 10.5Z" fill={c}/>
  )),
  file: ic((c) => (
    <path fillRule="evenodd" clipRule="evenodd" d="M4 2C2.9 2 2 2.9 2 4V16C2 17.1 2.9 18 4 18H14C15.1 18 16 17.1 16 16V6L12 2H4ZM4 4H11V7H14V16H4V4ZM5 8V10H13V8H5ZM5 12V14H10V12H5Z" fill={c}/>
  )),
  fire: ic((c) => (
    <path fillRule="evenodd" clipRule="evenodd" d="M10 2C10 2 5 6 5 12C5 14.76 7.24 17 10 17C12.76 17 15 14.76 15 12C15 8 12 6 12 4C11 5 10 6 10 6C10 6 10 4 10 2ZM10 15C11.66 15 13 13.66 13 12C13 10.34 11.66 9 10 9C8.34 9 7 10.34 7 12C7 13.66 8.34 15 10 15Z" fill={c}/>
  )),
  check: ic((c) => (
    <path fillRule="evenodd" clipRule="evenodd" d="M10 2C5.58 2 2 5.58 2 10C2 14.42 5.58 18 10 18C14.42 18 18 14.42 18 10C18 5.58 14.42 2 10 2ZM8.5 13.5L4.5 9.5L5.91 8.09L8.5 10.67L14.09 5.09L15.5 6.5L8.5 13.5Z" fill={c}/>
  )),
  calc: ic((c) => (
    <path fillRule="evenodd" clipRule="evenodd" d="M4 2C2.9 2 2 2.9 2 4V16C2 17.1 2.9 18 4 18H14C15.1 18 16 17.1 16 16V4C16 2.9 15.1 2 14 2H4ZM4 4H14V7H4V4ZM5 9H7V11H5V9ZM8 9H10V11H8V9ZM11 9H13V11H11V9ZM5 12H7V14H5V12ZM8 12H10V14H8V12ZM11 12H13V16H11V12ZM5 15H10V17H5V15Z" fill={c}/>
  )),
  chart: ic((c) => (
    <path fillRule="evenodd" clipRule="evenodd" d="M10 2C5.58 2 2 5.58 2 10C2 14.42 5.58 18 10 18C14.42 18 18 14.42 18 10C18 5.58 14.42 2 10 2ZM11 4.07V9H15.93C15.5 6.61 13.39 4.5 11 4.07ZM4 10C4 6.9 6.13 4.31 9 3.68V11H16.32C15.69 13.87 13.1 16 10 16C6.69 16 4 13.31 4 10Z" fill={c}/>
  )),
  location: ic((c) => (
    <path fillRule="evenodd" clipRule="evenodd" d="M10 2C6.69 2 4 4.69 4 8C4 12.5 10 18 10 18C10 18 16 12.5 16 8C16 4.69 13.31 2 10 2ZM10 10.5C8.62 10.5 7.5 9.38 7.5 8C7.5 6.62 8.62 5.5 10 5.5C11.38 5.5 12.5 6.62 12.5 8C12.5 9.38 11.38 10.5 10 10.5Z" fill={c}/>
  )),
  cart: ic((c) => (
    <path fillRule="evenodd" clipRule="evenodd" d="M5 2C4.6 2 4.21 2.24 4.05 2.61L1.79 8H1C0.44 8 0 8.44 0 9C0 9.55 0.44 10 1 10L3 16C3 17.1 3.89 18 5 18H15C16.1 18 17 17.1 17 16L19 10C19.55 10 20 9.55 20 9C20 8.44 19.55 8 19 8H18.2L15.94 2.61C15.78 2.24 15.4 2 15 2H5ZM7 13C6.44 13 6 13.44 6 14C6 14.55 6.44 15 7 15C7.55 15 8 14.55 8 14C8 13.44 7.55 13 7 13ZM13 13C12.44 13 12 13.44 12 14C12 14.55 12.44 15 13 15C13.55 15 14 14.55 14 14C14 13.44 13.55 13 13 13Z" fill={c}/>
  )),
  list: ic((c) => (
    <>
      <path d="M3 4H17V6H3V4Z" fill={c}/>
      <path d="M3 9H17V11H3V9Z" fill={c}/>
      <path d="M3 14H17V16H3V14Z" fill={c}/>
    </>
  )),
  heart: ic((c) => (
    <path d="M10 17.3L8.55 15.99C3.4 11.36 0 8.28 0 4.5C0 1.42 2.42 -1 5.5 -1C7.24 -1 8.91 -0.19 10 1.09C11.09 -0.19 12.76 -1 14.5 -1C17.58 -1 20 1.42 20 4.5C20 8.28 16.6 11.36 11.45 15.99L10 17.3Z" fill={c}/>
  )),
  ambulance: ic((c) => (
    <>
      <path d="M2 4h11v9H2z" fill={c} opacity="0.85"/>
      <path d="M13 7h3l2 3v3h-5V7z" fill={c}/>
      <circle cx="5" cy="15" r="2" fill={c}/>
      <circle cx="15" cy="15" r="2" fill={c}/>
      <path d="M6 8h2v1h1v2H8v1H6v-1H5V9h1V8z" fill="#fff"/>
    </>
  )),
}

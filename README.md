# FlexiCalendar

FlexiCalendar is a modern, themeable React calendar component you can embed in any project. It ships with sensible defaults, intuitive navigation, and an API built for customization.

## Highlights

- Drop-in React component with zero external date libraries
- Theme system driven by CSS variables for instant branding
- Custom day rendering, highlighted days, disabled days, and range limits
- Locale-aware month and weekday labels powered by `Intl`
- Semantic markup with accessible focus states out of the box
- Keyboard shortcuts for fast navigation (arrows, Page Up/Down, Home/End, T)
- Adapts automatically to system dark mode with override hooks
- Optional year navigation controls and quick jump shortcuts

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:5173 to explore the playground that showcases both default and custom calendar setups.

## Build

```bash
npm run build
```

This compiles the library bundle (ESM and CJS) into `dist/` using Vite library mode.

## Installation

```bash
npm install flexi-calendar
```

## Usage

```jsx
import { useState } from 'react'
import { FlexiCalendar } from 'flexi-calendar'

const Demo = () => {
  const [selectedDate, setSelectedDate] = useState(new Date())

  return (
    <FlexiCalendar
      selectedDate={selectedDate}
      onDateSelect={setSelectedDate}
      highlightedDates={[new Date()]}
      weekStartsOn={1}
    />
  )
}
```

> FlexiCalendar lists `react` and `react-dom` as peer dependencies. Ensure your project already includes React 18 or newer.

## Component Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `initialDate` | `Date \| string \| number` | `new Date()` | Month shown when the component mounts. |
| `selectedDate` | `Date \| string \| number` | `undefined` | Controlled selected day. Combine with `onDateSelect`. |
| `defaultSelectedDate` | `Date \| string \| number` | `undefined` | Uncontrolled starting selection. |
| `onDateSelect` | `(date: Date) => void` | `undefined` | Invoked when the user picks a new day. |
| `weekStartsOn` | `number` | `0` | Leading weekday (0 = Sunday, 1 = Monday, ...). |
| `locale` | `string` | `'default'` | Locale for `Intl` formatters. |
| `minDate` / `maxDate` | `Date \| string \| number` | `undefined` | Clamp selectable range. |
| `disabledDates` | `Array<Date \| string \| number>` | `[]` | Specific days that cannot be selected. |
| `highlightedDates` | `Array<Date \| string \| number \| { date, label, color }>` | `[]` | Mark events with dots or custom badges. |
| `renderDay` | `({ date, isCurrentMonth, isSelected, isToday, isDisabled, isHighlighted }) => ReactNode` | `undefined` | Override day cell rendering. |
| `headerRender` | `(context) => ReactNode` | `undefined` | Custom header renderer. |
| `theme` | `Partial<typeof defaultTheme>` | `defaultTheme` | Override individual theme tokens. |
| `darkTheme` | `Partial<typeof defaultDarkTheme>` | `defaultDarkTheme` | Override tokens used when dark mode is active. |
| `colorScheme` | `'light' \| 'dark' \| 'system'` | `'system'` | Determine how the calendar chooses between light and dark palettes. |
| `showYearControls` | `boolean` | `true` | Toggle the default previous/next year buttons in the header. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Calendar density preset. |

## Keyboard Support

- `Arrow` keys move focus by one day or week
- `Page Up` and `Page Down` jump a month backward or forward
- `Shift + Page Up/Down` (or `Ctrl + Page Up/Down`) jump an entire year
- `Home` and `End` snap focus to the start or end of the current week
- `Enter` and `Space` select the focused day
- `T` centers the view on today

## Theming

The calendar merges your theme tokens with the included `defaultTheme` (light) and `defaultDarkTheme`. Pass only the values you want to override:

```js
import { defaultDarkTheme } from 'flexi-calendar'

const customTheme = {
  background: '#0f172a',
  accentColor: '#38bdf8',
  selectedBgColor: '#38bdf8',
  highlightColor: '#facc15'
}

const customDarkTheme = {
  ...defaultDarkTheme,
  background: '#020817',
  accentColor: '#38bdf8'
}
```

```jsx
<FlexiCalendar
  theme={customTheme}
  darkTheme={customDarkTheme}
  colorScheme="system"
/>
```

Because FlexiCalendar relies on CSS variables, you can also override styling globally without touching the component API. The calendar listens to system dark mode when `colorScheme="system"`, and you can force a mode or provide custom dark overrides with the `darkTheme` prop.

## Project Structure

```
src/
  components/
    FlexiCalendar/
      FlexiCalendar.jsx
      index.js
  hooks/
    useCalendar.js
  theme/
    defaultTheme.js
    defaultDarkTheme.js
  utils/
    dateUtils.js
  styles/
    flexiCalendar.css
  App.jsx
  index.js
```

## Roadmap

- Date range selection utilities
- Keyboard navigation shortcuts
- Multi-month views and inline input variants
- TypeScript definitions and storybook examples

Contributions and ideas are welcome! Open an issue or start a discussion to help shape FlexiCalendar.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our development workflow, coding standards, and how to submit pull requests.

## Code of Conduct

We expect everyone participating in this project to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## Security

If you believe you have found a security vulnerability, please follow the guidance in [SECURITY.md](SECURITY.md) instead of opening a public issue.

## License

FlexiCalendar is released under the [MIT License](LICENSE).

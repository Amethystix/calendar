# DayFlow

A flexible and feature-rich calendar component library for React applications with drag-and-drop support, multiple views, and plugin architecture.

[![npm version](https://img.shields.io/npm/v/dayflow.svg)](https://www.npmjs.com/package/dayflow)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- 📅 **Multiple Views**: Day, Week, Month, and Year views
- 🎨 **Customizable Styling**: Built with Tailwind CSS for easy customization
- 📱 **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- 🔌 **Plugin Architecture**: Extensible plugin system for custom functionality
- 🎯 **Drag & Drop Support**: Intuitive event management with drag and drop
- ⚡ **TypeScript Support**: Fully typed for better developer experience
- 🎨 **Event Management**: Create, update, delete, and organize events
- 🔄 **Virtual Scrolling**: High performance with large datasets
- 🎭 **Custom Renderers**: Customize event appearance and behavior

## 📦 Installation

```bash
npm install @dayflow/core lucide-react
# or
yarn add @dayflow/core lucide-react
# or
pnpm add @dayflow/core lucide-react
```

### Peer Dependencies

DayFlow requires the following peer dependencies:
- `react` >= 18.0.0
- `react-dom` >= 18.0.0
- `lucide-react` >= 0.400.0

## 🚀 Quick Start

```tsx
import { useCalendarApp, DayFlowCalendar } from '@dayflow/core';
import { createMonthView, createWeekView, createDayView } from '@dayflow/core';
// Import styles
import '@dayflow/core/dist/styles.css';

function App() {
  const calendar = useCalendarApp({
    views: [createMonthView(), createWeekView(), createDayView()],
    initialDate: new Date(),
  });

  return <DayFlowCalendar calendar={calendar} />;
}
```

> **Note**: Don't forget to import the CSS file in your application to ensure proper styling.

## 📖 Basic Usage

### Creating a Calendar with Events

```tsx
import {
  useCalendarApp,
  DayFlowCalendar,
  createMonthView,
} from 'dayflow';
import 'dayflow/dist/styles.css';

function MyCalendar() {
  const calendar = useCalendarApp({
    views: [createMonthView()],
    initialDate: new Date(),
    events: [
      {
        id: 1,
        title: 'Team Meeting',
        date: new Date(2025, 0, 15),
        startHour: 10,
        endHour: 11,
        color: '#3b82f6',
      },
      {
        id: 2,
        title: 'Conference',
        startDate: new Date(2025, 0, 20),
        endDate: new Date(2025, 0, 22),
        isAllDay: true,
        color: '#10b981',
      },
    ],
  });

  return <DayFlowCalendar calendar={calendar} />;
}
```

### Using Multiple Views

```tsx
import {
  useCalendarApp,
  DayFlowCalendar,
  createDayView,
  createWeekView,
  createMonthView,
  createYearView,
  ViewType,
} from 'dayflow';
import 'dayflow/dist/styles.css';

function MultiViewCalendar() {
  const calendar = useCalendarApp({
    views: [
      createDayView(),
      createWeekView(),
      createMonthView(),
      createYearView(),
    ],
    initialView: ViewType.MONTH,
    initialDate: new Date(),
  });

  return (
    <div>
      <div className="view-switcher">
        <button onClick={() => calendar.changeView(ViewType.DAY)}>Day</button>
        <button onClick={() => calendar.changeView(ViewType.WEEK)}>Week</button>
        <button onClick={() => calendar.changeView(ViewType.MONTH)}>
          Month
        </button>
        <button onClick={() => calendar.changeView(ViewType.YEAR)}>Year</button>
      </div>
      <DayFlowCalendar calendar={calendar} />
    </div>
  );
}
```

### Event Callbacks

```tsx
function CalendarWithCallbacks() {
  const calendar = useCalendarApp({
    views: [createMonthView()],
    initialDate: new Date(),
    onEventCreate: event => {
      console.log('Event created:', event);
      // Save to database
    },
    onEventUpdate: event => {
      console.log('Event updated:', event);
      // Update in database
    },
    onEventDelete: eventId => {
      console.log('Event deleted:', eventId);
      // Delete from database
    },
  });

  return <DayFlowCalendar calendar={calendar} />;
}
```

## 🎨 Customization

### Custom Event Colors

```tsx
const events = [
  {
    id: 1,
    title: 'Important Meeting',
    date: new Date(),
    startHour: 9,
    endHour: 10,
    color: '#ef4444', // Red
  },
  {
    id: 2,
    title: 'Workshop',
    date: new Date(),
    startHour: 14,
    endHour: 16,
    color: '#8b5cf6', // Purple
  },
];
```

### Custom Drag Indicator

```tsx
import { DragIndicatorRenderer } from 'dayflow';

const customRenderer: DragIndicatorRenderer = {
  renderDefaultContent: props => (
    <div className="custom-drag-indicator">{props.title}</div>
  ),
  renderAllDayContent: props => (
    <div className="custom-allday-indicator">All Day: {props.title}</div>
  ),
  renderRegularContent: props => (
    <div className="custom-regular-indicator">
      {props.formatTime?.(props.drag.startHour)} - {props.title}
    </div>
  ),
};
```

## 📚 API Reference

### Core Hooks

#### `useCalendarApp(config)`

Creates a calendar application instance.

**Parameters:**

- `config.views`: Array of view factories
- `config.initialDate`: Initial date to display
- `config.initialView`: Initial view type
- `config.events`: Initial events array
- `config.onEventCreate`: Callback when event is created
- `config.onEventUpdate`: Callback when event is updated
- `config.onEventDelete`: Callback when event is deleted

**Returns:**

- Calendar application instance

### View Factories

- `createDayView()` - Creates a day view
- `createWeekView()` - Creates a week view
- `createMonthView()` - Creates a month view
- `createYearView()` - Creates a year view

### Components

- `DayFlowCalendar` - Main calendar rendering component
- `Event` - Individual event component

### Types

#### `Event`

```typescript
interface Event {
  id: number;
  title: string;
  date: Date;
  startHour: number;
  endHour: number;
  color?: string;
  isAllDay?: boolean;
  startDate?: Date;
  endDate?: Date;
  day?: number;
}
```

#### `ViewType`

```typescript
enum ViewType {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
}
```

## 🔌 Plugins

The library includes built-in plugins:

- **Events Plugin**: Manages event state and operations
- **Drag Plugin**: Provides drag-and-drop functionality

You can create custom plugins by implementing the `CalendarPlugin` interface.

## 🎯 Advanced Usage

### Custom Plugin

```typescript
import { CalendarPlugin } from 'dayflow';

const myCustomPlugin: CalendarPlugin = {
  name: 'myCustomPlugin',
  initialize: context => {
    // Plugin initialization
    return {
      // Plugin API
      customMethod: () => {
        console.log('Custom method called');
      },
    };
  },
};

const calendar = useCalendarApp({
  views: [createMonthView()],
  plugins: [myCustomPlugin],
});
```

### Virtual Scrolling

The calendar automatically uses virtual scrolling for better performance with large datasets, especially in Month and Year views.

## 🧪 Testing

DayFlow includes comprehensive testing support:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

Example test:

```typescript
import { CalendarApp } from 'dayflow';
import { ViewType } from 'dayflow/types';

describe('Calendar Events', () => {
  it('should add an event', () => {
    const app = new CalendarApp({
      views: [createMonthView()],
      events: [],
      defaultView: ViewType.MONTH,
    });

    app.addEvent({
      id: 'test-1',
      title: 'Test Event',
      start: new Date(),
      end: new Date(),
    });

    expect(app.getAllEvents()).toHaveLength(1);
  });
});
```

See the [Testing Guide](./docs/testing.md) for more information.

## ⚡ Performance

### Bundle Size

- ESM bundle: ~237KB (minified)
- Gzipped: ~65KB
- Tree-shakeable for optimal bundle size

### Optimization Tips

1. **Import only what you need**: Tree-shaking eliminates unused code
2. **Use virtual scrolling**: Automatically enabled for large datasets
3. **Lazy load views**: Use React.lazy() for code splitting
4. **Optimize events**: Filter events by visible date range

```typescript
// Good - Only import what you need
import { useCalendarApp } from 'dayflow';
import { createMonthView } from 'dayflow/factories';

// Analyze bundle size
npm run build  // Generates bundle-analysis.html
```

See the [Performance Guide](./docs/optimization.md) for detailed optimization strategies.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT © [Jayce Li](https://github.com/JayceV552)

## 🐛 Bug Reports

If you find a bug, please file an issue on [GitHub Issues](https://github.com/JayceV552/DayFlow/issues).

## 📮 Support

For questions and support, please open an issue on GitHub.

---

Made with ❤️ by Jayce Li

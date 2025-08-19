# Internationalization Guide

This directory documents how translations are managed in the SizeWise Suite.

## Translation Files

Locale files live in `/app/i18n/` and are plain JSON maps. Example languages:

- `en.json` – English (default)
- `es.json` – Spanish

Each file mirrors the same key structure. Add additional locales by creating new JSON files with the same keys.

## Using Translations

Components access translations through the `useTranslation` hook:

```jsx
import { useTranslation } from '../../src/i18n'

function Example() {
  const { t } = useTranslation()
  return <h1>{t('project.create')}</h1>
}
```

`useTranslation` returns the current language and a setter if runtime language switching is required.

## Adding Keys

1. Define the key in every locale file.
2. Reference the key with `t('path.to.key')` in components.

## Switching Languages

```jsx
const { setLanguage } = useTranslation()
setLanguage('es') // switch to Spanish
```

The hook will re-render components when the language changes.

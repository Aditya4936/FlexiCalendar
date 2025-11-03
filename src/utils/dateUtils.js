const DAY_IN_MS = 24 * 60 * 60 * 1000

const toDate = (value) => {
  if (value instanceof Date) {
    return new Date(value.getTime())
  }

  if (typeof value === 'number') {
    return new Date(value)
  }

  if (typeof value === 'string') {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  return null
}

export const normalizeDate = (value) => {
  const date = toDate(value)
  if (!date) return null
  date.setHours(0, 0, 0, 0)
  return date
}

export const startOfMonth = (value) => {
  const date = normalizeDate(value)
  if (!date) return null
  date.setDate(1)
  return date
}

export const dateKey = (value) => {
  const date = normalizeDate(value)
  if (!date) return ''
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const isSameDay = (a, b) => {
  if (!a || !b) return false
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export const isBefore = (a, b) => {
  if (!a || !b) return false
  return a.getTime() < b.getTime()
}

export const isAfter = (a, b) => {
  if (!a || !b) return false
  return a.getTime() > b.getTime()
}

export const addMonths = (date, count) => {
  const base = startOfMonth(date)
  if (!base) return null
  base.setMonth(base.getMonth() + count)
  return base
}

export const generateMonthMatrix = (year, month, { weekStartsOn = 0 } = {}) => {
  const firstOfMonth = new Date(year, month, 1)
  const startDay = (firstOfMonth.getDay() - weekStartsOn + 7) % 7
  const gridStart = new Date(firstOfMonth)
  gridStart.setDate(firstOfMonth.getDate() - startDay)

  const weeks = []
  for (let weekIndex = 0; weekIndex < 6; weekIndex += 1) {
    const week = []
    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      const cellDate = new Date(gridStart)
      cellDate.setDate(gridStart.getDate() + weekIndex * 7 + dayIndex)
      week.push(cellDate)
    }
    weeks.push(week)
  }
  return weeks
}

const buildFormatter = (locale, options) => new Intl.DateTimeFormat(locale, options)

export const getWeekdayLabels = (locale, weekStartsOn = 0, weekdayFormatOptions) => {
  const formatter = buildFormatter(locale, {
    weekday: 'short',
    ...(weekdayFormatOptions || {})
  })

  const longFormatter = buildFormatter(locale, {
    weekday: 'long',
    ...(weekdayFormatOptions || {})
  })

  const labels = []
  for (let index = 0; index < 7; index += 1) {
    const day = (weekStartsOn + index) % 7
    // 2020-02-02 is a Sunday, adding `day` keeps weekday consistent
    const referenceDate = new Date(2020, 1, 2 + day)
    labels.push({
      short: formatter.format(referenceDate),
      long: longFormatter.format(referenceDate)
    })
  }
  return labels
}

export const formatMonthLabel = (date, locale, monthFormatOptions) => {
  const formatter = buildFormatter(locale, monthFormatOptions || { month: 'long', year: 'numeric' })
  return formatter.format(date)
}

export const isWithinRange = (date, minDate, maxDate) => {
  const normalized = normalizeDate(date)
  if (!normalized) return false
  if (minDate && isBefore(normalized, minDate)) return false
  if (maxDate && isAfter(normalized, maxDate)) return false
  return true
}

export const buildDateSet = (values = []) => {
  const set = new Set()
  values.forEach((value) => {
    const normalized = normalizeDate(value)
    if (normalized) {
      set.add(dateKey(normalized))
    }
  })
  return set
}

export const buildHighlightedMap = (values = []) => {
  const map = new Map()
  values.forEach((value) => {
    if (!value) return

    if (value instanceof Date || typeof value === 'string' || typeof value === 'number') {
      const normalized = normalizeDate(value)
      if (normalized) {
        map.set(dateKey(normalized), { kind: 'dot' })
      }
      return
    }

    if (typeof value === 'object' && value.date) {
      const normalized = normalizeDate(value.date)
      if (!normalized) return
      const key = dateKey(normalized)
      map.set(key, {
        kind: value.kind || 'dot',
        className: value.className || '',
        color: value.color,
        label: value.label
      })
    }
  })
  return map
}

export const clampDateToRange = (date, minDate, maxDate) => {
  const normalized = normalizeDate(date)
  if (!normalized) return null
  if (minDate && isBefore(normalized, minDate)) return new Date(minDate)
  if (maxDate && isAfter(normalized, maxDate)) return new Date(maxDate)
  return normalized
}

export const shiftDate = (date, offset) => {
  const normalized = normalizeDate(date)
  if (!normalized) return null
  const shifted = new Date(normalized.getTime() + offset * DAY_IN_MS)
  shifted.setHours(0, 0, 0, 0)
  return shifted
}

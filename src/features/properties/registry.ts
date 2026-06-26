import { DURATION_COLOR, formatDuration } from './duration/durationDef'
import { EVENT_DATE_COLOR, formatEventDate } from './event-date/eventDateDef'
import { EMOJI_COLOR } from './emoji/emojiDef'
import { STATUS_COLOR } from './status/statusDef'
import { GOAL_COLOR } from './goal/goalDef'
import { URL_COLOR } from './url/urlDef'

export const PROPERTY_COLORS = {
  eventDate: EVENT_DATE_COLOR,
  duration: DURATION_COLOR,
  emoji: EMOJI_COLOR,
  status: STATUS_COLOR,
  goal: GOAL_COLOR,
  url: URL_COLOR,
} as const

// Properties that render as a value chip, with how to format and colour them.
export const CHIP_DEFS = {
  eventDate: { color: EVENT_DATE_COLOR, format: formatEventDate },
  duration: { color: DURATION_COLOR, format: formatDuration },
} as const

export type ChipProperty = keyof typeof CHIP_DEFS

// Render order of the task property strip.
export const CHIP_ORDER: ChipProperty[] = ['eventDate', 'duration']

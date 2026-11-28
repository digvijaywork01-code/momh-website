/**
 * Payload `forms` record number for each hand-built enquiry form.
 *
 * Every enquiry is saved through /api/form-submissions, and Payload only
 * accepts a submission that points at an existing form record. These
 * records are created on production by
 * scripts/page-content/form-records.mts (which must use the same numbers),
 * the same way the SS site keeps FORM_IDS in utils/trackingConstants.ts.
 *
 * Plain constants with no imports: read by both the browser and the server.
 */
export const FORM_IDS = {
  appointment: 1,
  consultation: 2,
} as const

/** Book An Appointment: every field it saves, in order. */
export const APPOINTMENT_FIELD_NAMES = [
  'firstName',
  'lastName',
  'email',
  'phone',
  'city',
  'country',
  'occupation',
  'groupSize',
  'hearAboutUs',
  'queriesComments',
] as const

/** Personal Consultation: the fields before and after the optional upload. */
export const CONSULTATION_FIELDS_BEFORE_IMAGE = [
  'firstName',
  'lastName',
  'email',
  'phone',
  'city',
  'country',
  'creation',
  'recipient',
  'timeline',
  'designIdea',
] as const
export const CONSULTATION_UPLOAD_FIELDS = [
  'referenceImage',
  'referenceImageName',
  'referenceImageNote',
] as const
export const CONSULTATION_FIELDS_AFTER_IMAGE = [
  'budget',
  'contactChannel',
  'additionalNotes',
] as const

/** Book An Appointment: every answer is compulsory. */
export const APPOINTMENT_REQUIRED_FIELDS = APPOINTMENT_FIELD_NAMES

/** Personal Consultation: the compulsory answers (the starred boxes). */
export const CONSULTATION_REQUIRED_FIELDS = [
  'firstName',
  'email',
  'phone',
  'city',
  'country',
  'creation',
  'recipient',
  'timeline',
] as const

/**
 * The answers each hand-built form cannot be sent without. The spam hook
 * in src/plugins/index.ts refuses an enquiry where one is missing or only
 * spaces; the form components show a red line under the box first.
 */
export const FORM_REQUIRED_FIELDS: Readonly<Record<number, readonly string[]>> = {
  [FORM_IDS.appointment]: APPOINTMENT_REQUIRED_FIELDS,
  [FORM_IDS.consultation]: CONSULTATION_REQUIRED_FIELDS,
}

/**
 * The longest answer each field may hold, in characters, after spaces at
 * either end are removed. The spam hook refuses anything longer; the form
 * boxes stop typing at the same number (maxLength). Answers to the drop-down
 * lists are short option values.
 */
export const FIELD_MAX_LENGTH: Readonly<Record<string, number>> = {
  firstName: 100,
  lastName: 100,
  city: 100,
  country: 100,
  occupation: 100,
  groupSize: 30,
  email: 254,
  phone: 30,
  creation: 100,
  recipient: 100,
  timeline: 100,
  budget: 100,
  contactChannel: 100,
  hearAboutUs: 2000,
  queriesComments: 2000,
  designIdea: 2000,
  additionalNotes: 2000,
  referenceImage: 200,
  referenceImageName: 200,
  referenceImageNote: 200,
  // Spam-protection markers: the trap box, the signed time pass and
  // Google's reCAPTCHA token (about 500 to 2,000 characters).
  _hp: 200,
  _t: 200,
  _rc: 4000,
}

/** Any other field (a form built in the CMS). */
export const OTHER_FIELD_MAX_LENGTH = 2000

/** The limit for one field. Own keys only, so 'constructor' gets no special number. */
export const maxLengthOf = (field: string): number =>
  Object.prototype.hasOwnProperty.call(FIELD_MAX_LENGTH, field)
    ? FIELD_MAX_LENGTH[field]
    : OTHER_FIELD_MAX_LENGTH

/**
 * The only field names each hand-built form may save (besides the spam
 * markers _hp and _t, which the spam hook strips). The spam hook in
 * src/plugins/index.ts refuses any other name for these forms, so nothing
 * can appear under a made-up or look-alike label in the team email. The
 * form components build their field lists from these same constants.
 */
export const FORM_FIELD_NAMES: Readonly<Record<number, readonly string[]>> = {
  [FORM_IDS.appointment]: APPOINTMENT_FIELD_NAMES,
  [FORM_IDS.consultation]: [
    ...CONSULTATION_FIELDS_BEFORE_IMAGE,
    ...CONSULTATION_UPLOAD_FIELDS,
    ...CONSULTATION_FIELDS_AFTER_IMAGE,
  ],
}

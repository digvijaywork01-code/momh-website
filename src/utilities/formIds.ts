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

import type { Block } from 'payload'

/**
 * AppointmentFormBlock — visit-booking enquiry form (PDF p6).
 *
 * Renders the full PDF-spec form used on /book-an-appointment:
 *   - Personal Details: first name, last name, email, phone,
 *                       city, country, occupation, group size
 *   - How did you hear about the Museum? (textarea)
 *   - Any queries or comments? (textarea)
 *   - reCAPTCHA "I'm not a robot"
 *   - Red filled "Book An Appointment" CTA
 *   - "Have a specific query in mind? Find answers in our
 *      *Frequently Asked Questions*." — italic + underlined FAQ link
 *
 * Field labels and option lists are HARDCODED in the component to
 * match the PDF exactly. Editors customise the submit endpoint URL,
 * the success message, the submit button label, and the FAQ link
 * target via this config — the form structure itself stays constant
 * across all uses.
 *
 * On successful submission, the form swaps itself for a centred
 * "thank you" message in place (same UX as `ConsultationForm`) —
 * no redirect, no full-page navigation. This keeps the submission
 * UX consistent across the two MOMH enquiry pages.
 */

const linkAppearances = ['default'] as const

export const AppointmentForm: Block = {
  slug: 'appointmentForm',
  interfaceName: 'AppointmentFormBlock',
  labels: {
    singular: 'Appointment Form',
    plural: 'Appointment Form blocks',
  },
  fields: [
    {
      name: 'submitLabel',
      type: 'text',
      defaultValue: 'Book An Appointment',
      admin: { description: 'Label on the form submit button.' },
    },
    {
      name: 'endpoint',
      type: 'text',
      label: 'Submission endpoint (POST URL)',
      admin: {
        description:
          'Where the form POSTs. Leave blank to show a local success message only (useful for staging or while wiring up Payload Forms).',
      },
    },
    {
      name: 'successRedirect',
      type: 'text',
      defaultValue: '/thank-you',
      admin: {
        description:
          'Where to send the visitor on successful submission. Defaults to the shared /thank-you confirmation page.',
      },
    },
    {
      // DEPRECATED — replaced by `successRedirect`. Kept on the schema
      // so Drizzle's auto-push doesn't prompt with an ambiguous
      // rename vs create + drop diff. Field is hidden from the admin
      // and ignored by the component.
      name: 'successMessage',
      type: 'textarea',
      admin: { hidden: true },
    },
    {
      name: 'backgroundColor',
      type: 'select',
      required: true,
      defaultValue: 'ivory',
      options: [
        { label: 'Ivory', value: 'ivory' },
        { label: 'Cream', value: 'cream' },
        { label: 'White', value: 'white' },
      ],
    },
    {
      name: 'faqLink',
      type: 'group',
      admin: {
        description:
          'Target of the "Frequently Asked Questions" link rendered below the submit button.',
      },
      fields: [
        {
          name: 'type',
          type: 'radio',
          defaultValue: 'custom',
          options: [
            { label: 'Internal link', value: 'reference' },
            { label: 'Custom URL', value: 'custom' },
          ],
          admin: { layout: 'horizontal' },
        },
        {
          name: 'reference',
          type: 'relationship',
          relationTo: ['pages', 'posts'],
          admin: {
            condition: (_, siblingData) => siblingData?.type === 'reference',
          },
        },
        {
          name: 'url',
          type: 'text',
          defaultValue: '/faq',
          admin: {
            condition: (_, siblingData) => siblingData?.type === 'custom',
          },
        },
        {
          name: 'newTab',
          type: 'checkbox',
          defaultValue: false,
          label: 'Open in new tab',
        },
        // Appearance is unused for this single-style link but kept so
        // the shape matches other link groups in the project.
        {
          name: 'appearance',
          type: 'select',
          defaultValue: 'default',
          options: linkAppearances.map((a) => ({ label: a, value: a })),
          admin: { hidden: true },
        },
      ],
    },
  ],
}

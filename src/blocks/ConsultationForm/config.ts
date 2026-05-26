import type { Block } from 'payload'

/**
 * ConsultationFormBlock — multi-section bespoke-jewellery enquiry form.
 *
 * Renders the full PDF-spec form used on /personal-consultation:
 *   - Personal Details: name, email, phone, city, country
 *   - Your Requirement: what to create, who it's for, timeline
 *   - Your Design Idea: free-text + reference image upload
 *   - Preference: budget range
 *   - Consultation Preference: contact channel, any-other-notes
 *   - Submit Enquiry (red filled button)
 *
 * Field labels and option lists are HARDCODED in the component to
 * match the PDF exactly. Editors customize the SUBMIT endpoint URL,
 * the SUCCESS message, and the SUBMIT button label via this config —
 * the form structure itself stays consistent across all uses.
 *
 * Form posts JSON `{ ...fieldValues, referenceImage?: File }` to
 * `endpoint`. Leave blank for a local "thanks" message (useful while
 * wiring up a real submission handler later).
 */

export const ConsultationForm: Block = {
  slug: 'consultationForm',
  interfaceName: 'ConsultationFormBlock',
  labels: {
    singular: 'Consultation Form',
    plural: 'Consultation Form blocks',
  },
  fields: [
    {
      name: 'submitLabel',
      type: 'text',
      defaultValue: 'Submit Enquiry',
      admin: { description: 'Label on the form submit button.' },
    },
    {
      name: 'endpoint',
      type: 'text',
      label: 'Submission endpoint (POST URL)',
      admin: {
        description:
          'Where the form POSTs. Leave blank to show a local success message only.',
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
      // and ignored by the component. Safe to drop in a future
      // migration once we're confident no live submission flows
      // read it.
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
  ],
}

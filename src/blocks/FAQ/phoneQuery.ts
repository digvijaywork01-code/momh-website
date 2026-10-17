// Phones, as in the /faq page's CSS: the page's answers start closed there.
// A plain module (no 'use client') so the /faq server route can read it too.
export const FAQ_PAGE_PHONE_QUERY = '(max-width: 767.98px)'

// Set (as a JS property, not an attribute, so hydration is unaffected) on the
// .faq-page wrapper by the route's inline script on a full page load. The FAQ
// block then knows the answers were already closed before the first paint and
// leaves them alone, so an answer the visitor (or Chrome, following a search
// result's text link) opened before React loaded stays open.
export const FAQ_PAGE_CLOSED_FLAG = '__faqClosedOnLoad'

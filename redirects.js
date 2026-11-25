const redirects = async () => {
  const internetExplorerRedirect = {
    destination: '/ie-incompatible.html',
    has: [
      {
        type: 'header',
        key: 'user-agent',
        value: '(.*Trident.*)', // all ie browsers
      },
    ],
    permanent: false,
    source: '/:path((?!ie-incompatible.html$).*)', // all pages except the incompatibility page
  }

  // Plan Your Visit was merged into Book Your Appointment (Sep 2026).
  const planYourVisitRedirect = {
    source: '/plan-your-visit',
    destination: '/book-an-appointment',
    permanent: true,
  }

  // STOP-GAP until the Payload 3.93 upgrade: password reset by e-mail is
  // switched off (src/access/stopgapGate.ts). The admin's "Forgot password"
  // page would still say "Email sent", because it never looks at the status
  // of the answer. So that address goes back to the login page, where a note
  // says what to do instead (src/components/BeforeLogin). Remove this
  // redirect together with the gate.
  const forgotPasswordRedirect = {
    source: '/admin/forgot',
    destination: '/admin/login',
    permanent: false,
  }

  const redirects = [internetExplorerRedirect, planYourVisitRedirect, forgotPasswordRedirect]

  return redirects
}

export default redirects

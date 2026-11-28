import React from 'react'

const BeforeLogin: React.FC = () => {
  return (
    <div>
      <p>
        <b>Welcome to your dashboard!</b>
        {' This is where site admins will log in to manage your website.'}
      </p>
      {/* STOP-GAP until the Payload 3.93 upgrade: password reset by e-mail is
          switched off (see src/access/stopgapGate.ts). The "Forgot
          password?" link is hidden in src/app/(payload)/custom.scss and its
          address goes back to this page (redirects.js). Remove this
          paragraph, that rule and that redirect together with the gate. */}
      <p>
        {'Password reset by e-mail is switched off for now. If you forget your password, ask another site admin to set a new one for you under Users.'}
      </p>
    </div>
  )
}

export default BeforeLogin

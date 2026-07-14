import React from 'react'
import './styles.css'

export const metadata = {
  description: 'xinzhuolian official',
  title: 'xinzhuolian',
}

export default function RootLayout(props: { children: any }) {
  const { children } = props

  return (
    <html lang="en">
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}

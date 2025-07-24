import clsx from "clsx"
import Link from "@docusaurus/Link"
import useDocusaurusContext from "@docusaurus/useDocusaurusContext"
import Layout from "@theme/Layout"
import HomepageFeatures from "@site/src/components/HomepageFeatures"

import Heading from "@theme/Heading"
import styles from "./index.module.css"

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext()
  return (
    <header className={clsx("hero hero--primary", styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link className="button button--secondary button--lg" to="/docs">
            Get Started with Loopz SDK →
          </Link>
          <Link
            className="button button--outline button--secondary button--lg"
            to="https://github.com/Salad-Labs/loopz-typescript"
            style={{ marginLeft: "1rem" }}
          >
            View on GitHub
          </Link>
        </div>
      </div>
    </header>
  )
}

function QuickLinks() {
  return (
    <section className={styles.quickLinks}>
      <div className="container">
        <div className="row">
          <div className="col col--12">
            <Heading as="h2" className="text--center margin-bottom--lg">
              Quick Start
            </Heading>
          </div>
        </div>
        <div className="row">
          <div className="col col--4">
            <div className="card">
              <div className="card__header">
                <h3>🚀 Installation</h3>
              </div>
              <div className="card__body">
                <p>
                  Get up and running with the Loopz SDK in minutes. Install via
                  npm and configure your environment.
                </p>
              </div>
              <div className="card__footer">
                <Link
                  className="button button--primary button--block"
                  to="/docs/getting-started/installation"
                >
                  Install SDK
                </Link>
              </div>
            </div>
          </div>
          <div className="col col--4">
            <div className="card">
              <div className="card__header">
                <h3>📖 Quick Start Guide</h3>
              </div>
              <div className="card__body">
                <p>
                  Learn the basics of authentication, chat, and trading with our
                  comprehensive quick start tutorial.
                </p>
              </div>
              <div className="card__footer">
                <Link
                  className="button button--primary button--block"
                  to="/docs/getting-started/quick-start"
                >
                  View Tutorial
                </Link>
              </div>
            </div>
          </div>
          <div className="col col--4">
            <div className="card">
              <div className="card__header">
                <h3>💡 Use Cases</h3>
              </div>
              <div className="card__body">
                <p>
                  Explore real-world examples including NFT marketplaces, P2P
                  trading, and social trading networks.
                </p>
              </div>
              <div className="card__footer">
                <Link
                  className="button button--primary button--block"
                  to="/docs/use-cases"
                >
                  Browse Examples
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function CodeExample() {
  const codeExample = `import { LoopzProvider, useLoopzAuth } from '@salad-labs/loopz-typescript'

function App() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_LOOPZ_API_KEY,
    privyAppId: process.env.NEXT_PUBLIC_PRIVY_APP_ID,
    // ... other config
  }

  return (
    <LoopzProvider config={config}>
      <YourApp />
    </LoopzProvider>
  )
}`

  return (
    <section className={clsx("hero", styles.codeSection)}>
      <div className="container">
        <div className="row">
          <div className="col col--6">
            <Heading as="h2">Simple Integration</Heading>
            <p className="hero__subtitle">
              Get started with just a few lines of code. The Loopz SDK provides
              everything you need to build Web3 trading applications with
              integrated encrypted chat.
            </p>
            <div className={styles.features}>
              <div>OTP Authentication</div>
              <div>End-to-End Encrypted Chat</div>
              <div>NFT & Token Trading</div>
              <div>Real-time Notifications</div>
              <div>Multi-chain Support</div>
            </div>
          </div>
          <div className="col col--6">
            <pre className={styles.codeBlock}>
              <code>{codeExample}</code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function Home() {
  const { siteConfig } = useDocusaurusContext()
  return (
    <Layout
      title={`${siteConfig.title} - Build Web3 Trading Apps with Encrypted Chat`}
      description="The official TypeScript SDK for building decentralized trading applications with integrated encrypted chat, NFT marketplace capabilities, and real-time notifications."
    >
      <HomepageHeader />
      <main>
        <QuickLinks />
        <CodeExample />
      </main>
    </Layout>
  )
}

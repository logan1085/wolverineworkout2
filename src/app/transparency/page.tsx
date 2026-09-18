import type { Metadata } from "next";
import Link from "next/link";
import {
  publicSoul,
  publicMemory,
  publicPromptVersion,
} from "@/lib/health/public-documents";
import "./transparency.css";
export const metadata: Metadata = {
  title: "Our soul & memory — Wolverine",
  description:
    "Read Wolverine’s public behavior specification and learn exactly how its personal memory works.",
};
export default function TransparencyPage() {
  return (
    <main className="transparency">
      <header>
        <Link href="/" className="transparency-brand">
          wolverine<span> / open by design</span>
        </Link>
        <Link href="/">Back to your health ↗</Link>
      </header>
      <section className="transparency-hero">
        <p className="transparency-eyebrow">THE AGENT, IN THE OPEN</p>
        <h1>
          A little less black box.
          <br />
          <em>A lot more clarity.</em>
        </h1>
        <p>
          You should be able to read what guides your health agent—and
          understand what it remembers. Here are our soul and memory files, in
          plain sight.
        </p>
        <div className="transparency-actions">
          <a href="#soul">Read our soul ↓</a>
          <a href="#memory">How memory works ↓</a>
        </div>
      </section>
      <aside className="public-boundary">
        <span aria-hidden="true">◇</span>
        <div>
          <strong>Public principles. Private personal records.</strong>
          <p>
            These files describe the agent. They contain no personal memories,
            conversations, health records, or account credentials.
          </p>
        </div>
      </aside>
      <section id="soul" className="transparency-section">
        <div className="transparency-section-heading">
          <div>
            <p className="transparency-eyebrow">01 / SOUL.md</p>
            <h2>A partner for your actual life.</h2>
          </div>
          <a href="/SOUL.md" download>
            Download SOUL.md ↗
          </a>
        </div>
        <p className="section-intro">
          Wolverine exists to make your next useful decision easier. More
          workouts, more data, and longer conversations are not the goal.
        </p>
        <div className="principles">
          <article>
            <span>01</span>
            <h3>Help without pressure.</h3>
            <p>
              Practical suggestions that fit your time and energy. No guilt for
              missed workouts, no exercise to “make up” for food.
            </p>
          </article>
          <article>
            <span>02</span>
            <h3>Say what’s known.</h3>
            <p>
              Keep your reports, wearable estimates, and suggestions distinct.
              Missing data is unknown—not zero or a made-up trend.
            </p>
          </article>
          <article>
            <span>03</span>
            <h3>Stay within the role.</h3>
            <p>
              A wellness companion, not a clinician. No invented diagnoses,
              medical clearance, or claims that an action happened.
            </p>
          </article>
          <article>
            <span>04</span>
            <h3>Leave you in control.</h3>
            <p>
              Memory candidates need your review. The agent can propose a plan;
              it cannot silently save a fact or promise a reminder.
            </p>
          </article>
        </div>
        <details className="public-file">
          <summary>
            <span>Read the full soul file</span>
            <small>{publicPromptVersion}</small>
          </summary>
          <pre>{publicSoul}</pre>
        </details>
        <p className="transparency-note">
          Generated from the versioned runtime prompt. It is an intended
          behavior specification; models can still make mistakes. Sample mode
          and memory-off mode add their own runtime instructions.
        </p>
      </section>
      <section id="memory" className="transparency-section">
        <div className="transparency-section-heading">
          <div>
            <p className="transparency-eyebrow">02 / MEMORY.md</p>
            <h2>
              Remember what helps.
              <br />
              <em>Keep the controls visible.</em>
            </h2>
          </div>
          <a href="/MEMORY.md" download>
            Download MEMORY.md ↗
          </a>
        </div>
        <div className="memory-flow">
          <article>
            <span>YOU SHARE</span>
            <h3>“I prefer walks outdoors.”</h3>
            <p>
              An explicit preference can become a suggested fact, with a quote
              for you to check.
            </p>
          </article>
          <article>
            <span>YOU CONFIRM</span>
            <h3>A suggestion is not a save.</h3>
            <p>
              You approve the fact or add it yourself. Goals, preferences,
              routines, and constraints stay reviewable.
            </p>
          </article>
          <article>
            <span>THE AGENT RECALLS</span>
            <h3>A little relevant context.</h3>
            <p>
              Up to eight non-expired facts are selected for a reply, using word
              overlap and priority for goals and constraints.
            </p>
          </article>
        </div>
        <div className="memory-facts">
          <article>
            <h3>Facts and conversations are different.</h3>
            <p>
              Memory starts off in a fresh store. With it on, successful
              conversations are saved separately from facts you confirm: up to
              100 facts and 10 conversations of up to 40 messages each, within a
              total size limit.
            </p>
          </article>
          <article>
            <h3>This browser, or your configured account.</h3>
            <p>
              Without sign-in, memory lives in this browser. Configured account
              memory lives in Supabase with user-scoped access. Local facts do
              not automatically migrate when you sign in. Neither storage mode
              is an end-to-end encrypted vault.
            </p>
          </article>
          <article>
            <h3>Pause is not deletion.</h3>
            <p>
              Pausing stops saved-fact recall and new conversation saves, but
              keeps existing records. A consented reply can still use the
              current conversation and health context.
            </p>
          </article>
          <article>
            <h3>Forgetting includes old conversations.</h3>
            <p>
              Editing or forgetting a fact clears saved conversations so old
              wording cannot return through a resumed chat. Expiry only stops
              fact retrieval; it does not erase old transcript mentions.
            </p>
          </article>
        </div>
        <details className="public-file">
          <summary>
            <span>Read the full memory file</span>
            <small>Policy · September 18, 2026</small>
          </summary>
          <pre>{publicMemory}</pre>
        </details>
        <div className="transparency-actions">
          <Link href="/?tab=Memory">Open your private Memory controls ↗</Link>
        </div>
      </section>
      <section className="transparency-section sharing-section">
        <p className="transparency-eyebrow">WHAT LEAVES THE APP</p>
        <h2>No hidden promise of “zero retention.”</h2>
        <p>
          When you allow sharing and send a message, the agent sends your
          current conversation, selected memories, and limited health context to
          OpenAI. Requests use <code>store:false</code>; that does not mean zero
          retention by external providers.
        </p>
        <p>
          Fictional sample chats exclude personal memory. Strava answers stay in
          their separate live view and are not added to Wolverine’s saved
          memories or health history. The original workout coach is a separate
          experience; this page describes the main personal health agent.
        </p>
      </section>
      <footer>
        <Link href="/">← Back to Wolverine</Link>
        <p>
          Public documentation is separate from personal memory exports. Nothing
          on this page reads your account or browser memory.
        </p>
      </footer>
    </main>
  );
}
